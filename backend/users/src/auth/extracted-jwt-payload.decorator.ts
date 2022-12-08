import {
	createParamDecorator,
	ExecutionContext,
	HttpException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JWTPayload } from "./jwt-payload";

export const ExtractedJWTPayload = createParamDecorator(
	(data: unknown, context: ExecutionContext): JWTPayload | undefined => {
		const ctx = GqlExecutionContext.create(context);

		// the user should use the auth guard before this decorator to ensure jwt is present and is valid
		const authHeader: string | undefined =
			ctx.getContext().req?.headers["authorization"];

		try {
			return extractJWTPayload(authHeader);
		} catch (e) {
			return undefined;
		}
	},
);

/**
 * Extracts the JWT from the header
 * @param authHeader the authorization header as receiver from the client. Example: Bearer <JWT>
 * @return the extracted payload or undefined if the format is not valid
 */
export const extractJWT = (authHeader: string): string | undefined => {
	// extract the JWT that should be placed after "Bearer" (the auth method)
	// format is "Bearer <JWT>", that's why "Bearer" is being removed by just splitting the text
	const [, jwt] = authHeader.split(" ", 2);
	return jwt?.trim();
};

/**
 * Extract and parse the given Base64 encoded string into a JSON object (the payload)
 * @param authHeader the authorization header as received from the client. Example: Bearer <JWT>
 * @throws {@link HttpException} if the JWT is not present
 */
export const extractJWTPayload = (
	authHeader: string | undefined,
): JWTPayload => {
	const jwt: string | undefined = authHeader
		? extractJWT(authHeader)
		: undefined;
	if (!jwt) throw new HttpException("invalid jwt", 403);

	const [, payload64Str] = jwt.split(".", 3);

	// decode the base 64 string
	const jsonPayload = Buffer.from(payload64Str, "base64").toString("utf-8");
	return JSON.parse(jsonPayload) as unknown as JWTPayload;
};
