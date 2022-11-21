import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Track {
	@Field(() => Int)
	id: number;

	@Field()
	title: string;

	@Field({ nullable: true })
	link?: string;

	@Field({ nullable: true })
	preview?: string;

	@Field(() => Int)
	price: number;
}
