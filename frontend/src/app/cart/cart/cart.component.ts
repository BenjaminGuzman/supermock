import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {Apollo, gql} from "apollo-angular";
import {map, Observable, startWith, Subscription} from "rxjs";
import * as countries from "country-list";
import {NavItem} from "../../utils/header/header.component";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Validators2} from "./Validators2";
import {environment} from "../../../environments/environment";
import cardValidator from "card-validator";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit, AfterViewInit {
  @ViewChild("cartWrapper")
  public cartWrapper: ElementRef | undefined;

  public isLoading: boolean = true;

  public cart?: Cart | null;

  public countries: Country[] = [];

  public filteredCountries: Observable<Country[]>;

  public cardIcon = "credit_card";

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
      maxLength: 23
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
  };

  public billingForm: FormGroup;

  public billingFormConstraints = {
    address1: {
      minLength: 4,
      maxLength: 50
    },
    address2: {
      minLength: 4,
      maxLength: 50
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
  };

  public billingFormCtrls = {
    address1: new FormControl('', [
      Validators.required,
    ]),
    address2: new FormControl('', []),
    country: new FormControl('', [
      Validators.required,
    ]),
    state: new FormControl('', [
      Validators.required,
    ]),
    zipCode: new FormControl('', [
      Validators.required,
      Validators2.digitsOnly(true)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
  };

  public canSkipSteps = !environment.production;

  private _nItemsInCart: number = 0;

  constructor(
    private apollo: Apollo,
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
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
        // Validators.maxLength(this.payFormConstraints.card.maxLength),
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
        // Validators.maxLength(this.payFormConstraints.securityCode.maxLength),
      ]),
      zipCode: new FormControl(null, [
        Validators.required,
        Validators2.digitsOnly(true),
        Validators.minLength(this.payFormConstraints.zipCode.minLength),
        Validators.maxLength(this.payFormConstraints.zipCode.maxLength),
      ]),
    };
    this.paymentForm = new FormGroup(this.payFormCtrls);

    this.billingForm = new FormGroup(this.billingFormCtrls);

    this.payFormCtrls.card.valueChanges.pipe(
      map(value => {
        if (!value) {
          this.cardIcon = "credit_card";
          return;
        }

        const validation = cardValidator.number(value);
        if (validation.card)
          this.cardIcon = validation.card.type;
      }),
      map(() => this.changeDetectorRef.markForCheck())
    ).subscribe();

    this.countries = countries.getData().map(c => ({
      name: c.name,
      image: `/assets/img/countries/${c.code}.png`,
      code: c.code,
    }));
    this.filteredCountries = this.payFormCtrls.country.valueChanges.pipe(
      startWith(''),
      map((search) => {
        if (!search)
          return this.countries;

        const searchLower = search.toLowerCase();
        return this.countries.filter(country => country.name.toLowerCase().includes(searchLower))
          // put countries that start with the search term at the beginning
          // and, put countries that end with the search term at the end
          .sort((a, b) => a.name.toLowerCase().indexOf(searchLower) - b.name.toLowerCase().indexOf(searchLower));
      }),
      map((results) => results.slice(0, 20)) // return first 20 results only
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
        setTimeout(() => this.registerAutoFillShortcuts(), 500);
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

  ngAfterViewInit() {
    this.registerAutoFillShortcuts();
  }

  private registerAutoFillShortcuts() {
    this.cartWrapper?.nativeElement.addEventListener("keyup", (e: KeyboardEvent) => {
      // ctrl + ` will fill the form
      if (e.ctrlKey && e.key === "`") {
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + 2);
        this.payFormCtrls.name.setValue("María Irene Uribe Galván");
        this.payFormCtrls.card.setValue("5662760010000013");
        this.payFormCtrls.zipCode.setValue("17870");
        this.payFormCtrls.securityCode.setValue("178");
        this.payFormCtrls.country.setValue("Mexico");
        this.payFormCtrls.expirationDate.setValue(expDate);

        this.billingFormCtrls.zipCode.setValue("78945");
        this.billingFormCtrls.email.setValue("alan@turing.ai");
        this.billingFormCtrls.country.setValue("Mexico");
        this.billingFormCtrls.address1.setValue("Address 1");
        this.billingFormCtrls.state.setValue("IDK");
      }
    }, false);
  }

  public submit() {
    const subscription: Subscription = this.apollo.mutate<{purchase: {total: string}}>({
      mutation: gql`mutation purchase($purchaseDetails: PurchaseInput!) {
        purchase(details: $purchaseDetails) {
          total
        }
      }`,
      variables: {
        purchaseDetails: {
          payment: { // payment details are ignored anyway
            cardNumber: "",
            cardHolderName: "",
            country: "",
            zipCode: "",
            expirationDate: "",
            cvv: 0,
          },
          billing: {
            address1: this.billingFormCtrls.address1.value,
            address2: this.billingFormCtrls.address2?.value || undefined,
            country: this.billingFormCtrls.country.value,
            zipCode: this.billingFormCtrls.zipCode.value,
            email: this.billingFormCtrls.email.value,
          }
        }
      },
      fetchPolicy: "no-cache"
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();
        if (!res.data?.purchase) {
          this.snackBar.open("Sorry 🥴. Couldn't complete purchase. Try again", "OK", {panelClass: "text-red-500"});
          return;
        }
        const sub = this.snackBar.open(
          "Purchase completed successfully. Thanks! Enjoy your music 🥰🎶",
          "OK",
          {
            panelClass: "text-green-500",
            duration: 5000,
            horizontalPosition: "right",
            verticalPosition: "top"
          }
        )
          .afterDismissed()
          .subscribe((val) => {
            sub.unsubscribe();
            //this.router.navigateByUrl(this.router.url, {});
          });
      },
      error: err => {
        subscription.unsubscribe();
        console.error(err);
        this.snackBar.open("Sorry 🥴. Couldn't complete purchase. Try again", "OK", {panelClass: "text-red-500"});
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

    if (control.hasError("email"))
      return "Invalid email";

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
