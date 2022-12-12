import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ContentService {
	private contentUrl: string;
	constructor(config: ConfigService) {
		this.contentUrl = config.get<string>("CONTENT_URL");
	}

	public getTracks(tracksIds: number[]): Promise<Track[]> {
		// TODO make GraphQL call
		return Promise.resolve([]);
	}

	public getAlbumsArtists(albumsIds: number[]): Promise<Artist[]> {
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
