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
    const subscription: Subscription = this.apollo.query<{ purchases: (Purchase & {cart: {total: string; tracksInCart: {id: number}[]}})[] }>({
      query: gql`query {
        purchases {
          id
          purchaseDate
          email
          cart {
            total
            tracksInCart {
              id
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
          id: purchase.id,
          email: purchase.email,
          purchaseDate: new Date(purchase.purchaseDate),
          total: purchase.cart.total,
          nTracks: purchase.cart.tracksInCart.length
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
  id: string;
  purchaseDate: Date;
  email: string;
  total: string;
  nTracks: number;
}
