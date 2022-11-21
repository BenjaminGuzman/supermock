import { BadRequestException } from "@nestjs/common";
import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Artist } from "./artist.model";
import { ArtistEntity } from "./artist.entity";
import { ArtistService } from "./artist.service";
import { AlbumService } from "../albums/album.service";

@Resolver(() => Artist)
export class ArtistResolver {
	constructor(
		private artistService: ArtistService,
		private albumsService: AlbumService,
	) {
	}

	@Query(() => [Artist])
	async artistSearch(
		@Args("search", { type: () => String, nullable: true }) search,
		// TODO add pagination...
	): Promise<Artist[]> {
		if (!search || search.length === 0)
			return (await this.artistService.getAll()).map(ArtistResolver.typeormArtist2GQL);

		if (!/^[a-zA-Z 0-9áéíóúÁÉÍÓÚñÑÄËÏÖÜäëïöü]+$/.test(search))
			throw new BadRequestException("Only letters are allowed");

		return (await this.artistService.search(search)).map(ArtistResolver.typeormArtist2GQL);
	}

	@Query(() => Artist, { nullable: true })
	async artistById(@Args("id", { type: () => ID, nullable: false }) artistId): Promise<Artist | null> {
		if (!/^[\d+]+$/.test(artistId))
			return null;

		const id: number = parseInt(artistId);
		const artistEntity: ArtistEntity = await this.artistService.getById(id);
		if (!artistEntity)
			return null;

		return ArtistResolver.typeormArtist2GQL(artistEntity);
	}

	@Mutation(() => Int)
	async initialize() {
		// TODO receive as input an array of artists?
		this.artistService.initialize();
		return 0;
	}

	@ResolveField()
	async albums(@Parent() artist: Artist) {
		// FIXME: Solve the N+1 problem!
		return this.albumsService.getByArtistId(artist.id);
	}

	private static typeormArtist2GQL(artist: ArtistEntity): Artist {
		return {
			...artist,
			albums: [],
		};
	}
}
