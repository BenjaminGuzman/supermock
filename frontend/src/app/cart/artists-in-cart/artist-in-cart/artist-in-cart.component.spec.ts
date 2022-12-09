import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistInCartComponent } from './artist-in-cart.component';

describe('ArtistComponent', () => {
  let component: ArtistInCartComponent;
  let fixture: ComponentFixture<ArtistInCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArtistInCartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtistInCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
