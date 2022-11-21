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
				DB_HOST: Joi.string(),
				DB_PORT: Joi.number(),
				DB_USERNAME: Joi.string(),
				DB_PASSWORD: Joi.string(),
				DB_DATABASE: Joi.string(),
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
