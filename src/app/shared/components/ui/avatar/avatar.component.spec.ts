import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AvatarComponent],
    });
    fixture = TestBed.createComponent(AvatarComponent);
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeInstanceOf(AvatarComponent);
  });
});
import { render } from '@testing-library/angular';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  it('renders content', async () => {
    const { getByText } = await render(AvatarComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
