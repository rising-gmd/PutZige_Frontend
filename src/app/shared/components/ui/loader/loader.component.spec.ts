import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoaderComponent],
    });
    fixture = TestBed.createComponent(LoaderComponent);
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeInstanceOf(LoaderComponent);
  });
});
import { render } from '@testing-library/angular';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(LoaderComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
