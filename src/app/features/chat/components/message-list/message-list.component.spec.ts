import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageListComponent } from './message-list.component';

describe('MessageListComponent', () => {
  let fixture: ComponentFixture<MessageListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MessageListComponent],
    });
    fixture = TestBed.createComponent(MessageListComponent);
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeInstanceOf(MessageListComponent);
  });
});
