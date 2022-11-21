import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import * as Joi from "joi";

export enum Gender {
	MALE = 0,
	FEMALE = 1,
	RATHER_NOT_SAY = 2
}

registerEnumType(Gender, {
	name: "Gender",
});

@ObjectType()
export class User {
	@Field()
	id: string;

	@Field()
	firstName: string;

	@Field()
	lastName: string;

	@Field({ description: "Date of birth in ISO 8601 (js default)" })
	dob: string;

	@Field()
	email: string;

	@Field()
	username: string;

	@Field(() => Gender)
	gender: Gender;
}

@InputType()
export class UserRegistrationInput {
	@Field()
	firstName: string;

	@Field()
	lastName: string;

	@Field({ description: "Date of birth in ISO 8601 (js default)" })
	dob: string;

	@Field()
	email: string;

	@Field()
	username: string;

	@Field()
	password: string;

	@Field()
	gender: string;
}

const registrationJoi = Joi.object({
	firstName: Joi.string().min(2).max(100).required(),
	lastName: Joi.string().min(2).max(100).required(),
	dob: Joi.date().required(),
	email: Joi.string().email().required(),
	username: Joi.string().min(2).max(100).required(),
	password: Joi.string().min(8).max(500).required(),
	gender: Joi.string().valid("RATHER_NOT_SAY", "MALE", "FEMALE"),
});
export { registrationJoi };

@InputType()
export class UserLoginInput {
	@Field({ description: "Could be either the username or email" })
	username: string;

	@Field()
	password: string;
}

const loginJoi = Joi.object({
	username: Joi.string().min(2).max(100).required(),
	password: Joi.string().min(8).max(500).required(),
});
export { loginJoi };
