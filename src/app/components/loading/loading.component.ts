import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {
  loadingDone = false;
  @HostBinding('class.loading') loadingClass = true;
  @HostBinding('class.loaded') loadedClass = false;
  ngOnInit(): void {
    setTimeout(() => {
      this.loadingDone = true;
    }, 1000); // Set loading time to 4 seconds
  }
  start() {
    const startButton = document.querySelector('.start-button') as HTMLElement;
    startButton.classList.remove('black-bg');
    startButton.classList.add('fade-out');

    this.loadingClass = false;
    this.loadedClass = true;
  }
}
