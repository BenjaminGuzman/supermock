import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Album } from "../albums/album.model";

@ObjectType()
export class Artist {
	@Field(() => Int)
	id: number;

	@Field()
	name: string;

	@Field({ nullable: true })
	link?: string;

	@Field({ nullable: true })
	picture?: string;

	@Field(() => Int, { nullable: true })
	nAlbums?: number;

	@Field(() => Int, { nullable: true })
	nFans?: number;

	@Field(() => [Album])
	albums: Album[];
}
