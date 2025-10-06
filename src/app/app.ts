import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './store/userStore/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('banking-frontend');
  private userService = inject(UserService);

  ngOnInit() {
    // Initialize user state from localStorage on app start
    this.userService.initializeUserState();
  }
}
