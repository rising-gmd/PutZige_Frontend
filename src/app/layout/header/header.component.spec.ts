import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
    });
    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('creates the component', () => {
    const comp = fixture.componentInstance;
    expect(comp).toBeInstanceOf(HeaderComponent);
  });
});
import { render } from '@testing-library/angular';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(HeaderComponent);
    // Header renders the application brand
    expect(getByText('PutZige')).toBeTruthy();
  });
});
