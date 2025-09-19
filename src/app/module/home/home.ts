import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrls: ['./home.css']
})
export class Home {
    private router = inject(Router);
    constructor() {
        console.log("Home component");
    }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
    }
}