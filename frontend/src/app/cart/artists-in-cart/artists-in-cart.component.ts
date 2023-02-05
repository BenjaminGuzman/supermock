import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {ArtistInCart, Cart} from "../cart/cart.component";
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

  @Output()
  public onCartUpdate = new EventEmitter<Cart>();

  constructor(private apollo: Apollo, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  removeTrack(trackId: number, albumId: number, artistId: number): void {
    this.apollo.mutate<{deleteTracks: Cart}>({
      mutation: gql`mutation deleteTracks($ids: [ID!]!) {
        deleteTracks(ids: $ids) {
          total
          artistsInCart {
            id
            name
            picture
            subtotal
            albumsInCart {
              id
              title
              cover
              subtotal
              tracksInCart {
                id
                title
                link
                preview
                price
                dateAdded
              }
            }
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

        /*const album = this.artistsInCart
          .find(artist => artist.id == artistId)!.albumsInCart
          .find(album => album.id == albumId);

        album!.tracksInCart = album!.tracksInCart.filter(track => track.id !== trackId);*/
        this.onCartUpdate.emit(res.data.deleteTracks);
        //this.changeDetectorRef.markForCheck();
      },
      error: console.error,
    })
  }
}
