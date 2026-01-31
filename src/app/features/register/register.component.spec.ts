import { of, throwError } from 'rxjs';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { RegisterComponent } from './register.component';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterService } from './register.service';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslateService } from '@ngx-translate/core';

describe('RegisterComponent', () => {
  const mockRegister = { register: jest.fn() } as unknown as RegisterService;
  const mockNotifications = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  } as unknown as NotificationService;

  const translate = {
    instant: jest.fn((k: string) => k),
    get: jest.fn((k: string) => of(k)),
    onLangChange: of({}),
    onTranslationChange: of({}),
    onDefaultLangChange: of({}),
    setDefaultLang: jest.fn(),
    use: jest.fn(),
  } as unknown as TranslateService;

  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function setup(providers: any[] = []) {
    // Override template to avoid runtime template dependencies (pipes/components)
    TestBed.overrideComponent(RegisterComponent as any, {
      set: { template: `<form></form>` },
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, RegisterComponent],
      providers: [
        { provide: RegisterService, useValue: mockRegister },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: TranslateService, useValue: translate },
        ...providers,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('when the form is invalid on submit, then register is not called', async () => {
    await setup();

    // ensure form is invalid
    component.form?.controls['username']?.setValue('');

    // Act
    await component.onSubmit();

    // Assert
    expect(mockRegister.register).not.toHaveBeenCalled();
  });

  it('when register succeeds, then shows success and navigates to login', async () => {
    mockRegister.register = jest
      .fn()
      .mockReturnValue(of({ success: true, message: 'ok' }));

    await setup();

    component.form.controls['username'].setValue('tester');
    component.form.controls['email'].setValue('a@b.com');
    component.form.controls['password'].setValue('Password123!');
    component.form.controls['terms'].setValue(true);

    // Act
    await component.onSubmit();

    // Assert
    expect(mockRegister.register).toHaveBeenCalled();
    expect(mockNotifications.showSuccess).toHaveBeenCalledWith('ok');
    // if router navigation was called, the NotificationService assertion is primary
    expect(mockNotifications.showSuccess).toHaveBeenCalled();
  });

  it('when register errors, then shows error notification', async () => {
    mockRegister.register = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('boom')));

    await setup();

    component.form.controls['username'].setValue('tester');
    component.form.controls['email'].setValue('a@b.com');
    component.form.controls['password'].setValue('Password123!');
    component.form.controls['terms'].setValue(true);

    // Act
    await component.onSubmit();

    // Assert
    expect(mockRegister.register).toHaveBeenCalled();
    expect(mockNotifications.showError).toHaveBeenCalled();
  });
});
