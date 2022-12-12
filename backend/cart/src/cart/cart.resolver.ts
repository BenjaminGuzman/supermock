import { Args, ID, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GQLCart } from "./cart.model";
import { ExtractedJWTPayload } from "../auth/extracted-jwt-payload.decorator";
import { JWTPayload } from "../auth/jwt-payload";
import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { InjectModel } from "@nestjs/mongoose";
import { CartDocument, CartMongo } from "./cart.schema";
import { Model } from "mongoose";
import { ContentService, Track } from "../content.service";
import Decimal from "decimal.js";

@Resolver(() => GQLCart)
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(
		@InjectModel(CartMongo.name) private cartModel: Model<CartDocument>,
		private contentService: ContentService
	) {}

	@Query(() => GQLCart, { nullable: true })
	async cart(
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		const userId = jwtPayload.userId;
		const cart = await this.cartModel.findOne({ userId: userId });
		// console.log(cart);

		if (!cart) return null;
		return this.mongoCart2GQL(cart);
	}

	@Mutation(() => Int, {
		description:
			"Add tracks to the user cart. Returns the number of tracks added",
	})
	async addTracks(
		@Args("ids", { type: () => [ID], nullable: false })
		ids: string[],
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	) {
		let tracks: Track[] = [];
		try {
			tracks = await this.contentService.getTracks(ids);
		} catch (e) {
			throw new InternalServerErrorException();
		}
		if (tracks.length === 0) return 0; // probably we were given invalid ids

		const subtotal: Decimal = tracks
			.map((track: Track) => track.price)
			.map((price: string) => new Decimal(price))
			.reduce((prev: Decimal, curr: Decimal) => prev.add(curr));

		const userId = jwtPayload.userId;
		const cart = await this.cartModel.findOne({
			userId: userId,
		});
		let upsertQuery: Record<any, any> = {};
		if (!cart) {
			upsertQuery = {$set: {}};
		}
		return 0;
	}

	@Mutation(() => Int, { description: "Add all album's tracks to cart" })
	async addAlbums(
		@Args("ids", { type: () => [ID], nullable: false }) ids,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	) {
		// TODO add all album's tracks to cart
		return 0;
	}

	@Mutation(() => Int, { description: "Add all artist's tracks to cart" })
	async addArtists(
		@Args("ids", { type: () => [ID], nullable: false }) ids,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	) {
		// TODO add all artist's tracks to cart
		return 0;
	}

	private mongoCart2GQL(cart): GQLCart {
		// currently, the graphql schema is a subset (projection)
		// of the mongo schema. So, it is safe to simply cast the objects
		// If it is no longer true that graphql schema ⊂ mongo schema
		// then, update this method!
		return cart as GQLCart;
	}
}
