import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Album } from "../content/album";
import { Artist } from "../content/artist";

class ArtistMongo implements Artist {
	@Prop({ required: true })
	id: number;

	@Prop({ required: false })
	link?: string;

	@Prop({ required: false })
	nAlbums?: number;

	@Prop({ required: true })
	nFans: number;

	@Prop({ required: true })
	name: string;

	@Prop({ required: false })
	picture?: string;
}

class AlbumMongo implements Album {
	@Prop({ required: true, type: ArtistMongo })
	artist: ArtistMongo;

	@Prop({ required: false })
	cover?: string;

	@Prop({ required: true })
	id: number;

	@Prop({ required: false })
	link?: string;

	@Prop({ required: true })
	title: string;
}

/**
 * TrackInCart may be a large object as it includes album information and artist information
 * This has 2 "problems":
 * 1. The collection may take a lot of space. That's OK since the whole point is to store everything
 *    here so that there is no need to query content service again
 * 2. If information is updated in content service, it should be updated here too.
 *    That's not a big problem since content is not likely to change
 */
export class TrackInCart {
	@Prop({ required: true })
	id: number;

	@Prop({ required: true })
	title: string;

	@Prop({ required: false })
	link?: string;

	@Prop({ required: false })
	preview?: string;

	@Prop({ required: true })
	price: string;

	@Prop({ required: true, type: Date })
	dateAdded: Date;

	@Prop({ required: true, type: AlbumMongo })
	album: Album;
}

@Schema()
export class CartMongo {
	@Prop({ required: true })
	userId: string;

	@Prop([TrackInCart])
	tracksInCart: TrackInCart[];
}

export const CartMongoSchema = SchemaFactory.createForClass(CartMongo);
export type CartMongoDoc = HydratedDocument<CartMongo>;
