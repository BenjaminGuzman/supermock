import { Args, ID, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { TrackService } from "./track.service";
import { Track } from "./track.model";
import { Album } from "../albums/album.model";
import { AlbumService } from "../albums/album.service";
import { Artist } from "../artists/artist.model";

@Resolver(() => Track)
export class TrackResolver {
	constructor(
		private trackService: TrackService,
		private albumService: AlbumService,
	) {
	}

	@Query(() => [Track], { nullable: false })
	tracksById(
		@Args("ids", { type: () => [ID], nullable: false }) idsStr: string[],
	): Promise<Track[]> {
		const ids = idsStr.map((i) => parseInt(i)); // FIXME: reject invalid values (NaN, negatives...)
		return this.trackService.getByIds(ids);
	}

	@ResolveField(() => Album)
	async album(@Parent() track: Track) {
		return this.albumService.getByTrackId(track.id);
	}

	/*@ResolveField(() => Artist)
	async artist(@Parent() track: Track) {
		// FIXME: Solve the N+1 problem!
		return this.albumService.getByTrackId(track.id);
	}*/
}
