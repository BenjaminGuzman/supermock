import { Album } from "./album";

export interface Track {
	id: number;
	title: string;
	link?: string;
	preview?: string;
	price: string;
	album: Album;
}
