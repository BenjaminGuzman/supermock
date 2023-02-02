import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartComponent } from './cart/cart.component';
import {CartRoutingModule} from "./cart-routing.module";
import {GraphQLModule} from "./graphql.module";
import {UtilsModule} from "../utils/utils.module";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import { ArtistsInCartComponent } from './artists-in-cart/artists-in-cart.component';
import { ArtistInCartComponent } from './artists-in-cart/artist-in-cart/artist-in-cart.component';
import {MatExpansionModule} from "@angular/material/expansion";
import {MatStepperModule} from "@angular/material/stepper";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {ReactiveFormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    CartComponent,
    ArtistsInCartComponent,
    ArtistInCartComponent
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
    GraphQLModule,
    UtilsModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ]
})
export class CartModule { }
