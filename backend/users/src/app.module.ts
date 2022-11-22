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

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid(
					"development",
					"production",
					"test",
				),
				PORT: Joi.number().port(),
				BIND_IP: Joi.string(),
				DB_HOST: Joi.string(),
				DB_PORT: Joi.number(),
				DB_USERNAME: Joi.string(),
				DB_PASSWORD: Joi.string(),
				DB_DATABASE: Joi.string(),
				JWT_SECRET: Joi.string(),
				JWT_EXPIRATION: Joi.string(),
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
	],
	controllers: [AppController],
	providers: [AppService, UsersResolver],
})
export class AppModule {}
