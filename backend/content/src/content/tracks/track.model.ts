import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Album } from "../albums/album.model";

@ObjectType()
export class Track {
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

	@Field(() => Album)
	album: Album;
}
