import { Component, OnInit } from '@angular/core';
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";
import {NavItem} from "../../utils/header/header.component";

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  public navigation: NavItem[] = [{name: "Shopping cart", url: "/cart"}];
  public isLoading: boolean = true;

  public cart?: Cart | null;

  constructor(private apollo: Apollo) { }

  ngOnInit(): void {
    const subscription: Subscription = this.apollo.query<{cart: Cart | null}>({
      query: gql`query {
        cart {
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
      }`
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        subscription.unsubscribe();
        if (!res.data.cart)
          return;
        console.log(res);
      },
      error: err => {
        this.isLoading = false;
        subscription.unsubscribe();
        console.error(err);
      },
      complete: () => subscription.unsubscribe()
    })
  }

}

export interface TrackInCart {
  id: number;
  title: string;
  link?: string;
  preview?: string;
  price: string;
  dateAdded: string;
}

export interface AlbumInCart {
  id: number;
  title: string;
  cover?: string;
  tracksInCart: TrackInCart[];
  subtotal: string;
}

export interface ArtistInCart {
  id: number;
  name: string;
  picture?: string;
  albumsInCart: AlbumInCart[];
  subtotal: string;
}

export interface Cart {
  total: string;
  artistsInCart: ArtistInCart[];
}
