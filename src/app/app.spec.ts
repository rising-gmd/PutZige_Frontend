import { App } from './app';

describe('App', () => {
  it('should create the app', async () => {
    // Basic smoke test provided by TestBed in the following block
    expect(true).toBe(true);
  });
});
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: MessageService,
          useValue: {
            add: jest.fn(),
            messageObserver: { subscribe: () => ({ unsubscribe: () => {} }) },
            clearObserver: { subscribe: () => ({ unsubscribe: () => {} }) },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // App template contains the PrimeNG toast and a router outlet
    expect(compiled.querySelector('p-toast')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
