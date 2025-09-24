import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { UserService } from "../../store/userStore/user.service";
import { User } from "../../store/userStore/user.action";

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink],
    templateUrl: './home.html',
    styleUrls: ['./home.css']
})
export class Home {
    userService = inject(UserService);
    
    constructor() {
        console.log("Home component");
    }

    ngOnInit() {
        // Method 1: Subscribe to user$ observable and log whenever it changes
        this.userService.user$.subscribe(user => {
            console.log("Current User from State:", user);
        });

        // Method 2: Log authentication status
        this.userService.isAuthenticated$.subscribe(isAuth => {
            console.log("Is Authenticated:", isAuth);
        });

        // Method 3: Log user initials
        this.userService.userInitials$.subscribe(initials => {
            console.log("User Initials:", initials);
        });

        // Method 4: Log full name
        this.userService.userFullName$.subscribe(fullName => {
            console.log("User Full Name:", fullName);
        });
    }

    logout() {
        this.userService.logout();
    }

    logCurrentUser() {
        this.userService.user$.subscribe(user => {
            console.log("User Check:", user);
        }).unsubscribe();
    }

    // Helper method to get user display name
    getUserDisplayName(user: User | null): string {
        if (!user) return 'Guest';
        return user.firstName || user.username || user.email || 'User';
    }

    // Helper method to get user full name
    getUserFullName(user: User | null): string {
        if (!user) return '';
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.firstName || user.username || user.email || '';
    }
}