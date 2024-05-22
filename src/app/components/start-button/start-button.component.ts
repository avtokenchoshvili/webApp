import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start-button',
  standalone: true,
  imports: [],
  templateUrl: './start-button.component.html',
  styleUrl: './start-button.component.scss'
})
export class StartButtonComponent {
  constructor(private router: Router) { }

  navigateToWebsite(): void {
    window.location.href = 'https://your-website-url.com'; // Replace with your actual website URL
  }
}
