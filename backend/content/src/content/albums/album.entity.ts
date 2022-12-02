import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { ArtistEntity } from "../artists/artist.entity";
import { TrackEntity } from "../tracks/track.entity";

@Entity("albums")
export class AlbumEntity {
	@PrimaryColumn("int")
	id: number;

	@Column("varchar", { nullable: false })
	title: string;

	@Column("varchar", { nullable: true })
	link: string;

	@Column("varchar", {
		nullable: true,
		comment: "URL to Deezer's cover image",
	})
	cover: string;

	@ManyToOne(() => ArtistEntity, (artist) => artist.albums)
	@JoinColumn({ name: "artist_id" })
	artist: ArtistEntity;

	@OneToMany(() => TrackEntity, (track) => track.album)
	tracks: TrackEntity[];
}
