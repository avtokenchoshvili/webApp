import { Injectable, ElementRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexPosition: number = 0;
  private timeUniform: WebGLUniformLocation | null = null;
  private resolutionUniform: WebGLUniformLocation | null = null;

  init(canvas: ElementRef<HTMLCanvasElement>): void {
    this.gl = canvas.nativeElement.getContext('webgl');

    if (!this.gl) {
      console.error('Unable to initialize WebGL.');
      return;
    }

    const vertexShaderSource = `
      attribute vec4 aVertexPosition;
      void main(void) {
        gl_Position = aVertexPosition;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform float uTime;
      uniform vec2 uResolution;
      void main(void) {
        vec2 st = gl_FragCoord.xy / uResolution;
        gl_FragColor = vec4(abs(sin(uTime + st.x * 3.14159)), st.y, 0.5, 1.0);
      }
    `;

    const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = this.gl.createProgram();
    if (!this.program) {
      console.error('Unable to create WebGL program.');
      return;
    }

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.program));
      return;
    }

    this.gl.useProgram(this.program);

    this.vertexPosition = this.gl.getAttribLocation(this.program, 'aVertexPosition');
    this.timeUniform = this.gl.getUniformLocation(this.program, 'uTime');
    this.resolutionUniform = this.gl.getUniformLocation(this.program, 'uResolution');

    const vertices = new Float32Array([
      -1.0,  1.0,
      -1.0, -1.0,
       1.0,  1.0,
       1.0, -1.0,
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.vertexPosition);

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  animate(time: number): void {
    if (!this.gl || !this.program || !this.timeUniform || !this.resolutionUniform) {
      return;
    }

    this.gl.uniform1f(this.timeUniform, time * 0.001);
    this.gl.uniform2f(this.resolutionUniform, this.gl.canvas.width, this.gl.canvas.height);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame((time) => this.animate(time));
  }

  private loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create shader.');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed.');
    }

    return shader;
  }

  private resize(): void {
    if (!this.gl) {
      return;
    }

    const canvas = this.gl.canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
  }
}
