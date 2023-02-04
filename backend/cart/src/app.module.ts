import { HttpException, Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { GraphQLModule } from "@nestjs/graphql";
import { MercuriusDriver, MercuriusDriverConfig } from "@nestjs/mercurius";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import * as path from "path";
import { GraphQLError, GraphQLFormattedError } from "graphql/error";
import { ContentService } from "./content.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CartResolver } from "./cart/cart.resolver";
import { MongooseModule } from "@nestjs/mongoose";
import {
	CartMongo,
	CartMongoSchema,
	PurchaseMongo,
	PurchaseMongoSchema,
} from "./cart/cart.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: CartMongo.name, schema: CartMongoSchema },
			{ name: PurchaseMongo.name, schema: PurchaseMongoSchema },
		]),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (config: ConfigService) => {
				// prettier-ignore
				const connString = `mongodb://${config.get("MONGODB_USER")}:${config.get("MONGODB_PASSWORD")}@${config.get("MONGODB_HOST")}:${config.get("MONGODB_PORT")}/${config.get("MONGODB_DATABASE")}`;
				// console.log(connString);
				return { uri: connString };
			},
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
					url: `${config.get("AUTH_HOST")}:${config.get("AUTH_PORT")}`,
					loader: {
						defaults: true,
					},
				},
			}),
		}]),
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.default("production")
					.valid("development", "production", "test"),
				PORT: Joi.number().port().required(),
				BIND_IP: Joi.string().default("127.0.0.1"),
				MONGODB_HOST: Joi.string().required(),
				MONGODB_PORT: Joi.number().required(),
				MONGODB_USER: Joi.string().required(),
				MONGODB_PASSWORD: Joi.string().required(),
				MONGODB_DATABASE: Joi.string().required(),
				PSQL_HOST: Joi.string().required(),
				PSQL_PORT: Joi.number().required(),
				PSQL_USERNAME: Joi.string().required(),
				PSQL_DATABASE: Joi.string().required(),
				AUTH_HOST: Joi.string()
					.required()
					.description("Auth microservice host"),
				AUTH_PORT: Joi.number()
					.port()
					.required()
					.description("Auth microservice port"),
				ALLOWED_ORIGINS: Joi.string().required(),
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
				graphiql: true,
				playground: true, // leave it as true as it is a mock app. config.get("NODE_ENV") !== "production"
			}),
		}),
	],
	controllers: [],
	providers: [AppService, ContentService, CartResolver],
})
export class AppModule {}
