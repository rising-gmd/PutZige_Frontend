import { ToastModule } from 'primeng/toast';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  providers: [],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
