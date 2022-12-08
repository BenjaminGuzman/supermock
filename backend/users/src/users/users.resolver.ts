import {
	BadRequestException,
	ForbiddenException,
	Inject,
	InternalServerErrorException,
	UseGuards,
} from "@nestjs/common";
import {
	Gender,
	loginJoi,
	registrationJoi,
	User,
	UserRegistrationInput,
} from "./user.model";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JWTPayload } from "../JWTPayload";
import { AuthGuard } from "../auth/auth.guard";
import { ClientGrpc } from "@nestjs/microservices";
import { AuthService } from "../auth/auth-service";

@Resolver(() => User)
export class UsersResolver {
	static readonly BCRYPT_ROUNDS = 10;
	private authService: AuthService;

	constructor(
		@InjectRepository(UserEntity)
		private usersRepo: Repository<UserEntity>,
		@Inject("AUTH_PACKAGE") private grpcClient: ClientGrpc,
	) {
		this.authService =
			this.grpcClient.getService<AuthService>("AuthService");
	}

	@Mutation(() => User)
	@UseGuards(AuthGuard)
	async registerUser(
		@Args("userData") userData: UserRegistrationInput,
	): Promise<User> {
		const validationResult = registrationJoi.validate(userData);
		if (validationResult.error)
			throw new BadRequestException(validationResult, "Body is invalid");

		const passwordPromise = bcrypt.hash(
			userData.password,
			UsersResolver.BCRYPT_ROUNDS,
		);

		const user = new UserEntity();
		user.dob = new Date(userData.dob);
		user.email = userData.email;
		user.username = userData.username;
		user.firstName = userData.firstName;
		user.lastName = userData.lastName;

		// TODO properly manage this gender enum
		let gender: Gender;
		switch (userData.gender) {
			case "FEMALE":
				gender = Gender.FEMALE;
				break;
			case "MALE":
				gender = Gender.MALE;
				break;
			case "RATHER_NOT_SAY":
				gender = Gender.RATHER_NOT_SAY;
				break;
		}
		user.gender = gender;

		try {
			user.password = await passwordPromise;
		} catch (e) {
			console.error("Error generating password hash", e);
			throw new InternalServerErrorException();
		}

		try {
			return UsersResolver.typeormUser2GQL(
				await this.usersRepo.save(user),
			);
		} catch (e) {
			if (e.code === "23505")
				// handle unique constraint violation
				throw new BadRequestException(
					null,
					"Username or email already registered",
				);

			console.error("Error saving user", e);
			throw new InternalServerErrorException(
				null,
				"Error while registering the user",
			);
		}
	}

	@Query(() => String)
	async login(
		@Args("username", { type: () => String }) username,
		@Args("password", { type: () => String }) password,
	): Promise<string> {
		const validationResult = loginJoi.validate({ username, password });
		if (validationResult.error)
			throw new BadRequestException(validationResult, "Body is invalid");

		// get the user by username or email
		let user: UserEntity | null;
		try {
			user = await this.usersRepo
				.createQueryBuilder()
				.where("username=:username OR email=:username", {
					username: username,
				})
				.getOne();
		} catch (e) {
			console.log("User login error", e);
			throw new InternalServerErrorException();
		}

		// yes, as it is a mock app giving more insights on the invalid data is not so bad
		if (user === null)
			throw new ForbiddenException(null, "Invalid username");

		// check the password is correct
		let isPasswordOk;
		try {
			isPasswordOk = await bcrypt.compare(password, user.password);
		} catch (e) {
			console.log("Error while verifying password", e);
			throw new InternalServerErrorException();
		}

		if (!isPasswordOk)
			throw new ForbiddenException(null, "Invalid password");

		const jwtPayload: JWTPayload = { userId: user.id };

		return new Promise((resolve, reject) => {
			this.authService.createJWT(jwtPayload).subscribe({
				next: (res) => {
					return resolve(res.jwt);
				},
				error: (e: Error) => {
					console.error(e);
					reject();
				},
			});
		});
	}

	private static typeormUser2GQL(user: UserEntity): User {
		return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			dob: user.dob.toISOString(),
			username: user.username,
			gender: this.typeormGender2GQL(user.gender),
		};
	}

	private static gqlGender2Typeorm(gender: Gender): number {
		switch (gender) {
			case Gender.FEMALE:
				return 0;
			case Gender.MALE:
				return 1;
			case Gender.RATHER_NOT_SAY:
				return 2;
		}
	}

	private static typeormGender2GQL(gender: number): Gender {
		switch (gender) {
			case 0:
				return Gender.FEMALE;
			case 1:
				return Gender.MALE;
			case 2:
				return Gender.RATHER_NOT_SAY;
		}
	}
}
