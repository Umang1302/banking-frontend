import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('banking-frontend');

  private router = inject(Router);

  constructor() {
    console.log("App component loaded");
    this.router.navigate(['/login']);
  }
}
