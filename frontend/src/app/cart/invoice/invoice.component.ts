import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {Apollo, gql} from "apollo-angular";
import {Cart, TrackInCart} from "../cart/cart.component";
import {ActivatedRoute} from '@angular/router';
import {NavItem} from "../../utils/header/header.component";

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceComponent implements OnInit {
  public isLoading = true;

  public navigation: NavItem[] = [{name: "Shopping cart", url: "/cart"}];

  public invoice: Purchase = {} as Purchase;

  constructor(
    private apollo: Apollo,
    private changeDetectorRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    const invoiceId: string = this.activeRoute.snapshot.paramMap.get("invoiceId") as string;
    if (!invoiceId) {
      alert("Don't do funny stuff 😡. Remember I'm watching you 🧐");
      return;
    }
    this.navigation.push({
      name: "Invoice",
      url: `/cart/invoice/${invoiceId}`
    });

    const subscription: Subscription = this.apollo.query<{ purchase: Purchase }>({
      query: gql`query purchase($id: ID!) {
        purchase(id: $id) {
          purchaseDate
          billing {
            name
            address1
            address2
            country
            zipCode
            state
            email
          }
          cart {
            total
            artistsInCart {
              name
              picture
              subtotal
              albumsInCart {
                title
                cover
                subtotal
                tracksInCart {
                  id
                  title
                  price
                  dateAdded
                }
              }
            }
          }
        }
      }`,
      variables: {
        id: invoiceId
      },
      fetchPolicy: "no-cache"
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
        subscription.unsubscribe();
        if (!res.data.purchase) {
          alert("Something went really wrong 😭");
          return;
        }

        this.invoice = res.data.purchase;
        this.invoice.id = invoiceId;
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

interface Purchase {
  id: string;
  purchaseDate: Date;
  billing: {
    name: string;
    address1: string;
    address2?: string;
    country: string;
    state: string;
    zipCode: string;
  };
  cart: Cart;
}
