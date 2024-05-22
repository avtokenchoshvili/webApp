import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnimationService } from './animation.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingComponent } from "./components/loading/loading.component";
import { StartButtonComponent } from "./components/start-button/start-button.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
      ReactiveFormsModule,
      FormsModule,
      RouterOutlet,
      CommonModule,
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      MatMenuModule,
      LoadingComponent,
      StartButtonComponent
    ]
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') private canvasRef!: ElementRef;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private wall!: THREE.Mesh;
  private topDisk!: THREE.Mesh;
  private bottomDisk!: THREE.Mesh;
  private cards: THREE.Mesh[] = [];
  private group!: THREE.Group; // Group to contain wall and cards
  private targetRotationX = 0; // Rotation around the X-axis
  private targetRotationY = 0; // Rotation around the Y-axis
  private mouseDown = false;
  private mouseX = 0;
  private mouseY = 0;
  private mouseXOnMouseDown = 0;
  private mouseYOnMouseDown = 0;
  private targetRotationXOnMouseDown = 0;
  private targetRotationYOnMouseDown = 0;

  private images = [
    'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS1u05OPc7MSt9f5Dg2QMSbRPu_FHowIjog-jxeSwHIw&s',
    'https://images.unsplash.com/reserve/bOvf94dPRxWu0u3QsPjF_tree.jpg?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8bmF0dXJhbHxlbnwwfHx8fDE3MTYyODQ0MzN8MA&ixlib=rb-4.0.3',
    'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS1u05OPc7MSt9f5Dg2QMSbRPu_FHowIjog-jxeSwHIw&s',
    'https://images.unsplash.com/reserve/bOvf94dPRxWu0u3QsPjF_tree.jpg?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8bmF0dXJhbHxlbnwwfHx8fDE3MTYyODQ0MzN8MA&ixlib=rb-4.0.3',
  ];

  ngOnInit() { }

  ngAfterViewInit() {
    this.initThreeJS();
    this.animate();
  }

  private initThreeJS() {
    const canvas = this.canvasRef.nativeElement;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.z = 700;

    // Renderer with anti-aliasing enabled
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Create group
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Create the red wall
    this.createWall();
    this.createDisks();
    // Add cards
    this.addCards();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(directionalLight);
  }

  private createWall() {
    const geometry = new THREE.CylinderGeometry(300, 300, 200, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.wall = new THREE.Mesh(geometry, material);
    this.wall.rotation.y = Math.PI / 2; // Rotate to make it face the camera properly
    this.group.add(this.wall); // Add wall to the group
  }
  private createDisks() {
    const geometry = new THREE.CircleGeometry(300, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    this.topDisk = new THREE.Mesh(geometry, material);
    this.topDisk.position.y = 100;
    this.topDisk.rotation.x = Math.PI / 2;
    this.group.add(this.topDisk);

    this.bottomDisk = new THREE.Mesh(geometry, material);
    this.bottomDisk.position.y = -100;
    this.bottomDisk.rotation.x = -Math.PI / 2;
    this.group.add(this.bottomDisk);
  }
  private addCards() {
    const geometry = new THREE.PlaneGeometry(100, 150);

    const loader = new THREE.TextureLoader();

    for (let i = 0; i < this.images.length; i++) {
      loader.load(this.images[i], (texture) => {
        // Apply texture settings
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Enable anisotropic filtering if supported
        const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = anisotropy;

        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const card = new THREE.Mesh(geometry, material);
        const angle = (i / this.images.length) * Math.PI * 2;

        card.position.x = Math.cos(angle) * 300;
        card.position.z = Math.sin(angle) * 300;
        card.position.y = 0; // Keep it centered vertically on the wall
        card.rotation.y = -angle + Math.PI / 2; // Face the camera
        this.group.add(card); // Add card to the group
        this.cards.push(card);
      });
    }
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  @HostListener('window:wheel', ['$event'])
  onMouseWheel(event: WheelEvent) {
    const delta = Math.sign(event.deltaY);
    this.targetRotationY += delta * 0.05; // Adjust this value to control the speed

    this.updateGroupRotation();
  }

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.mouseDown = true;
    this.mouseXOnMouseDown = event.clientX;
    this.mouseYOnMouseDown = event.clientY;
    this.targetRotationXOnMouseDown = this.targetRotationX;
    this.targetRotationYOnMouseDown = this.targetRotationY;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.mouseDown) {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      const deltaX = this.mouseX - this.mouseXOnMouseDown;
      const deltaY = this.mouseY - this.mouseYOnMouseDown;
      this.targetRotationX = this.targetRotationXOnMouseDown + (deltaY * 0.01); // Adjust this value to control the sensitivity
      this.targetRotationY = this.targetRotationYOnMouseDown + (deltaX * 0.01); // Adjust this value to control the sensitivity
      this.updateGroupRotation();
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.mouseDown = false;
  }

  private updateGroupRotation() {
    this.group.rotation.x = this.targetRotationX;
    this.group.rotation.y = this.targetRotationY;
  }
}
