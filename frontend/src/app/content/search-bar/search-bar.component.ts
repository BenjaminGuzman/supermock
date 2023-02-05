import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent<T extends Record<string, any>> implements OnInit {
  @Input()
  public label: string = "Search";

  @Input()
  public placeholder: string = "";

  @Input()
  public hint: string = "";

  @Input()
  public data: T[] = [];

  @Input()
  public searchBy: keyof T = "" as keyof T;

  @Output()
  public results = new EventEmitter<T[]>();

  @ViewChild("input")
  public input: ElementRef = {} as ElementRef;

  constructor() { }

  ngOnInit(): void {
    return this.results.emit(this.data);
  }

  filterResults() {
    const value: string = this.input.nativeElement.value || "";
    if (!value)
      return this.results.emit(this.data);

    const searchLower: string = value.toLowerCase();
    // TODO put intermediate results (toLowerCase, normalize, ...) in cache so that
    //  that computation is not done over and over again
    this.results.emit(
      this.data
        .filter((item: T) => (item[this.searchBy] as string).toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(searchLower))
        // put items that start with the search term at the beginning
        .sort((a, b) => a[this.searchBy].toLowerCase().normalize("NFD").indexOf(searchLower) - b[this.searchBy].toLowerCase().normalize("NFD").indexOf(searchLower))
    );
  }
}
