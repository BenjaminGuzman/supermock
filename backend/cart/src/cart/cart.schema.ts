import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export class TrackInCart {
	@Prop({ required: true })
	trackId: string;

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

	@Prop({ required: true })
	albumId: string;
}

@Schema()
export class CartMongo {
	@Prop()
	userId: string;

	@Prop()
	total: string;

	@Prop([TrackInCart])
	tracksInCart: TrackInCart[];
}

export const CartSchema = SchemaFactory.createForClass(CartMongo);
export type CartDocument = HydratedDocument<CartMongo>;
