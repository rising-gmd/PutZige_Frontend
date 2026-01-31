import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
    });
    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeInstanceOf(SidebarComponent);
  });
});
import { render } from '@testing-library/angular';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(SidebarComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
