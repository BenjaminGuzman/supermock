import {NgModule} from '@angular/core';
import {ApolloModule, APOLLO_OPTIONS, APOLLO_NAMED_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import {environment} from "../../environments/environment";

export function createNamedApollo(httpLink: HttpLink): Record<string, ApolloClientOptions<any>> {
  return {
    content: {
      name: "content",
      link: httpLink.create({uri: environment.contentUrl}),
      cache: new InMemoryCache()
    },
    cart: {
      name: "cart",
      link: httpLink.create({uri: environment.cartUrl}),
      cache: new InMemoryCache()
    }
  }
}

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  return {
    link: httpLink.create({uri: environment.contentUrl}),
    cache: new InMemoryCache(),
    name: "content"
  };
}

@NgModule({
  exports: [ApolloModule],
  providers: [
    {
      // default apollo client
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
    {
      provide: APOLLO_NAMED_OPTIONS,
      useFactory: createNamedApollo,
      deps: [HttpLink]
    }
  ],
})
export class GraphQLModule {
}
