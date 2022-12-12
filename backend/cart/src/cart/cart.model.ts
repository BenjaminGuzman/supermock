import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class TrackInCart {
	@Field(() => Int)
	id: number;

	@Field()
	title: string;

	@Field({ nullable: true })
	link?: string;

	@Field({ nullable: true })
	preview?: string;

	@Field()
	price: string;

	@Field()
	dateAdded: string;
}

@ObjectType("Cart")
export class GQLCart {
	@Field(() => ID)
	id: string;

	@Field()
	total: string;

	@Field(() => [TrackInCart])
	tracks: TrackInCart[];
}
