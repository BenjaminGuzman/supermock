import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {ArtistInCart} from "../cart/cart.component";
import {Apollo, gql} from "apollo-angular";

@Component({
  selector: 'app-artists-in-cart',
  templateUrl: './artists-in-cart.component.html',
  styleUrls: ['./artists-in-cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistsInCartComponent implements OnInit {
  @Input()
  public artistsInCart: ArtistInCart[] = [];

  constructor(private apollo: Apollo, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  removeTrack(trackId: number, albumId: number, artistId: number): void {
    this.apollo.mutate<{deleteTracks: number[]}>({
      mutation: gql`mutation deleteTracks($ids: [ID!]!) {
        deleteTracks(ids: $ids) {
          total
          tracksInCart {
            id
          }
        }
      }`,
      variables: {
        ids: [trackId]
      }
    }).subscribe({
      next: (res) => {
        if (!res.data?.deleteTracks)
          return;

        const album = this.artistsInCart
          .find(artist => artist.id == artistId)!.albumsInCart
          .find(album => album.id == albumId);

        album!.tracksInCart = album!.tracksInCart.filter(track => track.id !== trackId);
        this.changeDetectorRef.markForCheck();
      },
      error: console.error,
    })
  }
}
