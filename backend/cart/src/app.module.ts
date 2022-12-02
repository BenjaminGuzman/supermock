import { HttpException, Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { GraphQLModule } from "@nestjs/graphql";
import { MercuriusDriver, MercuriusDriverConfig } from "@nestjs/mercurius";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import * as path from "path";
import { GraphQLError, GraphQLFormattedError } from "graphql/error";
import { CartService } from "./cart.service";
import { ContentService } from "./content.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CartResolver } from "./cart/cart.resolver";

@Module({
	imports: [
		ClientsModule.register([
			{
				name: "AUTH_PACKAGE",
				transport: Transport.GRPC,
				options: {
					package: "auth",
					protoPath: path.join(__dirname, "auth/auth.proto"),
				},
			},
		]),
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid(
					"development",
					"production",
					"test",
				),
				PORT: Joi.number().port(),
				BIND_IP: Joi.string(),
				MONGODB_HOST: Joi.string(),
				MONGODB_PORT: Joi.number(),
				MONGODB_USERNAME: Joi.string(),
				MONGODB_PASSWORD: Joi.string(),
				MONGODB_DATABASE: Joi.string(),
				PSQL_HOST: Joi.string(),
				PSQL_PORT: Joi.number(),
				PSQL_USERNAME: Joi.string(),
				PSQL_DATABASE: Joi.string(),
				JWT_SECRET: Joi.string(),
				JWT_EXPIRATION: Joi.string(),
			}),
		}),
		GraphQLModule.forRootAsync<MercuriusDriverConfig>({
			driver: MercuriusDriver,
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
	controllers: [],
	providers: [AppService, CartService, ContentService, CartResolver],
})
export class AppModule {}
