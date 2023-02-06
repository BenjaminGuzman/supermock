import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IndexComponent} from "./index/index.component";
import {AuthGuard} from "./auth.guard";
import {ForbiddenComponent} from "./forbidden/forbidden.component";

const routes: Routes = [
  {path: "", component: IndexComponent},
  {
    path: "content",
    loadChildren: () => import("./content/content.module").then(m => m.ContentModule),
    canActivate: [AuthGuard]
  },
  {
    path: "cart",
    loadChildren: () => import("./cart/cart.module").then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: "captcha",
    loadChildren: () => import("./captcha/captcha.module").then(m => m.CaptchaModule),
  },
  {path: "forbidden", component: ForbiddenComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
