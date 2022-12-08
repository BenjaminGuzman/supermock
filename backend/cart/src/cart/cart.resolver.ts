import { Args, ID, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GQLCart } from "./cart.model";
import { ExtractedJWTPayload } from "../auth/extracted-jwt-payload.decorator";
import { JWTPayload } from "../auth/jwt-payload";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { InjectModel } from "@nestjs/mongoose";
import { CartDocument, CartMongo } from "./cart.schema";
import { Model } from "mongoose";

@Resolver(() => GQLCart)
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(
		@InjectModel(CartMongo.name) private cartModel: Model<CartDocument>,
	) {}

	@Query(() => GQLCart)
	async cart(
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		const userId = jwtPayload.userId;
		const cart = await this.cartModel.findOne({ userId: userId });
		console.log(cart);

		if (!cart) return null;
		return this.mongoCart2GQL(cart);
	}

	@Mutation(() => Int)
	async addTracks(
		@Args("tracksId", { type: () => [ID], nullable: false }) tracksId,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	) {
		// TODO add track to cart
		return 0;
	}

	@Mutation(() => Int)
	async addAlbums(
		@Args("albumsId", { type: () => [ID], nullable: false }) albumsId,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	) {
		// TODO add all album's tracks to cart
		return 0;
	}

	@Mutation(() => Int)
	async addArtists(
		@Args("artistsId", { type: () => [ID], nullable: false }) artistsId,
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
