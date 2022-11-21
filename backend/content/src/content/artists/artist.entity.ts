import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { AlbumEntity } from "../albums/album.entity";

@Entity("artists")
export class ArtistEntity {
	@PrimaryColumn("int")
	id: number;

	@Column("varchar", { nullable: false })
	name: string;

	@Column("varchar", { nullable: true })
	link: string;

	@Column("varchar", { nullable: true })
	picture: string;

	@Column("int", { nullable: true, name: "n_albums" })
	nAlbums: number;

	@Column("int", { nullable: true, name: "n_fans" })
	nFans: number;

	@OneToMany(() => AlbumEntity, (album) => album.artist)
	albums: AlbumEntity[];
}
