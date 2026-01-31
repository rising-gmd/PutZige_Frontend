import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatContainerComponent } from './chat-container.component';

describe('ChatContainerComponent', () => {
  let fixture: ComponentFixture<ChatContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatContainerComponent],
    });
    fixture = TestBed.createComponent(ChatContainerComponent);
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeInstanceOf(ChatContainerComponent);
  });
});
