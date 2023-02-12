"use strict";

let canvas = null;
let gl = null;
let numParticles = 4000;
let pos = null;
let vel = null;
let col = null;
let shader = null;

let texWidth = 0;
let texHeight = 0;
let posTex = null;
let colTex = null;

let viewProj = null;



class Particles {
  constructor(n, r, g, b) {
    this.pos = new Float32Array(n * 2);
    this.vel = new Float32Array(n * 2);
    this.col = new Float32Array([r, g, b]);
  }
}


function roundUpPow2(x) {
  x -= 1;
  x |= x >> 1;
  x |= x >> 2;
  x |= x >> 4;
  x |= x >> 8;
  x |= x >> 16;
  x += 1;
  return x;
}


function calculatePow2Dims(n) {
  let sqrtN = Math.ceil(Math.sqrt(n));
  let w = roundUpPow2(sqrtN);
  let h = roundUpPow2(Math.ceil(n / w));
  return [w, h];
}


function init() {
  canvas = document.body.querySelector('#c');
  let pixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * pixelRatio;
  canvas.height = canvas.offsetHeight * pixelRatio;

  [texWidth, texHeight] = calculatePow2Dims(numParticles);
  numParticles = texWidth * texHeight;

  pos = new Float32Array(2 * numParticles);
  vel = new Float32Array(2 * numParticles);
  col = new Uint8Array(4 * numParticles);

  let setPos = (i, x, y) => {
    i *= 2;
    pos[i++] = x;
    pos[i++] = y;
  };
  let setCol = (i, r, g, b, a) => {
    i *= 4;
    col[i++] = r;
    col[i++] = g;
    col[i++] = b;
    col[i++] = a;
  };
  let w = canvas.width;
  let h = canvas.height;
  for (let i = 0; i < numParticles; ++i) {
    let x = 0.9 * canvas.width * (Math.random() - 0.5);
    let y = 0.9 * canvas.height * (Math.random() - 0.5);
    setPos(i, x, y);
    setCol(i, 256 * Math.random(), 256 * Math.random(), 256 * Math.random(), 255);
  }

  gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
  });
  for (let ext of gl.getSupportedExtensions()) {
    console.log(ext);
  }

  posTex = createTexture2D(gl, texWidth, texHeight, gl.RG32F, pos);
  colTex = createTexture2D(gl, texWidth, texHeight, gl.RGBA8, col);

  let vs = createShader(gl, gl.VERTEX_SHADER, VS);
  let fs = createShader(gl, gl.FRAGMENT_SHADER, PS);
  shader = createProgram(gl, vs, fs);
  console.log(shader);

  viewProj = m4.newOrtho(-w / 2, w / 2, h / 2, -h / 2, -1, 1);
}


function step() {
  for (let i = 0; i < numParticles; ++i) {
    for (let j = i + 1; j < numParticles; ++j) {
      let pxi = pos[i * 2    ];
      let pyi = pos[i * 2 + 1];
      let pxj = pos[j * 2    ];
      let pyj = pos[j * 2 + 1];
      let dx = pxj - pxi;
      let dy = pyj - pyi;
      let disSqr = dx * dx + dy * dy;

      const threshold = 200;
      if (disSqr > threshold * threshold) continue;

      let dis = Math.sqrt(disSqr) / threshold;
      if (dis < 0.00000001) continue;


      let rmin = 0.15;
      let a = 0.1;
      let force = dis < rmin ?  (dis / rmin - 1) : a * (1 - Math.abs(1 + rmin - 2 * dis) / (1 - rmin));


      /// let force;
      /// let repel = -1.0;
      /// let attract = 0.1;
      /// let repelDis = 0.3;
      /// let attractDis = 0.9;
      /// let maxDis = 1.0;
      /// if (dis < repelDis) {
      ///   force = repel * (1 - dis / repelDis);
      /// } else if (dis < attractDis) {
      ///   force = attract * ((dis - repelDis) / (attractDis - repelDis));
      /// } else {
      ///   force = attract * (dis - attractDis) / (maxDis - attractDis);
      /// }

      vel[i * 2    ] += dx * force / dis;
      vel[i * 2 + 1] += dy * force / dis;
      vel[j * 2    ] -= dx * force / dis;
      vel[j * 2 + 1] -= dy * force / dis;

      vel[i * 2    ] *= 0.99;
      vel[i * 2 + 1] *= 0.99;
      vel[j * 2    ] *= 0.99;
      vel[j * 2 + 1] *= 0.99;
    }
  }

  for (let i = 0; i < numParticles * 2;) {
    pos[i] += vel[i] / 60;
    if (pos[i] < -canvas.width / 2) {
      pos[i] += canvas.width;
    } else if (pos[i] > canvas.width / 2) {
      pos[i] -= canvas.width;
    }
    i += 1;

    pos[i] += vel[i] / 60;
    if (pos[i] < -canvas.height / 2) {
      pos[i] += canvas.height;
    } else if (pos[i] > canvas.height / 2) {
      pos[i] -= canvas.height;
    }
    i += 1;
  }
}


function update() {
  step();
  render();
  window.requestAnimationFrame(update);
}


function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shader.handle);
  gl.uniform2i(shader.uniforms.texSize.loc, posTex.width, posTex.height);
  gl.uniform2f(shader.uniforms.resolution.loc, canvas.width, canvas.height);

  gl.uniformMatrix4fv(shader.uniforms.viewProj.loc, false, viewProj);

  gl.activeTexture(gl.TEXTURE0 + shader.samplers.posTex.texUnit);
  gl.bindTexture(gl.TEXTURE_2D, posTex.handle);
  gl.texImage2D(gl.TEXTURE_2D, 0, posTex.internalFormat, posTex.width, posTex.height, 0, posTex.format, posTex.type, pos);

  gl.activeTexture(gl.TEXTURE0 + shader.samplers.colTex.texUnit);
  gl.bindTexture(gl.TEXTURE_2D, colTex.handle);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  gl.drawArrays(gl.TRIANGLES, 0, 6 * numParticles);
}


window.addEventListener('load', () => {
  init();
  window.requestAnimationFrame(update);
});

