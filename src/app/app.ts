import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, RouterOutlet, TranslateModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
