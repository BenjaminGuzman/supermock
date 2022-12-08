import { HttpException, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersResolver } from "./users/users.resolver";
import * as path from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./users/user.entity";
import { JwtModule } from "@nestjs/jwt";
import * as Joi from "joi";
import { GraphQLError, GraphQLFormattedError } from "graphql/index";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid("development", "production", "test")
					.required(),
				PORT: Joi.number().port().required(),
				BIND_IP: Joi.string().required(),
				DB_HOST: Joi.string().required(),
				DB_PORT: Joi.number().required(),
				DB_USERNAME: Joi.string().required(),
				DB_PASSWORD: Joi.string().required(),
				DB_DATABASE: Joi.string().required(),
				AUTH_HOST: Joi.string()
					.required()
					.description("Auth microservice host"),
				AUTH_PORT: Joi.number()
					.port()
					.required()
					.description("Auth microservice port"),
			}),
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				type: "postgres",
				host: config.get<string>("DB_HOST"),
				port: config.get<number>("DB_PORT"),
				username: config.get<string>("DB_USERNAME"),
				password: config.get<string>("DB_PASSWORD"),
				database: config.get<string>("DB_DATABASE"),
				schema: "public",
				entities: [UserEntity],
			}),
		}),
		TypeOrmModule.forFeature([UserEntity]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				secret: config.get<string>("JWT_SECRET"),
				signOptions: {
					expiresIn: config.get<string>("JWT_EXPIRATION"),
				},
			}),
		}),
		GraphQLModule.forRootAsync<ApolloDriverConfig>({
			driver: ApolloDriver,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				debug: config.get<string>("NODE_ENV") !== "production",
				autoSchemaFile: path.join(process.cwd(), "src/schema.gql"),
				useGlobalPrefix: true,
				formatError: (error: GraphQLError) => {
					let message: string = error.message;
					if (error.originalError instanceof HttpException)
						message = error.originalError.getResponse() as string;
					// else
					//   console.error(JSON.stringify(error));

					const formatted: GraphQLFormattedError = {
						message: message,
						locations: error.locations,
						path: error.path,
					};
					return formatted;
				},
				playground: true, // leave it as true as it is a mock app. config.get("NODE_ENV") !== "production"
			}),
		}),
		// prettier-ignore
		ClientsModule.registerAsync([{
			name: "AUTH_PACKAGE",
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => ({
				transport: Transport.GRPC,
				options: {
					package: "auth",
					protoPath: path.join(__dirname, "auth/auth.proto"),
					url: `${config.get("AUTH_HOST")}:${config.get("AUTH_PORT")}`
				}
			}),
		}]),
	],
	controllers: [AppController],
	providers: [AppService, UsersResolver],
})
export class AppModule {}
