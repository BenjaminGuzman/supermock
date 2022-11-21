import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { AlbumEntity } from "../albums/album.entity";

@Entity("tracks")
export class TrackEntity {
	@PrimaryColumn("int")
	id: number;

	@Column("varchar", { nullable: false })
	title: string;

	@Column("varchar", { nullable: true })
	link: string;

	@Column("varchar", { nullable: true })
	preview: string;

	@Column("numeric", { nullable: false, default: 10 })
	price: string;

	@ManyToOne(() => AlbumEntity, (album) => album.tracks)
	@JoinColumn({ name: "album_id" })
	album: AlbumEntity;
}
