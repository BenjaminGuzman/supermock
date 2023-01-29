import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AlbumEntity } from "./album.entity";

@Injectable()
export class AlbumService {
	constructor(
		@InjectRepository(AlbumEntity)
		private albumsRepo: Repository<AlbumEntity>,
	) {
	}

	getByIds(ids: number[]): Promise<AlbumEntity[]> {
		return this.albumsRepo.findBy({
			id: In(ids),
		});
	}

	getById(id: number): Promise<AlbumEntity> {
		return this.albumsRepo.findOneBy({ id: id });
	}

	getByArtistId(artistId: number): Promise<AlbumEntity[]> {
		return this.albumsRepo.findBy({ artist: { id: artistId } });
	}

	getByTrackId(trackId: number): Promise<AlbumEntity> {
		return this.albumsRepo.findOneBy({ tracks: { id: trackId } });
	}

	search(search: string): Promise<AlbumEntity[]> {
		// TODO implement this method
		throw new Error("Not implemented yet");
	}
}
