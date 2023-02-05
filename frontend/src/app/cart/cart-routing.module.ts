import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CartIndexComponent} from "./cart-index/cart-index.component";
import {InvoiceComponent} from "./invoice/invoice.component";

const routes: Routes = [
  {path: "", component: CartIndexComponent},
  {path: "invoice/:invoiceId", component: InvoiceComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CartRoutingModule { }
