import { Args, ID, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Cart } from "./cart.model";
import { ExtractedJWTPayload } from "../auth/extracted-jwt-payload.decorator";
import { JWTPayload } from "../auth/jwt-payload";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";

@Resolver(() => Cart)
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(

	) {
	}

	@Query(() => [Cart])
	async cart(
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<Cart> {
		// TODO return cart
		return null;
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
}
