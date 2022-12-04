import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CartDocument, CartMongo } from "./cart/cart.schema";
import { Model } from "mongoose";

@Injectable()
export class CartService {
	constructor(
		@InjectModel(CartMongo.name) private cartModel: Model<CartDocument>,
	) {}

	async ensureCartExists(userId: string) {
		return new this.cartModel({
			userId,
			total: "0",
			artistsInCart: [],
		}).save();
	}
}
