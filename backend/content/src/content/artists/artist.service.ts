import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { getRepositoryToken, InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ArtistEntity } from "./artist.entity";
import { ContextIdFactory, ModuleRef, REQUEST } from "@nestjs/core";
import { TrackEntity } from "../tracks/track.entity";
import * as superagent from "superagent";
import { AlbumEntity } from "../albums/album.entity";

@Injectable()
export class ArtistService {
  constructor(
    @InjectRepository(ArtistEntity)
    private artistsRepo: Repository<ArtistEntity>,
    @InjectRepository(AlbumEntity)
    private albumsRepo: Repository<AlbumEntity>,
    @InjectRepository(TrackEntity)
    private tracksRepo: Repository<TrackEntity>
  ) {
  }

  getByIds(ids: number[]): Promise<ArtistEntity[]> {
    return this.artistsRepo.findBy({
      id: In(ids)
    });
  }

  getById(id: number): Promise<ArtistEntity> {
    return this.artistsRepo.findOneBy({id: id});
  }

  async getByAlbumId(albumId: number): Promise<ArtistEntity> {
    const res: any[] = await this.artistsRepo.query(`SELECT artists.* FROM artists INNER JOIN albums ON artists.id = albums.artist_id WHERE albums.id = $1 LIMIT 1`, [albumId]);
    if (!res || res.length === 0)
      return null;

    const artist = res[0];
    artist.nAlbums = artist.n_albums;
    artist.nFans = artist.n_fans;
    delete artist.n_fans;
    delete artist.n_albums;
    return artist;
  }

  /**
   * Get all available artists
   * TODO implement pagination...
   */
  getAll(): Promise<ArtistEntity[]> {
    return this.artistsRepo.find();
  }

  search(search: string): Promise<ArtistEntity[]> {
    // TODO implement this method
    throw new Error("Not implemented yet");
  }

  /**
   * Populate the database with some of the greatest artists
   * @return false if db was already populated
   */
  async initialize(): Promise<boolean> {
    const artists = [
      "eminem",
      "dua lipa",
      "residente",
      "vico c",
      "birdy",
      "ana tijoux",
      "Zoe",
      "The chainsmokers",
      "Natalia Lafourcade",
      "Kygo",
      "Florence + The Machine",
      "M83",
      "oh wonder",
      "Carla Morrison",
      "Cancerbero",
      "onerepublic",
      "imagine dragons",
      "Calvin Harris",
      "Cartel de santa",
      "Boyz noise",
      "Son Lux",
      "Lost Years",
      "Mac Quayle",
      "HiTNRuN",
      "Kavinsky",
      "Martin garrix",
      "Gabylonia",
      "C-kan",
      "Adele",
      "The Rocky Soloists & Orchestra",
      "Siddhartha"
    ];

    try {
      const nRegisteredArtists = await this.artistsRepo.count();
      if (nRegisteredArtists > 0) {
        console.log("Database already initialized...");
        return false;
      }
    } catch (e) {
      console.error(e);
    }
    console.log("Initializing database...");
    console.group();

    // save artists
    console.log("Inserting artists...");
    const promises = artists
      .map((artist) =>
        superagent
          .get(`https://api.deezer.com/search/artist?q=${artist}`)
          .accept("application/json"),
      )
      .map((p) => p.then((res) => res.body).catch(console.error))
      .map((p) => p.then((body) => body.data[0]))
      .map((p) =>
        p.then((deezerArtist: DeezerArtist) => {
          const artist = new ArtistEntity();
          artist.name = deezerArtist.name;
          artist.picture = deezerArtist.picture_medium;
          artist.nFans = deezerArtist.nb_fan;
          artist.nAlbums = deezerArtist.nb_album;
          artist.id = deezerArtist.id;
          artist.link = deezerArtist.link;

          this.artistsRepo
            .save(artist)
            // .then((artist) =>
            //   console.log(`Saved artist ${artist.name} (id ${artist.id})`),
            // )
            .catch(console.error);

          return artist;
        }),
      );

    // save albums
    console.log("Inserting albums...");
    const savedAlbums: AlbumEntity[] = [];
    const savedArtists = await Promise.all(promises);
    for (const artist of savedArtists) {
      const res = await superagent
        .get(`https://api.deezer.com/artist/${artist.id}/albums`)
        .accept("application/json");

      for (let deezerAlbum of res.body.data) {
        deezerAlbum = deezerAlbum as DeezerAlbum;
        const album = new AlbumEntity();
        album.title = deezerAlbum.title;
        album.cover = deezerAlbum.cover_medium;
        album.link = deezerAlbum.link;
        album.id = deezerAlbum.id;
        album.artist = artist;

        await this.albumsRepo
          .save(album)
          .then((album) => {
            // console.log(`Saved album ${album.title} (${album.artist.name})`);
            savedAlbums.push(album);
          })
          .catch(console.error);
      }
    }

    // save tracks
    console.log("Inserting tracks...");
    for (const album of savedAlbums) {
      const res = await superagent
        .get(`https://api.deezer.com/album/${album.id}/tracks`)
        .accept("application/json");

      for (let deezerTrack of res.body.data) {
        deezerTrack = deezerTrack as DeezerTrack;
        const track = new TrackEntity();
        track.title = deezerTrack.title;
        track.link = deezerTrack.link;
        track.id = deezerTrack.id;
        track.album = album;
        track.preview = deezerTrack.preview;
        track.price = `${Math.floor(Math.random() * 10 + 1)}`;

        await this.tracksRepo
          .save(track)
          // .then((track) => {
          //   console.log(`Saved track ${track.title} (${track.album.title})`);
          // })
          .catch(console.error);
      }
    }

    console.groupEnd();
    console.log("Database initialized");

    return true;
  }
}

interface DeezerArtist {
  id: number;
  name: string;
  link: string;
  picture_medium: string;
  nb_album: number;
  nb_fan: number;
}

interface DeezerAlbum {
  id: number;
  title: string;
  link: string;
  cover_medium: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  link: string;
  preview: string;
}
