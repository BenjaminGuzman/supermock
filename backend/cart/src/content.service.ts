import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Album } from "./content/album";
import { Track } from "./content/track";

/**
 * Service will provide the requested content by either querying it directly to
 * content microservice or by reading it from an internal cache
 *
 * Cache lifetime is indefinite (for now at least) since content is not likely
 * to change. Although cache may be deleted if there is at least one shopping
 * cart referencing the cache data.
 *
 * Cache is actually composed by other MongoDB collections for each entity
 * (album, artist, ...) but it's called cache because it temporarily saves data
 * from previous requests
 *
 * NOTE: A more professional way to do all this is by simply using GraphQL
 * federation or some kind of gateway but... this is a mock app😅😜...
 */
@Injectable()
export class ContentService {
	private contentUrl: string;

	constructor(config: ConfigService) {
		this.contentUrl = config.get<string>("CONTENT_URL");
	}

	public async getTracks(tracksIds: string[]): Promise<Track[]> {
		// only numbers are allowed
		const goodTrackIds = tracksIds.map(parseInt).filter((id) => !isNaN(id));

		return await this.queryTracks(goodTrackIds);
	}

	/**
	 * Query all the tracks (with album and artist) from content service
	 *
	 * Querying the album and artist may have a little impact on performance since, for example, all the Dua Lipa's
	 * songs are queries, the album and artist fields for all tracks will be duplicated.
	 * But, let's say that's ok for now
	 * @param tracksIds tracks ids
	 * @private
	 */
	private async queryTracks(tracksIds: number[]): Promise<Track[]> {
		// Don't add try-catch or recovery procedures,
		// let's just 🤞 and hope the internal services work fine
		const res = await fetch(this.contentUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"User-Agent": "content microservice",
			},
			body: JSON.stringify({
				query: `query tracksById($ids: [ID!]!) {
					tracksById(ids: $ids) {
						id
						title
						link
						preview
						price
						album {
							id
							title
							cover
							link
							artist {
								id
								name
								link
								picture
								nAlbums
								nFans
							}
						}
					}
				}`,
				variables: {
					ids: tracksIds,
				},
			}),
		}).then((r) => r.json());

		if (res.errors) throw new Error(res.errors[0].message);

		return res.data.tracksById;
	}
}
