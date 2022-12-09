import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistsInCartComponent } from './artists-in-cart.component';

describe('ArtistsComponent', () => {
  let component: ArtistsInCartComponent;
  let fixture: ComponentFixture<ArtistsInCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArtistsInCartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtistsInCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
