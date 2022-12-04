import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export class TrackInCart {
	@Prop({ required: true })
	title: string;

	@Prop({ required: false })
	link?: string;

	@Prop({ required: false })
	preview?: string;

	@Prop({ required: true })
	price: string;

	@Prop(Date)
	dateAdded: Date;
}

export class AlbumInCart {
	@Prop({ required: true })
	title: string;

	@Prop({ required: false })
	cover?: string;

	@Prop([TrackInCart])
	tracksInCart: TrackInCart[];

	@Prop({ required: true })
	subtotal: string;
}

export class ArtistInCart {
	@Prop({ required: true })
	name: string;

	@Prop({ required: false })
	picture?: string;

	@Prop([AlbumInCart])
	albumsInCart: AlbumInCart[];

	@Prop({ required: true })
	subtotal: string;
}

@Schema()
export class CartMongo {
	@Prop()
	userId: string;

	@Prop()
	total: string;

	@Prop([ArtistInCart])
	artistsInCar: [ArtistInCart];
}

export const CartSchema = SchemaFactory.createForClass(CartMongo);
export type CartDocument = HydratedDocument<CartMongo>;
