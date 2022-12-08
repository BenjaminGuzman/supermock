import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { GqlExecutionContext } from "@nestjs/graphql";
import { extractJWT } from "./extracted-jwt-payload.decorator";
import { AuthService } from "./auth-service";
import { VerificationStatus } from "./verification-status.enum";

@Injectable()
export class AuthGuard implements CanActivate {
	private authService: AuthService;

	constructor(@Inject("AUTH_PACKAGE") private grpcClient: ClientGrpc) {
		this.authService =
			this.grpcClient.getService<AuthService>("AuthService");
	}

	canActivate(
		ctx: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const request = GqlExecutionContext.create(ctx).getContext().req;
		const headers: Record<string, string> = request.headers;
		const authHeader: string | undefined = headers["authorization"];

		if (!authHeader) return false;

		const jwt = extractJWT(authHeader);

		return new Promise<boolean>((resolve, reject) => {
			this.authService.verifyJWT({ jwt: jwt }).subscribe({
				next: (decodeResult) => {
					if (decodeResult.status === VerificationStatus.VALID)
						return resolve(true);
					return resolve(false);
				},
				error: (err: Error) => {
					console.error(err);
					resolve(false);
				},
			});
		});
	}
}
