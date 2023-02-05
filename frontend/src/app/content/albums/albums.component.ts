import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {Apollo, gql} from "apollo-angular";
import {Album} from "./album/album";
import {Artist} from "../artists/artist/artist";

@Component({
  selector: 'app-albums',
  templateUrl: './albums.component.html',
  styleUrls: ['./albums.component.scss']
})
export class AlbumsComponent implements OnInit {
  public isLoading = true;

  public navigation = [{name: 'Artists', url: '/content/artists'}];

  public albums: Album[] = [];
  public searchResults: Album[] = [];

  public artist: Artist = {} as Artist;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private apollo: Apollo
  ) {
  }

  ngOnInit(): void {
    const artistId: string | null = this.activatedRoute.snapshot.paramMap.get("artistId");
    if (!artistId) {
      alert("Invalid path! Don't try anything funny. Remember: I'll be watching 🧐");
      return;
    }

    const subscription: Subscription = this.apollo.query<{
      artistById: {
        name: string;
        link: string;
        picture: string;
        nFans?: number;
        nAlbums?: number;
        albums: {
          id: number;
          link: string;
          title: string;
          cover: string
        }[]
      }
    }>({
      query: gql`query ArtistById($id: ID!) {
        artistById(id: $id) {
          name
          picture
          nFans
          nAlbums
          link
          albums {
            id
            link
            title
            cover
          }
        }
      }`,
      variables: {
        id: artistId
      }
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();
        if (!res.data.artistById) {
          alert("Artist doesn't exist. You'll be redirected to artists page");
          this.router.navigateByUrl("/content/artists");
          return;
        }

        this.navigation.push({name: res.data.artistById.name, url: `/content/artist/${artistId}`});
        this.changeDetectorRef.markForCheck();

        this.albums = res.data.artistById.albums;

        this.artist = {
          id: parseInt(artistId), // by now we know it is a valid id (otherwise no artist would be returned)
          name: res.data.artistById.name,
          nAlbums: res.data.artistById.nAlbums,
          nFans: res.data.artistById.nFans,
          picture: res.data.artistById.picture,
          link: res.data.artistById.link
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
