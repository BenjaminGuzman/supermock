import { Component, OnInit } from '@angular/core';
import {NavItem} from "../../utils/header/header.component";

@Component({
  selector: 'app-cart-index',
  templateUrl: './cart-index.component.html',
  styleUrls: ['./cart-index.component.scss']
})
export class CartIndexComponent implements OnInit {
  public navigation: NavItem[] = [{name: "Shopping cart", url: "/cart"}];

  constructor() { }

  ngOnInit(): void {
  }

}
