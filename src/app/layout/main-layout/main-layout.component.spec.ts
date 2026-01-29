import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
    });
    fixture = TestBed.createComponent(MainLayoutComponent);
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeInstanceOf(MainLayoutComponent);
  });
});
import { render } from '@testing-library/angular';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(MainLayoutComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
