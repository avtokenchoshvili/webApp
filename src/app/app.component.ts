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
import { Easing } from '@tweenjs/tween.js';
import TWEEN from '@tweenjs/tween.js';

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
  private secondaryCamera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private wall!: THREE.Mesh;
  private topDisk!: THREE.Mesh;
  private bottomDisk!: THREE.Mesh;
  private cards: THREE.Mesh[] = [];
  private group!: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetRotationX = 0;
  private targetRotationY = 0;
  private mouseDown = false;
  private mouseX = 0;
  private mouseY = 0;
  private mouseXOnMouseDown = 0;
  private mouseYOnMouseDown = 0;
  private targetRotationXOnMouseDown = 0;
  private targetRotationYOnMouseDown = 0;
  isControlKeyPressed!:boolean
  private images = [
    'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS1u05OPc7MSt9f5Dg2QMSbRPu_FHowIjog-jxeSwHIw&s',
    'https://images.unsplash.com/reserve/bOvf94dPRxWu0u3QsPjF_tree.jpg?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8bmF0dXJhbHxlbnwwfHx8fDE3MTYyODQ0MzN8MA&ixlib=rb-4.0.3',
    'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS1u05OPc7MSt9f5Dg2QMSbRPu_FHowIjog-jxeSwHIw&s',
    'https://images.unsplash.com/reserve/bOvf94dPRxWu0u3QsPjF_tree.jpg?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8bmF0dXJhbHxlbnwwfHx8fDE3MTYyODQ0MzN8MA&ixlib=rb-4.0.3',
  ];

  private initialCameraPosition = new THREE.Vector3();
  private initialCameraLookAt = new THREE.Vector3();

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
    this.camera.position.set(0, 0, 700);
    this.initialCameraPosition.copy(this.camera.position);

    // Store initial camera look at
    this.camera.lookAt(0, 0, 0);
    this.camera.getWorldDirection(this.initialCameraLookAt);

    // Secondary camera
    this.secondaryCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    this.secondaryCamera.position.set(0, 500, 1500);

    // Renderer with anti-aliasing enabled
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Create group
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Create the red wall and disks
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
    const geometry = new THREE.CylinderGeometry(300, 300, 600, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.wall = new THREE.Mesh(geometry, material);
    this.wall.rotation.y = Math.PI / 2;
    this.group.add(this.wall);
  }

  private createDisks() {
    const geometry = new THREE.CircleGeometry(300, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    this.topDisk = new THREE.Mesh(geometry, material);
    this.topDisk.position.y = 300;
    this.topDisk.rotation.x = Math.PI / 2;
    this.group.add(this.topDisk);

    this.bottomDisk = new THREE.Mesh(geometry, material);
    this.bottomDisk.position.y = -300;
    this.bottomDisk.rotation.x = -Math.PI / 2;
    this.group.add(this.bottomDisk);
  }

  private addCards() {
    const geometry = new THREE.PlaneGeometry(100, 150);

    const loader = new THREE.TextureLoader();

    for (let i = 0; i < this.images.length; i++) {
      loader.load(this.images[i], (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = anisotropy;

        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const card = new THREE.Mesh(geometry, material);
        const angle = (i / this.images.length) * Math.PI * 2;

        card.position.x = Math.cos(angle) * 300;
        card.position.z = Math.sin(angle) * 300;
        card.position.y = 0;
        card.rotation.y = -angle + Math.PI / 2;
        card.userData = { id: i };

        this.group.add(card);
        this.cards.push(card);
      });
    }
  }

  private onCardClick(card: THREE.Mesh) {
    const targetPosition = new THREE.Vector3();
    card.getWorldPosition(targetPosition);

    // Calculate new camera position
    const newCameraPosition = targetPosition.clone().add(new THREE.Vector3(0, 0, 200));

    // Tween camera position
    new TWEEN.Tween(this.camera.position)
      .to({ x: newCameraPosition.x, y: newCameraPosition.y, z: newCameraPosition.z }, 1000)
      .easing(Easing.Quadratic.InOut)
      .start();

    // Tween camera look at
    new TWEEN.Tween(this.camera)
      .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 1000)
      .easing(Easing.Quadratic.InOut)
      .onUpdate(() => this.camera.lookAt(targetPosition))
      .start();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
    TWEEN.update();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  @HostListener('window:wheel', ['$event'])
  onMouseWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      this.switchToSecondaryCamera();
    } else {
      const delta = Math.sign(event.deltaY);
      this.targetRotationY += delta * 0.05;
      this.updateGroupRotation();
    }
  }

  private switchToSecondaryCamera() {
    const newCameraPosition = { x: this.secondaryCamera.position.x, y: this.secondaryCamera.position.y, z: this.secondaryCamera.position.z };
    const target = new THREE.Vector3(0, 0, 0);

    new TWEEN.Tween(this.camera.position)
      .to(newCameraPosition, 1000)
      .easing(Easing.Quadratic.InOut)
      .start();

    new TWEEN.Tween(this.camera)
      .to({ lookAt: target }, 1000)
      .easing(Easing.Quadratic.InOut)
      .onUpdate(() => this.camera.lookAt(target))
      .start();
  }

  private resetToInitialCamera() {
    const initialPosition = this.initialCameraPosition;
    const initialLookAt = this.initialCameraLookAt;

    // Tween camera position back to initial
    new TWEEN.Tween(this.camera.position)
      .to({ x: initialPosition.x, y: initialPosition.y, z: initialPosition.z }, 1000)
      .easing(Easing.Quadratic.InOut)
      .start();

    // Tween camera look at back to initial
    new TWEEN.Tween(this.camera)
      .to({ lookAt: initialLookAt }, 1000)
      .easing(Easing.Quadratic.InOut)
      .onUpdate(() => this.camera.lookAt(initialLookAt))
      .start();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.isControlKeyPressed = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.isControlKeyPressed = false;
      this.resetToInitialCamera();
    }
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
      this.targetRotationX = this.targetRotationXOnMouseDown + (deltaY * 0.01);
      this.targetRotationY = this.targetRotationYOnMouseDown + (deltaX * 0.01);
      this.updateGroupRotation();
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.mouseDown = false;
  }

  @HostListener('window:click', ['$event'])
  onClick(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cards);

    if (intersects.length > 0) {
      const clickedCard = intersects[0].object as THREE.Mesh;
      this.onCardClick(clickedCard);
    }
  }

  private updateGroupRotation() {
    this.group.rotation.x = this.targetRotationX;
    this.group.rotation.y = this.targetRotationY;
  }
}
