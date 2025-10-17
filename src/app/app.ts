import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './store/userStore/user.service';
import { SessionService } from './services/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('banking-frontend');
  private userService = inject(UserService);
  private sessionService = inject(SessionService);

  ngOnInit() {
    // Initialize user state from localStorage on app start
    this.userService.initializeUserState();
    
    // Initialize session monitoring to auto-logout on token expiry
    this.sessionService.initializeSessionMonitoring();
  }

  ngOnDestroy() {
    // Clean up session monitoring when app is destroyed
    this.sessionService.stopSessionMonitoring();
  }
}
