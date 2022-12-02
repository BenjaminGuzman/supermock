import { Injectable } from "@nestjs/common";

@Injectable()
export class ContentService {
	public getAlbumsArtists(albumsIds): Promise<Artist[]> {
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
