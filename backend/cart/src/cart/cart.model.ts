import { Field, ID, InputType, Int, ObjectType } from "@nestjs/graphql";

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

@ObjectType("Cart")
export class GQLCart {
	@Field(() => ID)
	id: string;

	@Field()
	total: string;

	@Field(() => [ArtistInCart], {
		description:
			"Tracks in cart grouped by artist and album. " +
			"This exists to ease the computation of subtotal prices " +
			"(exact currency operations must be done in backend)",
	})
	artistsInCart: ArtistInCart[];

	@Field(() => [TrackInCart], {
		description: "Tracks in cart. (Flat array, data is not grouped)",
	})
	tracksInCart: TrackInCart[];
}

@InputType()
export class PaymentInput {
	@Field({ description: "Field is ignored. You can assign an empty string" })
	cardNumber: string;

	@Field({ description: "Field is ignored. You can assign an empty string" })
	cardHolderName: string;

	@Field({ description: "Field is ignored. You can assign an empty string" })
	country: string;

	@Field({ description: "Field is ignored. You can assign an empty string" })
	zipCode: string;

	@Field({
		description:
			"ISO-8601 formatted date. Field is ignored. You can assign an empty string",
	})
	expirationDate: string;

	@Field(() => Int, { description: "Field is ignored. You can assign 0" })
	cvv: number;
}

@InputType()
export class BillingInput {
	@Field()
	name: string;

	@Field({ description: "Address line 1" })
	address1: string;

	@Field({ description: "Address line 2", nullable: true })
	address2?: string;

	@Field({ description: "ISO 3166 alpha-2 country code" })
	country: string;

	@Field()
	state: string;

	@Field({ description: "Zip code" })
	zipCode: string;

	@Field()
	email: string;
}

@InputType()
export class PurchaseInput {
	@Field(() => PaymentInput)
	payment: PaymentInput;

	@Field(() => BillingInput)
	billing: BillingInput;
}

@ObjectType()
export class Billing {
	@Field()
	name: string;

	@Field({ description: "Address line 1" })
	address1: string;

	@Field({ description: "Address line 2", nullable: true })
	address2?: string;

	@Field({ description: "ISO 3166 alpha-2 country code" })
	country: string;

	@Field()
	state: string;

	@Field({ description: "Zip code" })
	zipCode: string;

	@Field()
	email: string;
}

@ObjectType("Purchase")
export class GQLPurchase {
	@Field(() => ID)
	id: string;

	@Field({ description: "ISO-8601 formatted date" })
	purchaseDate: string;

	@Field(() => GQLCart)
	cart: GQLCart;

	@Field({
		description:
			"Email registered in billing information when purchase was completed",
	})
	email: string;

	@Field(() => Billing)
	billing: Billing;
}
