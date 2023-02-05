import { Args, ID, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
	AlbumInCart,
	ArtistInCart,
	GQLCart,
	PaymentInput,
	GQLPurchase,
	PurchaseInput,
	TrackInCart,
} from "./cart.model";
import { ExtractedJWTPayload } from "../auth/extracted-jwt-payload.decorator";
import { JWTPayload } from "../auth/jwt-payload";
import {
	BadRequestException,
	InternalServerErrorException,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { InjectModel } from "@nestjs/mongoose";
import {
	CartMongo,
	CartMongoDoc,
	PurchaseMongo,
	PurchaseMongoDoc,
} from "./cart.schema";
import { Model } from "mongoose";
import { ContentService } from "../content.service";
import Decimal from "decimal.js";
import { Track } from "../content/track";
import { Artist } from "../content/artist";
import { Album } from "../content/album";

@Resolver(() => GQLCart)
@UseGuards(AuthGuard)
export class CartResolver {
	constructor(
		@InjectModel(CartMongo.name)
		private cartModel: Model<CartMongoDoc>,
		@InjectModel(PurchaseMongo.name)
		private purchaseModel: Model<PurchaseMongoDoc>,
		private contentService: ContentService,
	) {}

	@Query(() => GQLCart, { nullable: true })
	async cart(
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		const userId = jwtPayload.userId;
		let cart: CartMongoDoc;
		try {
			cart = await this.cartModel.findOne({ userId: userId });
		} catch (e) {
			console.error("Failed to retrieve cart", e);
			throw new InternalServerErrorException("Failed to retrieve cart");
		}
		// console.log(cart);

		if (!cart) return null;
		return this.mongoCart2GQL(cart);
	}

	@Mutation(() => GQLCart, {
		nullable: true,
		description:
			"Add tracks to the user cart. " +
			"Returns the updated cart or null if at least one track id was invalid (or it was already in cart)",
	})
	async addTracks(
		@Args("ids", { type: () => [ID], nullable: false })
		ids: string[],
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		const userId = jwtPayload.userId;
		let tracks: Track[] = [];
		try {
			tracks = await this.contentService.getTracks(ids);
		} catch (e) {
			console.error("Couldn't get tracks from content service", e);
			throw new InternalServerErrorException("Integration error");
		}
		if (tracks.length === 0) return null; // probably we were given invalid ids

		let cart: CartMongoDoc;
		try {
			cart = await this.cartModel.findOne({ userId });
		} catch (e) {
			console.error("Failed to find user's cart", e);
			throw new InternalServerErrorException("Failed to find cart");
		}
		if (!cart) {
			const c: CartMongo = {
				userId: userId,
				tracksInCart: [],
			};
			cart = new this.cartModel(c);
		}

		// check none of the tracks to be inserted to cart are already in it
		const idsMap = tracks
			.map((track) => track.id)
			.reduce((map: Map<number, boolean>, id: number) => {
				map.set(id, true);
				return map;
			}, new Map<number, boolean>());
		const wouldProduceDuplicates = cart.tracksInCart.find((track) =>
			idsMap.has(track.id),
		);
		if (wouldProduceDuplicates)
			throw new BadRequestException("Track already in cart");

		// now we know no duplicates will be produced
		const now = new Date();
		cart.tracksInCart.push(
			...tracks.map((track) => ({
				id: track.id,
				title: track.title,
				price: track.price,
				preview: track.preview,
				link: track.link,
				dateAdded: now,
				album: track.album,
			})),
		);

		try {
			await cart.save();
		} catch (e) {
			console.error("Failed to save cart", e);
			throw new InternalServerErrorException("Database error");
		}

		return this.mongoCart2GQL(cart);
	}

	@Mutation(() => GQLCart, {
		nullable: false,
		description: "Delete tracks on user's cart. Returns the updated cart",
	})
	async deleteTracks(
		@Args("ids", { type: () => [ID], nullable: false })
		ids: string[],
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		const userId = jwtPayload.userId;
		let cart: CartMongoDoc;
		try {
			cart = await this.cartModel.findOneAndUpdate(
				{ userId },
				{ $pull: { tracksInCart: { id: { $in: ids.map(parseInt) } } } },
				{ returnDocument: "after" },
			);
		} catch (e) {
			console.error("Failed to find user's cart", e);
			throw new InternalServerErrorException("Failed to find cart");
		}

		try {
			await cart.save();
		} catch (e) {
			console.error("Failed to save cart", e);
			throw new InternalServerErrorException("Database error");
		}

		return this.mongoCart2GQL(cart);
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

	@Mutation(() => GQLCart, {
		description:
			"Purchase the user's shopping cart. " +
			"Returns the shopping cart on success or null on failure",
		nullable: true,
	})
	async purchase(
		@Args("details", { type: () => PurchaseInput, nullable: false })
		details: PurchaseInput,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLCart> {
		let cart: CartMongoDoc;
		try {
			cart = await this.cartModel.findOne({ userId: jwtPayload.userId });
		} catch (e) {
			console.error("Failed to find user's cart", e);
			throw new InternalServerErrorException("Failed to find cart");
		}
		if (!cart || cart.tracksInCart.length === 0)
			throw new BadRequestException("Cart is empty");

		let cartResult: CartMongoDoc;
		let purchaseResult: PurchaseMongoDoc[];
		try {
			const cartRemovalPromise = cart.remove();
			const purchaseInsertionPromise = this.purchaseModel.insertMany({
				userId: jwtPayload.userId,
				purchaseDate: new Date(),
				billing: details.billing,
				cart: cart,
			});
			[cartResult, purchaseResult] = await Promise.all([
				cartRemovalPromise,
				purchaseInsertionPromise,
			]);
		} catch (e) {
			console.error("Failed to insert a purchase", e);

			// make this operation atomic, 🤞 let's hope no error is thrown here
			// yes, ignore promises results
			cart?.save();
			purchaseResult?.map((purchase) => purchase.remove());

			throw new InternalServerErrorException("Failed to finish purchase");
		}
		return this.mongoCart2GQL(cartResult);
	}

	@Query(() => [GQLPurchase], { nullable: true })
	async purchases(
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLPurchase[]> {
		const userId = jwtPayload.userId;
		let purchases: PurchaseMongoDoc[];
		try {
			purchases = await this.purchaseModel.find({ userId: userId });
			return Promise.all(
				purchases
					.map((purchase) => purchase.toObject())
					.map(async (purchase) => ({
						id: purchase._id.toString(),
						purchaseDate: purchase.purchaseDate.toISOString(),
						email: purchase.billing.email,
						billing: purchase.billing,
						cart: await this.mongoCart2GQL({
							_id: "", // cart id is now invalid since it's nested within a purchase
							...purchase.cart,
						} as unknown as CartMongoDoc),
					})),
			);
		} catch (e) {
			console.error("Failed to retrieve purchase history", e);
			throw new InternalServerErrorException("Failed to retrieve data");
		}
	}

	@Query(() => GQLPurchase, { nullable: true, name: "purchase" })
	async getPurchase(
		@Args("id", { type: () => ID, nullable: false }) id: string,
		@ExtractedJWTPayload() jwtPayload: JWTPayload | undefined,
	): Promise<GQLPurchase> {
		try {
			const purchase: PurchaseMongoDoc =
				await this.purchaseModel.findById(id);

			if (purchase.userId !== jwtPayload.userId) return null;

			return {
				id: purchase._id.toString(),
				purchaseDate: purchase.purchaseDate.toISOString(),
				email: purchase.billing.email,
				billing: purchase.billing,
				cart: await this.mongoCart2GQL({
					_id: "",
					...purchase.toObject().cart,
				} as unknown as CartMongoDoc),
			};
		} catch (e) {
			console.error("Failed to retrieve purchase history", e);
			throw new InternalServerErrorException("Failed to retrieve data");
		}
	}

	private async mongoCart2GQL(cart: CartMongoDoc): Promise<GQLCart> {
		const groupedByArtist: ArtistInCart[] = this.groupByArtist(cart);
		return {
			id: cart._id.toString(),
			total: groupedByArtist
				.map((artistInCart) => artistInCart.subtotal)
				.map((subtotalStr) => new Decimal(subtotalStr))
				.reduce((prev: Decimal, curr: Decimal) => prev.add(curr))
				.toString(),
			tracksInCart: cart.tracksInCart.map((track) => ({
				...track,
				dateAdded: track.dateAdded.toISOString(),
			})),
			artistsInCart: groupedByArtist,
		};
	}

	private groupByArtist(cart: CartMongo): ArtistInCart[] {
		const artists = cart.tracksInCart.reduce(
			(map, track) => map.set(track.album.artist.id, track.album.artist),
			new Map<number, Artist>(),
		);
		const albums = cart.tracksInCart.reduce(
			(map, track) => map.set(track.album.id, track.album),
			new Map<number, Album>(),
		);

		// group by artist and album
		const grouped = new Map<number, Map<number, TrackInCart[]>>(); // maps artist -> album -> tracks
		// use ids instead of direct objects because objects are different as they come from different mongo objects

		for (const track of cart.tracksInCart) {
			const artistId = track.album.artist.id;
			if (!grouped.has(artistId))
				grouped.set(artistId, new Map<number, TrackInCart[]>());

			const albumId = track.album.id;
			if (!grouped.get(artistId).has(albumId))
				grouped.get(artistId).set(albumId, []);

			grouped
				.get(artistId)
				.get(albumId)
				.push({ ...track, dateAdded: track.dateAdded.toISOString() });
		}

		// convert grouped data to array
		return Array.from(grouped.entries()).map(
			([artistId, groupedByAlbum]): ArtistInCart => {
				const albumsInCart: AlbumInCart[] = Array.from(
					groupedByAlbum.entries(),
				).map(
					([albumId, tracks]): AlbumInCart => ({
						...albums.get(albumId),
						tracksInCart: tracks,
						subtotal: tracks
							.map((track) => track.price)
							.map((price) => new Decimal(price))
							.reduce((prev: Decimal, curr: Decimal) =>
								prev.add(curr),
							)
							.toString(),
					}),
				);

				return {
					...artists.get(artistId),
					albumsInCart: albumsInCart,
					subtotal: albumsInCart
						.map((albumInCart) => albumInCart.subtotal)
						.map((subtotal) => new Decimal(subtotal))
						.reduce((prev: Decimal, curr: Decimal) =>
							prev.add(curr),
						)
						.toString(),
				};
			},
		);
	}
}
