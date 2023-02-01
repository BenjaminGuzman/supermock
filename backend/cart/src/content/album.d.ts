import { Artist } from "./artist";

export interface Album {
	id: number;
	title: string;
	link?: string;
	cover?: string;
	artist: Artist;
}
