import { Component, OnInit } from '@angular/core';
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  constructor(private apollo: Apollo) { }

  ngOnInit(): void {
    const subscription: Subscription = this.apollo.query({
      query: gql`query {
        cart {
          id
          total
          artistsInCart {
            id
            name
            picture
            albumsInCart {
              id
            }
            subtotal
          }
        }
      }`
    }).subscribe({
      next: (res) => console.log(res),
      error: err => console.error(err),
      complete: () => subscription.unsubscribe()
    })
  }

}
