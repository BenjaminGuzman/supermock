// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  usersUrl: "http://127.0.0.1:4000/v2/users/graphql",
  contentUrl: "http://127.0.0.1:5000/v2/content/graphql",
  cartUrl: "http://127.0.0.1:3000/v2/cart/graphql",
  captchaBaseUrl: "http://127.0.0.1:7000/v2/captcha"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
