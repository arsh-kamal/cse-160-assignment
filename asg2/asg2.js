const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
`;

let canvas;
let gl;

let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngle = 0;

let g_upperLegAngle = 0;
let g_lowerLegAngle = 0;
let g_footAngle = 0;

let g_backLegAngle = 0;
let g_headAngle = 0;
let g_tailAngle = 0;
let g_earAngle = 0;
let g_bodyBounce = 0;

let g_animationOn = false;

let g_mouseXAngle = 0;
let g_mouseYAngle = 0;
let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

let g_pokeAnimation = false;
let g_pokeStartTime = 0;

let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

let g_lastFrameTime = performance.now();

function main() {
  canvas = document.getElementById("webgl");

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context");
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");

  if (a_Position < 0 || !u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix) {
    console.log("Failed to connect GLSL variables");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  addActionsForHtmlUI();
  addMouseControls();

  requestAnimationFrame(tick);
}

function addActionsForHtmlUI() {
  document.getElementById("globalRotationSlide").addEventListener("input", function () {
    g_globalAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("upperLegSlide").addEventListener("input", function () {
    g_upperLegAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("lowerLegSlide").addEventListener("input", function () {
    g_lowerLegAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("footSlide").addEventListener("input", function () {
    g_footAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("headSlide").addEventListener("input", function () {
    g_headAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("tailSlide").addEventListener("input", function () {
    g_tailAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("backLegSlide").addEventListener("input", function () {
    g_backLegAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("animationOnButton").onclick = function () {
    g_animationOn = true;
  };

  document.getElementById("animationOffButton").onclick = function () {
    g_animationOn = false;
    restoreSliderAngles();
    renderScene();
  };

  document.getElementById("resetButton").onclick = function () {
    resetPig();
  };
}

function restoreSliderAngles() {
  g_earAngle = 0;
  g_bodyBounce = 0;

  g_upperLegAngle = Number(document.getElementById("upperLegSlide").value);
  g_lowerLegAngle = Number(document.getElementById("lowerLegSlide").value);
  g_footAngle = Number(document.getElementById("footSlide").value);
  g_headAngle = Number(document.getElementById("headSlide").value);
  g_tailAngle = Number(document.getElementById("tailSlide").value);
  g_backLegAngle = Number(document.getElementById("backLegSlide").value);
}

function resetPig() {
  g_animationOn = false;
  g_pokeAnimation = false;

  g_globalAngle = 0;
  g_upperLegAngle = 0;
  g_lowerLegAngle = 0;
  g_footAngle = 0;
  g_backLegAngle = 0;
  g_headAngle = 0;
  g_tailAngle = 0;
  g_earAngle = 0;
  g_bodyBounce = 0;

  g_mouseXAngle = 0;
  g_mouseYAngle = 0;

  document.getElementById("globalRotationSlide").value = 0;
  document.getElementById("upperLegSlide").value = 0;
  document.getElementById("lowerLegSlide").value = 0;
  document.getElementById("footSlide").value = 0;
  document.getElementById("headSlide").value = 0;
  document.getElementById("tailSlide").value = 0;
  document.getElementById("backLegSlide").value = 0;

  renderScene();
}

function addMouseControls() {
  canvas.onmousedown = function (ev) {
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeStartTime = g_seconds;
      return;
    }

    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmouseup = function () {
    g_isDragging = false;
  };

  canvas.onmouseleave = function () {
    g_isDragging = false;
  };

  canvas.onmousemove = function (ev) {
    if (!g_isDragging) {
      return;
    }

    let dx = ev.clientX - g_lastMouseX;
    let dy = ev.clientY - g_lastMouseY;

    g_mouseXAngle += dx * 0.5;
    g_mouseYAngle += dy * 0.5;

    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    renderScene();
  };
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderScene();
  updateFPS();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animationOn) {
    g_upperLegAngle = 12 * Math.sin(g_seconds * 3);
    g_lowerLegAngle = 8 * Math.sin(g_seconds * 3 + 0.8);
    g_footAngle = 7 * Math.sin(g_seconds * 3 + 1.4);

    g_backLegAngle = 10 * Math.sin(g_seconds * 3 + Math.PI);

    g_headAngle = 7 * Math.sin(g_seconds * 2.5);
    g_tailAngle = 35 * Math.sin(g_seconds * 5.5);
    g_earAngle = 7 * Math.sin(g_seconds * 4.5);
    g_bodyBounce = 0.02 * Math.abs(Math.sin(g_seconds * 3));
  }

  if (g_pokeAnimation) {
    let pokeTime = g_seconds - g_pokeStartTime;

    if (pokeTime < 1.2) {
      g_headAngle = 28 * Math.sin(pokeTime * 25);
      g_tailAngle = 75 * Math.sin(pokeTime * 32);
      g_earAngle = 22 * Math.sin(pokeTime * 28);
      g_bodyBounce = 0.07 * Math.abs(Math.sin(pokeTime * 18));

      g_upperLegAngle = 14 * Math.sin(pokeTime * 20);
      g_lowerLegAngle = 10 * Math.sin(pokeTime * 22);
      g_footAngle = 8 * Math.sin(pokeTime * 24);
      g_backLegAngle = 14 * Math.sin(pokeTime * 21);
    } else {
      g_pokeAnimation = false;

      if (!g_animationOn) {
        restoreSliderAngles();
      }
    }
  }
}

function updateFPS() {
  let now = performance.now();
  let delta = now - g_lastFrameTime;
  g_lastFrameTime = now;

  let fps = Math.round(1000 / delta);
  document.getElementById("fps").innerText = "FPS: " + fps;
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    let globalRotMat = new Matrix4();
  
    // Default front view.
    globalRotMat.rotate(90, 0, 1, 0);
  
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);
    globalRotMat.rotate(g_mouseYAngle, 1, 0, 0);
    globalRotMat.rotate(g_mouseXAngle, 0, 1, 0);
  
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
    drawPig();
  }

function drawPig() {
  const pink = [1.0, 0.55, 0.65, 1.0];
  const lightPink = [1.0, 0.72, 0.78, 1.0];
  const darkPink = [0.8, 0.25, 0.35, 1.0];
  const black = [0.02, 0.02, 0.02, 1.0];

  let pigRoot = new Matrix4();

  // Slightly moved up and centered better.
  pigRoot.translate(0.0, 0.10 + g_bodyBounce, 0.0);
  pigRoot.scale(0.92, 0.92, 0.92);

  // Body
  let body = new Cube();
  body.color = pink;
  body.matrix = new Matrix4(pigRoot);
  body.matrix.translate(-0.35, -0.15, 0.0);
  body.matrix.scale(1.1, 0.55, 0.55);
  body.render();

  // Head base
  let headBase = new Matrix4(pigRoot);
  headBase.translate(0.45, 0.05, 0.0);
  headBase.rotate(g_headAngle, 0, 1, 0);

  // Head
  let head = new Cube();
  head.color = pink;
  head.matrix = new Matrix4(headBase);
  head.matrix.scale(0.45, 0.45, 0.45);
  head.render();

  // Snout
  let snout = new Cube();
  snout.color = lightPink;
  snout.matrix = new Matrix4(headBase);
  snout.matrix.translate(0.30, -0.05, 0.0);
  snout.matrix.scale(0.22, 0.22, 0.28);
  snout.render();

  // Nostrils
  let nostril1 = new Cube();
  nostril1.color = darkPink;
  nostril1.matrix = new Matrix4(headBase);
  nostril1.matrix.translate(0.43, -0.06, 0.08);
  nostril1.matrix.scale(0.045, 0.045, 0.045);
  nostril1.render();

  let nostril2 = new Cube();
  nostril2.color = darkPink;
  nostril2.matrix = new Matrix4(headBase);
  nostril2.matrix.translate(0.43, -0.06, -0.08);
  nostril2.matrix.scale(0.045, 0.045, 0.045);
  nostril2.render();

  // Eyes placed on the front face so they are clearly visible.
  let eye1 = new Cube();
  eye1.color = black;
  eye1.matrix = new Matrix4(headBase);
  eye1.matrix.translate(0.46, 0.17, 0.13);
  eye1.matrix.scale(0.065, 0.065, 0.065);
  eye1.render();

  let eye2 = new Cube();
  eye2.color = black;
  eye2.matrix = new Matrix4(headBase);
  eye2.matrix.translate(0.46, 0.17, -0.13);
  eye2.matrix.scale(0.065, 0.065, 0.065);
  eye2.render();

  // Ears
  let ear1 = new Cube();
  ear1.color = lightPink;
  ear1.matrix = new Matrix4(headBase);
  ear1.matrix.translate(-0.05, 0.27, 0.18);
  ear1.matrix.rotate(-25 + g_earAngle, 1, 0, 0);
  ear1.matrix.scale(0.13, 0.25, 0.08);
  ear1.render();

  let ear2 = new Cube();
  ear2.color = lightPink;
  ear2.matrix = new Matrix4(headBase);
  ear2.matrix.translate(-0.05, 0.27, -0.18);
  ear2.matrix.rotate(25 - g_earAngle, 1, 0, 0);
  ear2.matrix.scale(0.13, 0.25, 0.08);
  ear2.render();

  // Cylinder tail
  let tailBase = new Matrix4(pigRoot);
  tailBase.translate(-0.98, 0.08, 0.0);
  tailBase.rotate(g_tailAngle, 0, 0, 1);
  tailBase.rotate(90, 0, 0, 1);

  let tail = new Cylinder();
  tail.color = darkPink;
  tail.matrix = new Matrix4(tailBase);
  tail.matrix.translate(-0.15, 0.0, 0.0);
  tail.matrix.scale(0.06, 0.32, 0.06);
  tail.render();

  // Front legs with 3-level joint chain
  drawJointedLeg(
    0.25,
    -0.38,
    0.18,
    pink,
    lightPink,
    darkPink,
    g_upperLegAngle,
    g_lowerLegAngle,
    g_footAngle,
    pigRoot
  );

  drawJointedLeg(
    0.25,
    -0.38,
    -0.18,
    pink,
    lightPink,
    darkPink,
    -g_upperLegAngle,
    -g_lowerLegAngle,
    -g_footAngle,
    pigRoot
  );

  // Back legs
  drawSimpleLeg(-0.65, -0.38, 0.18, pink, darkPink, g_backLegAngle, pigRoot);
  drawSimpleLeg(-0.65, -0.38, -0.18, pink, darkPink, -g_backLegAngle, pigRoot);
}

function drawJointedLeg(
  x,
  y,
  z,
  upperColor,
  lowerColor,
  footColor,
  upperAngle,
  lowerAngle,
  footAngle,
  rootMatrix
) {
  let upperBase = new Matrix4(rootMatrix);
  upperBase.translate(x, y, z);
  upperBase.rotate(upperAngle, 0, 0, 1);

  let upperLegDraw = new Matrix4(upperBase);
  upperLegDraw.translate(0, -0.12, 0);
  upperLegDraw.scale(0.13, 0.28, 0.13);

  let upperLeg = new Cube();
  upperLeg.color = upperColor;
  upperLeg.matrix = upperLegDraw;
  upperLeg.render();

  let lowerBase = new Matrix4(upperBase);
  lowerBase.translate(0, -0.28, 0);
  lowerBase.rotate(lowerAngle, 0, 0, 1);

  let lowerLegDraw = new Matrix4(lowerBase);
  lowerLegDraw.translate(0, -0.12, 0);
  lowerLegDraw.scale(0.11, 0.25, 0.11);

  let lowerLeg = new Cube();
  lowerLeg.color = lowerColor;
  lowerLeg.matrix = lowerLegDraw;
  lowerLeg.render();

  let footBase = new Matrix4(lowerBase);
  footBase.translate(0, -0.27, 0);
  footBase.rotate(footAngle, 0, 0, 1);

  let footDraw = new Matrix4(footBase);
  footDraw.translate(0.04, -0.04, 0);
  footDraw.scale(0.2, 0.08, 0.15);

  let foot = new Cube();
  foot.color = footColor;
  foot.matrix = footDraw;
  foot.render();
}

function drawSimpleLeg(x, y, z, legColor, footColor, legAngle, rootMatrix) {
  let legBase = new Matrix4(rootMatrix);
  legBase.translate(x, y, z);
  legBase.rotate(legAngle, 0, 0, 1);

  let leg = new Cube();
  leg.color = legColor;
  leg.matrix = new Matrix4(legBase);
  leg.matrix.translate(0, -0.12, 0);
  leg.matrix.scale(0.14, 0.33, 0.14);
  leg.render();

  let foot = new Cube();
  foot.color = footColor;
  foot.matrix = new Matrix4(legBase);
  foot.matrix.translate(0.04, -0.31, 0);
  foot.matrix.scale(0.22, 0.08, 0.15);
  foot.render();
}

main();