import { Observable } from "rxjs";
import { VerificationStatus } from "./verification-status.enum";

export interface AuthService {
	createJWT(userId: { userId: string }): Observable<{ jwt: string }>;
	verifyJWT(jwt: {
		jwt: string;
	}): Observable<{ status: VerificationStatus; userId: string }>;
}
