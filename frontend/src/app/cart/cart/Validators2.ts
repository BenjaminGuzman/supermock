import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";
import * as cardValidator from "card-validator";

export class Validators2 {
  private static _digitsOnly(value?: string): ValidationErrors | null {
    if (value && /^[0-9]+/.test(value))
      return null;
    return {numbersOnly: true};
  }

  private static digitsOnlyNoTrim(control: AbstractControl): ValidationErrors | null {
    return Validators2._digitsOnly(control.value);
  }

  private static digitsOnlyTrim(control: AbstractControl): ValidationErrors | null {
    return Validators2._digitsOnly(control.value ? control.value.toString().trim() : '');
  }

  static digitsOnly(trim: boolean): ValidatorFn {
      return trim ? Validators2.digitsOnlyTrim : Validators2.digitsOnlyNoTrim;
  }

  static cardHolderName(control: AbstractControl): ValidationErrors | null {
    const name: string = control.value;
    if (name && !cardValidator.cardholderName(name).isValid)
      return {cardHolderName: true};
    return null;
  }

  static card(control: AbstractControl): ValidationErrors | null {
    const cardNo: string = control.value;
    if (cardNo && !cardValidator.number(cardNo).isValid)
      return {card: true};
    return null;
  }

  private static _dateBetween(value: Date | null, start: Date, end: Date): ValidationErrors | null {
    if (value && value.getTime() < start.getTime())
      return {dateBeforeStart: true};
    if (value && value.getTime() > end.getTime())
      return {dateAfterEnd: true};
    return null;
  }

  static dateBetween(start: Date, end: Date): ValidatorFn {
    return (control: AbstractControl) => Validators2._dateBetween(control.value, start, end);
  }
}
