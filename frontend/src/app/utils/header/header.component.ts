import {Component, Input, OnInit} from '@angular/core';

import {SessionService} from "../../session.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input()
  public navigation: NavItem[] = [];

  constructor(private sessionService: SessionService, private router: Router) { }

  ngOnInit(): void {
  }

  public logout() {
    this.sessionService.clear();
    this.router.navigateByUrl("/");
  }

}

export interface NavItem {
  name: string;
  url?: string;
}
