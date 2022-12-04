import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Location} from "@angular/common";
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";
import {NavItem} from "../../utils/header/header.component";
import {Track} from "./track/track";
import {Album} from "../albums/album/album";
import {Artist} from "../artists/artist/artist";

@Component({
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss']
})
export class TracksComponent implements OnInit {
  public isLoading = true;

  public navigation: NavItem[] = [{name: "Artists", url: "/content/artists"}];
  public tracks: Track[] = [];
  public album: Album = {} as Album;
  public artist: Artist = {} as Artist;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private changeDetectorRef: ChangeDetectorRef,
    private apollo: Apollo
  ) { }

  ngOnInit(): void {
    const albumId: string | null = this.activatedRoute.snapshot.paramMap.get("albumId");
    if (!albumId) {
      alert("Invalid path! Don't try anything funny. Remember: I'll be watching 🧐");
      return;
    }

    const subscription: Subscription = this.apollo.query<{
      albumById: {
        title: string;
        link: string;
        cover: string;
        artist: {
          id: number;
          name: string;
        };
        tracks: {
          id: number;
          title: string;
          link: string;
          preview: string;
          price: number;
        }[]
      }
    }>({
      query: gql`query AlbumById($id: ID!) {
        albumById(id: $id) {
          title
          link
          cover
          artist {
            id
            name
          }
          tracks {
            id
            title
            link
            preview
            price
          }
        }
      }`,
      variables: {
        id: albumId
      }
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();
        if (!res.data.albumById) {
          alert("Album doesn't exist");
          this.location.back();
          return;
        }

        this.navigation.push({name: res.data.albumById.artist.name, url: `/content/artist/${res.data.albumById.artist.id}`});
        this.navigation.push({name: res.data.albumById.title, url: `/content/album/${albumId}`});
        this.changeDetectorRef.markForCheck();

        this.tracks = res.data.albumById.tracks;

        this.album = {
          id: parseInt(albumId), // by now we know it is a valid id (otherwise no artist would be returned)
          title: res.data.albumById.title,
          cover: res.data.albumById.cover,
          link: res.data.albumById.link
        };
        this.artist = {
          id: res.data.albumById.artist.id,
          name: res.data.albumById.artist.name
        };

        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (e: Error) => {
        subscription.unsubscribe();
        console.error(e);
      },
      complete: () => subscription.unsubscribe()
    });
  }

}
