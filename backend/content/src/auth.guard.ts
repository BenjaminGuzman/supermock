import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Observable } from "rxjs";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
	private readonly NODE_ENV: string;

	constructor(private configService: ConfigService) {
		super();
		this.NODE_ENV = this.configService.get("NODE_ENV") || "production";
	}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		if (this.NODE_ENV === "development")
			return true;

		return super.canActivate(context);
	}

	getRequest(context: ExecutionContext) {
		const ctx = GqlExecutionContext.create(context);
		return ctx.getContext().req;
	}
}
