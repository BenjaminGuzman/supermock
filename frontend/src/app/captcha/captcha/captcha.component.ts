import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptchaComponent {
  public form: FormGroup;

  public answerCtrl = new FormControl(null, [
    Validators.required
  ]);

  public captcha: Captcha | undefined;

  public resultSrc: string | undefined;

  constructor(private httpClient: HttpClient, private changeDetectorRef: ChangeDetectorRef) {
    this.form = new FormGroup<any>({
      answer: this.answerCtrl
    });
    this.load();
  }

  public load() {
    const subscription = this.httpClient.get<Captcha>(environment.captchaBaseUrl)
      .subscribe({
        next: (res) => {
          subscription.unsubscribe();
          this.captcha = res;
          this.changeDetectorRef.markForCheck();
        },
        error: (err) => {
          subscription.unsubscribe();
          alert("Sorry! Error occurred 😭");
          console.error(err);
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public reload() {
    this.resultSrc = '';
    const subscription = this.httpClient.post<Captcha>(`${environment.captchaBaseUrl}/reload`,{
      id: this.captcha?.id,
      type: "image"
    })
      .subscribe({
        next: (res) => {
          subscription.unsubscribe();
          this.captcha = res;
          this.changeDetectorRef.markForCheck();
        },
        error: (err) => {
          subscription.unsubscribe();
          alert("Sorry! Error occurred 😭");
          console.error(err);
          this.changeDetectorRef.markForCheck();
        }
      })
  }

  public onSubmit() {
    if (this.form.invalid)
      return;

    const subscription = this.httpClient.post<ResultGif>(`${environment.captchaBaseUrl}/validate`, {
      id: this.captcha?.id,
      answer: this.answerCtrl.value,
    })
      .subscribe({
        next: (res: ResultGif) => {
          subscription.unsubscribe();

          this.resultSrc = `data:${res.mimeType};base64,${res.response}`;
          this.changeDetectorRef.markForCheck();
        },
        error: (err) => {
          subscription.unsubscribe();
          alert("Sorry! Error occurred 😭");
          console.error(err);
          this.changeDetectorRef.markForCheck();
        }
      });
  }
}

interface ResultGif {
  response: string;
  mimeType: string;
}

interface Captcha {
  id: string;
  type: "audio" | "image";
  captcha: string;
}
