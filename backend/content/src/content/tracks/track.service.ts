import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { TrackEntity } from "./track.entity";

@Injectable()
export class TrackService {
	constructor(
		@InjectRepository(TrackEntity)
		private tracksRepo: Repository<TrackEntity>,
	) {
	}

	getByIds(ids: number[]): Promise<TrackEntity[]> {
		return this.tracksRepo.findBy({
			id: In(ids),
		});
	}

	getById(id: number): Promise<TrackEntity> {
		return this.tracksRepo.findOneBy({ id: id });
	}

	getByAlbumId(albumId: number): Promise<TrackEntity[]> {
		return this.tracksRepo.findBy({ album: { id: albumId } });
	}

	search(search: string): Promise<TrackEntity[]> {
		// TODO implement this method
		throw new Error("Not implemented yet");
	}
}
