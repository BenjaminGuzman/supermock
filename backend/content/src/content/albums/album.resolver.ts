import { Args, ID, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AlbumService } from "../albums/album.service";
import { Album } from "./album.model";
import { AlbumEntity } from "./album.entity";
import { TrackService } from "../tracks/track.service";
import { Artist } from "../artists/artist.model";
import { ArtistService } from "../artists/artist.service";

@Resolver(() => Album)
export class AlbumResolver {
	constructor(
		private albumsService: AlbumService,
		private tracksService: TrackService,
		private artistsService: ArtistService,
	) {
	}

	@Query(() => Album, { nullable: true })
	async albumById(@Args("id", { type: () => ID, nullable: false }) albumId): Promise<Album | null> {
		if (!/^[\d+]+$/.test(albumId))
			return null;

		const id: number = parseInt(albumId);
		const albumEntity: AlbumEntity = await this.albumsService.getById(id);
		if (!albumEntity)
			return null;

		return AlbumResolver.typeormAlbum2GQL(albumEntity);
	}

	@ResolveField()
	async tracks(@Parent() album: Album) {
		// FIXME: Solve the N+1 problem!
		return this.tracksService.getByAlbumId(album.id);
	}

	@ResolveField()
	async artist(@Parent() album: Album) {
		// FIXME: Solve the N+1 problem!
		return this.artistsService.getByAlbumId(album.id);
	}

	private static typeormAlbum2GQL(album: AlbumEntity): Album {
		return {
			...album,
			artist: null as unknown as Artist,
			tracks: [],
		};
	}
}
