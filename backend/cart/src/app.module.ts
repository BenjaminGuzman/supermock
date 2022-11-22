import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { GraphQLModule } from "@nestjs/graphql";
import { MercuriusDriver, MercuriusDriverConfig } from "@nestjs/mercurius";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

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
		GraphQLModule.forRoot<MercuriusDriverConfig>({
			driver: MercuriusDriver,
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {
}
