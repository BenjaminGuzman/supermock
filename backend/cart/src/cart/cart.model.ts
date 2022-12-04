import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { HydratedDocument } from "mongoose";

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

@ObjectType()
export class AlbumInCart {
	@Field(() => Int)
	id: number;

	@Field()
	title: string;

	@Field({ description: "URL to deezer's cover image", nullable: true })
	cover?: string;

	@Field(() => [TrackInCart])
	tracksInCart: TrackInCart[];

	@Field()
	subtotal: string;
}

@ObjectType()
export class ArtistInCart {
	@Field(() => Int)
	id: number;

	@Field()
	name: string;

	@Field({ nullable: true })
	picture?: string;

	@Field(() => [AlbumInCart])
	albumsInCart: AlbumInCart[];

	@Field()
	subtotal: string;
}

@ObjectType()
export class GQLCart {
	@Field(() => ID)
	id: string;

	@Field()
	total: string;

	@Field(() => [ArtistInCart])
	artistsInCart: ArtistInCart[];
}
