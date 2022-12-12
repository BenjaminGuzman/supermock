import {Component, Input, OnInit} from '@angular/core';
import {Track} from "./track";
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  @Input()
  public trackData!: Track;

  constructor(private apollo: Apollo) { }

  add2Cart(trackId: number) {
    const subscription: Subscription = this.apollo.use("cart").mutate<{addTracks: number}>({
      mutation: gql`mutation addTracks($ids: [ID!]!) {
        addTracks(ids: $ids)
      }`,
      variables: {
        ids: [trackId]
      }
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();
        // TODO HANDLE RESPONSE
        console.log(res.data);
      },
      error: (err: Error) => {
        subscription.unsubscribe();
        // TODO HANDLE RESPONSE
        console.error("Failed to add tracks");
        console.error(err);
      },
      complete: () => subscription.unsubscribe()
    })
  }

  ngOnInit(): void {
  }

}
