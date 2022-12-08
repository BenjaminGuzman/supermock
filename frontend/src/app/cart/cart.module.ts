import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartComponent } from './cart/cart.component';
import {CartRoutingModule} from "./cart-routing.module";
import {GraphQLModule} from "./graphql.module";

@NgModule({
  declarations: [
    CartComponent
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
    GraphQLModule
  ]
})
export class CartModule { }
