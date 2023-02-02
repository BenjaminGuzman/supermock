import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Apollo, gql} from "apollo-angular";
import {map, Observable, startWith, Subscription} from "rxjs";
import * as countries from "country-list";
import {NavItem} from "../../utils/header/header.component";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Validators2} from "./Validators2";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit {
  public navigation: NavItem[] = [{name: "Shopping cart", url: "/cart"}];
  public isLoading: boolean = true;

  public cart?: Cart | null;

  public countries: Country[] = [];

  public filteredCountries: Observable<Country[]>;

  public paymentForm: FormGroup;

  public payFormCtrls: {
    name: FormControl;
    card: FormControl;
    expirationDate: FormControl;
    country: FormControl;
    securityCode: FormControl;
    zipCode: FormControl;
  };

  public payFormConstraints = {
    name: {
      minLength: 2,
      maxLength: 50
    },
    card: {
      minLength: 4,
      maxLength: 18
    },
    securityCode: {
      minLength: 3,
      maxLength: 4
    },
    zipCode: {
      minLength: 3,
      maxLength: 10
    },
    expirationDate: {
      between: {
        start: new Date(),
        end: new Date(new Date().setFullYear(new Date().getFullYear() + 10))
      }
    }
  }

  public canSkipSteps = !environment.production;

  private _nItemsInCart: number = 0;

  constructor(private apollo: Apollo, private changeDetectorRef: ChangeDetectorRef) {
    this.payFormCtrls = {
      name: new FormControl(null, [
        Validators.required,
        Validators.minLength(this.payFormConstraints.name.minLength),
        Validators.maxLength(this.payFormConstraints.name.maxLength),
        Validators2.cardHolderName
      ]),
      card: new FormControl(null, [
        Validators.required,
        Validators2.digitsOnly(true),
        Validators.maxLength(this.payFormConstraints.card.maxLength),
        Validators2.card
      ]),
      expirationDate: new FormControl(null, [
        Validators.required,
        Validators2.dateBetween(
          this.payFormConstraints.expirationDate.between.start,
          this.payFormConstraints.expirationDate.between.end,
        )
      ]),
      country: new FormControl(null, [
        Validators.required
      ]),
      securityCode: new FormControl(null, [
        Validators.required,
        Validators2.digitsOnly(true),
        Validators.minLength(this.payFormConstraints.securityCode.minLength),
        Validators.maxLength(this.payFormConstraints.securityCode.maxLength),
      ]),
      zipCode: new FormControl(null, [
        Validators.required,
        Validators2.digitsOnly(true),
        Validators.minLength(this.payFormConstraints.zipCode.minLength),
        Validators.maxLength(this.payFormConstraints.zipCode.maxLength),
      ]),
    };
    this.paymentForm = new FormGroup(this.payFormCtrls);

    this.countries = countries.getData().map(c => ({
      name: c.name,
      image: `/assets/img/countries/${c.code}.png`,
      code: c.code,
    }));
    this.filteredCountries = this.payFormCtrls.country.valueChanges.pipe(
      startWith(''),
      map((search) => {
        if (!search)
          return [];

        /*if (search.length < 2)
          return this.countries;*/

        const searchLower = search.toLowerCase();
        return this.countries.filter(country => country.name.toLowerCase().includes(searchLower));
      }),
    );
  }

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
      }`,
      fetchPolicy: "no-cache"
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
        subscription.unsubscribe();
        if (!res.data.cart)
          return;

        this.cart = res.data.cart;
        this.changeDetectorRef.markForCheck();
      },
      error: err => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
        subscription.unsubscribe();
        console.error(err);
      },
      complete: () => subscription.unsubscribe()
    });
  }

  public getErrorMsg(control: FormControl, constraints: Record<string, unknown>, inputName?: string): string {
    if (control.hasError("required"))
      return `${inputName ? inputName : "Field"} is required`;

    if (["minLength", "minlength"].some(errName => control.hasError(errName)))
      return `Minimum length is ${constraints["minLength"]}`;

    if (["maxLength", "maxlength"].some(errName => control.hasError(errName)))
      return `Maximum length is ${constraints["maxLength"]}`;

    if (control.hasError("digitsOnly"))
      return "Only digits are allowed";

    if (control.hasError("cardHolderName"))
      return "Invalid card holder name";

    if (control.hasError("card"))
      return "Invalid card number";

    if (control.hasError("dateBeforeStart"))
      return "Card is expired";

    if (control.hasError("dateAfterEnd"))
      return "Expiration date is too far in the future";

    return "Not valid";
  }

  public hardRestrictLength(element: HTMLInputElement, maxLen: number, evt: Event): void {
    if (element.value.length <= maxLen)
      return;

    element.value = element.value.substring(0, maxLen);
    evt.stopPropagation();
    evt.preventDefault();
  }

  public last4DigitsCard(): string {
    return this.payFormCtrls.card.value
      ? this.payFormCtrls.card.value.toString().substring(this.payFormCtrls.card.value.toString().length - 4)
      : '1234';
  }

  get nItemsInCart(): number {
    if (this._nItemsInCart === 0)
      this._nItemsInCart = this.cart!.artistsInCart
        .reduce((count, artistInCart) =>
          count + artistInCart.albumsInCart.reduce((count, albumInCart) => count + albumInCart.tracksInCart.length, 0),
          0
        );

    return this._nItemsInCart;
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

interface Country {
  name: string;
  image: string;
  code: string;
}
