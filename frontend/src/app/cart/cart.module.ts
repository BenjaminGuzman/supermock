import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartComponent } from './cart/cart.component';
import {CartRoutingModule} from "./cart-routing.module";
import {GraphQLModule} from "./graphql.module";
import {UtilsModule} from "../utils/utils.module";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

@NgModule({
  declarations: [
    CartComponent
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
    GraphQLModule,
    UtilsModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class CartModule { }
