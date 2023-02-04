import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {Apollo, gql} from "apollo-angular";
import {Cart} from "../cart/cart.component";

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseHistoryComponent implements OnInit {
  public isLoading = true;

  public purchases: Purchase[] = [];

  constructor(private apollo: Apollo, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    const subscription: Subscription = this.apollo.query<{ purchases: Purchase[] }>({
      query: gql`query {
        purchases {
          purchaseDate
          email
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
        }
      }`,
      fetchPolicy: "no-cache"
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
        subscription.unsubscribe();
        if (!res.data.purchases)
          return;

        this.purchases = res.data.purchases.map(purchase => ({
          ...purchase,
          purchaseDate: new Date(purchase.purchaseDate)
        }));
        this.changeDetectorRef.markForCheck();
      },
      error: err => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
        subscription.unsubscribe();
        console.error("Error while fetching purchase history", err);
      },
      complete: () => subscription.unsubscribe()
    });
  }

}

export interface Purchase {
  purchaseDate: Date;
  email: string;
  cart: Cart;
}
