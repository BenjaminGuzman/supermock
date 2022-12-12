import { Args, ID, Query, Resolver } from "@nestjs/graphql";
import { TrackService } from "./track.service";
import { Track } from "./track.model";

@Resolver(() => Track)
export class TrackResolver {
	constructor(
		private trackService: TrackService,
	) {
	}

	@Query(() => [Track], { nullable: false })
	tracksById(
		@Args("ids", { type: () => [ID], nullable: false }) idsStr: string[],
	): Promise<Track[]> {
		const ids = idsStr.map((i) => parseInt(i)); // FIXME: reject invalid values (NaN, negatives...)
		return this.trackService.getByIds(ids);
	}
}
