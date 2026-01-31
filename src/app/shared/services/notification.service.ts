import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly msgs = inject(MessageService);

  showSuccess(detail: string, summary = 'Success'): void {
    this.msgs.add({ severity: 'success', summary, detail, life: 5000 });
  }

  showError(detail: string, summary = 'Error'): void {
    this.msgs.add({ severity: 'error', summary, detail, life: 7000 });
  }

  showInfo(detail: string, summary = 'Info'): void {
    this.msgs.add({ severity: 'info', summary, detail, life: 4000 });
  }
}
