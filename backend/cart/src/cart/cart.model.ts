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

// professional solution would be to actually extend the schema by using Apollo federation or something like that
@ObjectType({
	description: "Extension of the Album type from content microservice",
})
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

@ObjectType({
	description: "Extension of the Artist type from content microservice",
})
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

	@Field(() => [ArtistInCart], {
		description: "Tracks in cart grouped by artist and album",
	})
	artistsInCart: ArtistInCart[];

	@Field(() => [TrackInCart], {
		description: "Tracks in cart. (Flat array, data is not grouped)",
	})
	tracksInCart: TrackInCart[];
}
