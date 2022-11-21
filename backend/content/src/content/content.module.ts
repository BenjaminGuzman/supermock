import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArtistEntity } from "./artists/artist.entity";
import { AlbumEntity } from "./albums/album.entity";
import { TrackEntity } from "./tracks/track.entity";
import { ArtistService } from "./artists/artist.service";
import { AlbumService } from "./albums/album.service";
import { TrackService } from "./tracks/track.service";
import { ArtistResolver } from "./artists/artist.resolver";
import { AlbumResolver } from "./albums/album.resolver";

@Module({
	imports: [
		TypeOrmModule.forFeature([ArtistEntity, AlbumEntity, TrackEntity]),
	],
	providers: [ArtistService, AlbumService, TrackService, ArtistResolver, AlbumResolver],
})
export class ContentModule {
}
