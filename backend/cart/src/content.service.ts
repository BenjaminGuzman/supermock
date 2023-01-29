import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ContentService {
	private contentUrl: string;
	constructor(config: ConfigService) {
		this.contentUrl = config.get<string>("CONTENT_URL");
	}

	public async getTracks(tracksIds: string[]): Promise<Track[]> {
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

	public getAlbumsArtists(albumsIds: string[]): Promise<Artist[]> {
		// TODO make GraphQL call
		return Promise.resolve([]);
	}

	//public getTracks
}

export interface Track {
	id: string;
	title: string;
	link?: string;
	preview?: string;
	price: string;
	album: {
		id: string;
	};
}

export interface Album {
	id: number;
	title: string;
	cover?: string;
}

export interface Artist {
	id: string;
	name: string;
	picture?: string;
}
