import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, RouterOutlet, TranslateModule, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
