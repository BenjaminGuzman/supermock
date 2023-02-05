import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";
import {Apollo, gql} from "apollo-angular";
import {Subscription} from "rxjs";
import {SessionService} from "../session.service";
import {Location} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndexComponent implements OnInit, AfterViewInit {
  @ViewChild("loginWrapper")
  loginWrapper: ElementRef | undefined;

  @ViewChild("registrationWrapper")
  registrationWrapper: ElementRef | undefined;

  registerForm: FormGroup;
  loginForm: FormGroup;

  successfulRegistration: boolean = false;
  registrationErrors: string[] = [];

  loginErrors: string[] = [];

  readonly registerConstraints: RegistrationControls = {
    firstName: {
      minLength: 2,
      maxLength: 100
    },
    lastName: {
      minLength: 2,
      maxLength: 100
    },
    username: {
      minLength: 2,
      maxLength: 100
    },
    password: {
      minLength: 8,
      maxLength: 500
    },
  };

  readonly registerControls: RegistrationControls = {
    firstName: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.firstName.minLength),
      Validators.maxLength(this.registerConstraints.firstName.maxLength)
    ]),
    lastName: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.lastName.minLength),
      Validators.maxLength(this.registerConstraints.lastName.maxLength)
    ]),
    dob: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    username: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.username.minLength),
      Validators.maxLength(this.registerConstraints.username.maxLength)
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.password.minLength),
      Validators.maxLength(this.registerConstraints.password.maxLength)
    ]),
    passwordConfirmation: new FormControl(null, [
      Validators.required,
    ]),
    gender: new FormControl("RATHER_NOT_SAY")
  };

  readonly loginControls: LoginControls = {
    username: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.username.minLength),
      Validators.maxLength(this.registerConstraints.username.maxLength)
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(this.registerConstraints.password.minLength),
      Validators.maxLength(this.registerConstraints.password.maxLength)
    ])
  };

  constructor(
    private apollo: Apollo,
    private changeDetectorRef: ChangeDetectorRef,
    private jwtService: SessionService,
    private router: Router
  ) {
    this.registerForm = new FormGroup(this.registerControls);
    this.loginForm = new FormGroup(this.loginControls);

    this.registerControls.passwordConfirmation.addValidators((control: AbstractControl) => {
      if (control.value === this.registerControls.password.value)
        return null;
      return {passwordMismatch: true};
    });
  }

  ngOnInit() {
    if (this.jwtService.jwt)
      this.router.navigateByUrl("/content/artists");
  }

  ngAfterViewInit() {
    const username = "tester";
    const password = "tester123456";

    this.loginWrapper?.nativeElement.addEventListener("keyup", (e: KeyboardEvent) => {
      // ctrl + ` will fill the form
      if (e.ctrlKey && e.key === "`") {
        this.loginControls.username.setValue(username);
        this.loginControls.password.setValue(password);
      }
    }, false);

    this.registrationWrapper?.nativeElement.addEventListener("keyup", (e: KeyboardEvent) => {
      // ctrl + ` will fill the form
      if (e.ctrlKey && e.key === "`") {
        const iDate = new Date();
        iDate.setMonth(6);
        iDate.setDate(15);
        iDate.setFullYear(2001);
        this.registerControls.dob.setValue(iDate);
        this.registerControls.password.setValue(password);
        this.registerControls.passwordConfirmation.setValue(password);
        this.registerControls.email.setValue("alan@turing.ai");
        this.registerControls.firstName.setValue("Lewis");
        this.registerControls.lastName.setValue("Gauss");
        this.registerControls.username.setValue(username);
      }
    }, false);
  }

  onLoginSubmit() {
    if (this.loginForm.invalid)
      return;

    const subscription: Subscription = this.apollo.query<{login: string}>({
      query: gql`
        query Login(
          $username: String!
          $password: String!
        ) {
          login(
            username: $username
            password: $password
          )
        }
      `,
      variables: {
        username: this.loginControls.username.value,
        password: this.loginControls.password.value,
      },
      errorPolicy: "all"
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();
        if (!res.errors) {
          this.changeDetectorRef.markForCheck();
          this.jwtService.jwt = res.data.login;
          this.router.navigateByUrl("/content/artists");
          return;
        }

        this.loginErrors = res.errors.map(error => error.message);
        this.changeDetectorRef.markForCheck();
      },
      error: (e) => {
        subscription.unsubscribe();
        console.error(e);
        alert(JSON.stringify(e));
      },
      complete: () => subscription.unsubscribe()
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid)
      return;

    const subscription: Subscription = this.apollo.mutate<{registerUser: {username: string}}>({
      mutation: gql`
        mutation RegisterUser(
          $username: String!
          $password: String!
          $firstName: String!
          $lastName: String!
          $dob: String!
          $email: String!
          $gender: String!
        ) {
          registerUser(userData: {
            username: $username
            password: $password
            firstName: $firstName
            lastName: $lastName
            dob: $dob
            email: $email
            gender: $gender
          }) {
            username
          }
        }
      `,
      variables: {
        username: this.registerControls.username.value,
        password: this.registerControls.password.value,
        firstName: this.registerControls.firstName.value,
        lastName: this.registerControls.lastName.value,
        dob: this.registerControls.dob.value,
        email: this.registerControls.email.value,
        gender: this.registerControls.gender.value
      },
      errorPolicy: "all",
      fetchPolicy: "network-only"
    }).subscribe({
      next: (res) => {
        subscription.unsubscribe();

        if (!res.errors) {
          this.successfulRegistration = true;
          this.changeDetectorRef.markForCheck();
          return;
        }

        this.registrationErrors = res.errors.map(error => error.message);
        this.changeDetectorRef.markForCheck();
      },
      error: (e) => {
        subscription.unsubscribe()
        console.error(e);
        alert(JSON.stringify(e));
      }
    });
  }

  getRegistrationErrorMsg(control: FormControl, controlName: keyof RegistrationControls): string {
    if (!control.errors)
      return "";

    if (control.hasError("required"))
      return "Field is required";

    if (control.hasError("minlength"))
      return `Minimum length is ${this.registerConstraints[controlName].minLength}`;

    if (control.hasError("maxlength"))
      return `Maximum length is ${this.registerConstraints[controlName].maxLength}`;

    if (control.hasError("email"))
      return "Must be an email";

    if (control.hasError("passwordMismatch"))
      return "Passwords are not equal";

    return "Something is not ok...";
  }

  getLoginErrorMsg(control: FormControl, controlName: keyof LoginControls): string {
    if (!control.errors)
      return "";

    if (control.hasError("required"))
      return "Field is required";

    if (control.hasError("minlength"))
      return `Minimum length is ${this.registerConstraints[controlName].minLength}`;

    if (control.hasError("maxlength"))
      return `Maximum length is ${this.registerConstraints[controlName].maxLength}`;

    return "Something is not ok...";
  }
}

type RegistrationControls = {
  firstName?: any;
  lastName?: any;
  dob?: any;
  email?: any;
  username?: any;
  password?: any;
  passwordConfirmation?: any;
  gender?: any;
};

type LoginControls = {
  username?: any;
  password?: any;
};
