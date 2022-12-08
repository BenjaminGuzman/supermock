import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
	FastifyAdapter,
	NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);
	app.setGlobalPrefix("/v2/cart");

	const config = app.get<ConfigService>(ConfigService);
	app.enableCors({
		origin:
			config.get("NODE_ENV") === "production"
				? "https://test.benjaminguzman.dev"
				: "*",
	});
	await app.listen(config.get("PORT"), config.get("BIND_IP"));
}

bootstrap();
