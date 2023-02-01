import {Component, Input, OnInit} from '@angular/core';
import {Track} from "./track";
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  @Input()
  public trackData!: Track;

  constructor(private apollo: Apollo, private snackBar: MatSnackBar) { }

  add2Cart(trackId: number) {
    const subscription: Subscription = this.apollo.use("cart").mutate<{addTracks: {tracksInCart: {id: number}[]}}>({
      mutation: gql`mutation addTracks($ids: [ID!]!) {
        addTracks(ids: $ids) {
          tracksInCart {
            id
          }
        }
      }`,
      variables: {
        ids: [trackId]
      },
      errorPolicy: "all"
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();

        if (res.errors) {
          this.snackBar.open(res.errors[0].message, "OK", {panelClass: "text-red-500"});
          console.error(res.errors);
          return;
        }

        const trackOccurrences = res.data?.addTracks.tracksInCart
          .map((track) => track.id)
          .filter((idInCart) => trackId === idInCart)
          .length;
        if (trackOccurrences == 1) {
          this.snackBar.open(
            `Successfully added "${this.chop(this.trackData.title, 20)}" to cart`,
            "OK",
            {
              panelClass: "text-green-500",
              duration: 5000
            }
          );
        } else
          this.snackBar.open("Couldn't add track. sorry 🥴", "OK", {panelClass: "text-red-500"});
      },
      error: (err: Error) => {
        subscription.unsubscribe();
        this.snackBar.open("Failed to add tracks, sorry 🥴", "OK", {panelClass: "text-red-500"});
        console.error(err);
      },
      complete: () => subscription.unsubscribe()
    })
  }

  ngOnInit(): void {
  }

  /**
   * Chop a string (if needed) to match the given length
   *
   * If string is chop, ellipsis is added to the returned string,
   * @param str string to be chop
   * @param len max length desired
   * @private
   */
  private chop(str: string, len: number): string {
    if (str.length <= len)
      return str;

    return `${str.substring(0, len - 3)}...`;
  }
}
