import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
    });
    fixture = TestBed.createComponent(AuthLayoutComponent);
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeInstanceOf(AuthLayoutComponent);
  });
});
import { render } from '@testing-library/angular';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(AuthLayoutComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
