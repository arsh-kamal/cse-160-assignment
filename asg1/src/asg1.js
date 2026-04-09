let canvas;
let gl;

let a_Position;
let u_FragColor;
let u_Size;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedType = POINT;

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

let g_shapesList = [];
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10.0;
let g_selectedSegments = 10;

let g_backgroundColor = [0.0, 0.0, 0.0, 1.0];
let g_showPicture = false;

class Point {
  constructor() {
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;

    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor() {
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    let d = this.size / 200.0;

    drawTriangle([
      xy[0], xy[1] + d,
      xy[0] - d, xy[1] - d,
      xy[0] + d, xy[1] - d
    ]);
  }
}

class Circle {
  constructor() {
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
    this.segments = 10;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;
    let segments = this.segments;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    let d = size / 200.0;
    let angleStep = 360 / segments;

    for (let angle = 0; angle < 360; angle += angleStep) {
      let angle1 = angle;
      let angle2 = angle + angleStep;

      let x1 = xy[0] + Math.cos(angle1 * Math.PI / 180) * d;
      let y1 = xy[1] + Math.sin(angle1 * Math.PI / 180) * d;
      let x2 = xy[0] + Math.cos(angle2 * Math.PI / 180) * d;
      let y2 = xy[1] + Math.sin(angle2 * Math.PI / 180) * d;

      drawTriangle([
        xy[0], xy[1],
        x1, y1,
        x2, y2
      ]);
    }
  }
}

function drawTriangle(vertices) {
  const n = 3;

  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create buffer');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawColoredTriangle(vertices, color) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  drawTriangle(vertices);
}

function drawStar(cx, cy, s, color) {
  drawColoredTriangle([cx, cy + s, cx - s * 0.42, cy, cx + s * 0.42, cy], color);
  drawColoredTriangle([cx, cy - s, cx - s * 0.42, cy, cx + s * 0.42, cy], color);
}

function drawRocketScene() {

  // ── STARS ────────────────────────────────────────────────────────────────
  drawStar(-0.72,  0.75, 0.07, [1.00, 0.82, 0.28, 1.0]);
  drawStar(-0.55,  0.30, 0.04, [0.60, 0.88, 1.00, 1.0]);
  drawStar( 0.72,  0.55, 0.05, [0.60, 0.88, 1.00, 1.0]);
  drawStar( 0.68, -0.12, 0.05, [1.00, 0.82, 0.28, 1.0]);
  drawStar(-0.58, -0.65, 0.04, [0.60, 0.88, 1.00, 1.0]);
  drawStar( 0.28, -0.82, 0.04, [1.00, 0.60, 0.20, 1.0]);

  // ── LEFT FIN ─────────────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.20,  0.00,   -0.68, -0.55,   -0.20, -0.42],
    [1.00, 0.22, 0.22, 1.0]
  );
  drawColoredTriangle(
    [-0.20,  0.00,   -0.20, -0.42,   -0.28, -0.22],
    [0.60, 0.05, 0.05, 1.0]
  );

  // ── RIGHT FIN ────────────────────────────────────────────────────────────
  drawColoredTriangle(
    [ 0.20,  0.00,    0.68, -0.55,    0.20, -0.42],
    [1.00, 0.22, 0.22, 1.0]
  );
  drawColoredTriangle(
    [ 0.20,  0.00,    0.20, -0.42,    0.28, -0.22],
    [0.60, 0.05, 0.05, 1.0]
  );

  // ── ROCKET BODY lower ────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.20, -0.40,    0.20, -0.40,   -0.20,  0.00],
    [0.90, 0.90, 0.94, 1.0]
  );
  drawColoredTriangle(
    [ 0.20, -0.40,   -0.20,  0.00,    0.20,  0.00],
    [0.80, 0.80, 0.88, 1.0]
  );

  // ── ROCKET BODY upper ────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.20,  0.00,    0.20,  0.00,   -0.13,  0.42],
    [0.92, 0.92, 0.96, 1.0]
  );
  drawColoredTriangle(
    [ 0.20,  0.00,   -0.13,  0.42,    0.13,  0.42],
    [0.82, 0.82, 0.88, 1.0]
  );

  // ── NOSE CONE ────────────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.13, 0.42,    0.13, 0.42,    0.00, 0.86],
    [1.00, 0.22, 0.22, 1.0]
  );
  drawColoredTriangle(
    [-0.04, 0.52,    0.00, 0.86,    0.00, 0.52],
    [1.00, 0.60, 0.60, 1.0]
  );

  // ── NOZZLE ───────────────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.10, -0.40,    0.10, -0.40,   -0.05, -0.52],
    [0.22, 0.30, 0.50, 1.0]
  );
  drawColoredTriangle(
    [ 0.10, -0.40,   -0.05, -0.52,    0.05, -0.52],
    [0.30, 0.38, 0.60, 1.0]
  );

  // ── FLAME ────────────────────────────────────────────────────────────────
  drawColoredTriangle(
    [-0.14, -0.52,    0.14, -0.52,    0.00, -0.95],
    [1.00, 0.48, 0.08, 1.0]
  );
  drawColoredTriangle(
    [-0.05, -0.52,   -0.28, -0.62,   -0.02, -0.70],
    [1.00, 0.52, 0.10, 1.0]
  );
  drawColoredTriangle(
    [ 0.05, -0.52,    0.28, -0.62,    0.02, -0.70],
    [1.00, 0.52, 0.10, 1.0]
  );
  drawColoredTriangle(
    [-0.07, -0.52,    0.07, -0.52,    0.00, -0.76],
    [1.00, 0.82, 0.18, 1.0]
  );
  drawColoredTriangle(
    [-0.03, -0.52,    0.03, -0.52,    0.00, -0.62],
    [1.00, 0.96, 0.72, 1.0]
  );

  // LETTER A
  const gold = [1.00, 0.78, 0.08, 1.0];

  drawColoredTriangle(
    [-0.13,  0.00,   -0.07,  0.00,   -0.19, -0.38],
    gold
  );
  drawColoredTriangle(
    [-0.07,  0.00,   -0.19, -0.38,   -0.15, -0.38],
    gold
  );

  drawColoredTriangle(
    [-0.13,  0.00,   -0.05, -0.38,   -0.01, -0.38],
    gold
  );
  drawColoredTriangle(
    [-0.13,  0.00,   -0.07,  0.00,   -0.05, -0.38],
    gold
  );

  drawColoredTriangle(
    [-0.17, -0.20,   -0.03, -0.20,   -0.17, -0.26],
    gold
  );
  drawColoredTriangle(
    [-0.03, -0.20,   -0.17, -0.26,   -0.03, -0.26],
    gold
  );

  // LETTER K
  drawColoredTriangle(
    [ 0.02,  0.00,    0.07,  0.00,    0.07, -0.38],
    gold
  );
  drawColoredTriangle(
    [ 0.02,  0.00,    0.02, -0.38,    0.07, -0.38],
    gold
  );

  drawColoredTriangle(
    [ 0.07, -0.14,    0.07, -0.19,    0.19,  0.00],
    gold
  );
  drawColoredTriangle(
    [ 0.07, -0.19,    0.19,  0.00,    0.19, -0.05],
    gold
  );

  drawColoredTriangle(
    [ 0.07, -0.19,    0.07, -0.24,    0.19, -0.38],
    gold
  );
  drawColoredTriangle(
    [ 0.07, -0.24,    0.19, -0.33,    0.19, -0.38],
    gold
  );
}

function setRandomColor() {
  let r = Math.floor(Math.random() * 101);
  let g = Math.floor(Math.random() * 101);
  let b = Math.floor(Math.random() * 101);

  if (r > 85 && g > 85 && b > 85) {
    r = 20;
    g = 70;
    b = 100;
  }

  g_selectedColor = [r / 100, g / 100, b / 100, 1.0];

  document.getElementById('redSlide').value = r;
  document.getElementById('greenSlide').value = g;
  document.getElementById('blueSlide').value = b;

  updateSliderDisplay('redValue', r);
  updateSliderDisplay('greenValue', g);
  updateSliderDisplay('blueValue', b);

  console.log('Random color set to:', g_selectedColor);
}

function drawPicture() {
  g_showPicture = true;
  g_backgroundColor = [0.05, 0.08, 0.18, 1.0];
  renderAllShapes();
}

function setBackgroundColor() {
  gl.clearColor(
    g_backgroundColor[0],
    g_backgroundColor[1],
    g_backgroundColor[2],
    g_backgroundColor[3]
  );
}

function updateSliderDisplay(id, value) {
  document.getElementById(id).textContent = value;
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    g_showPicture = false;
    g_backgroundColor = [0.0, 0.0, 0.0, 1.0];
    renderAllShapes();
  };

  document.getElementById('drawPictureButton').onclick = function() {
    drawPicture();
  };

  document.getElementById('randomColorButton').onclick = function() {
    setRandomColor();
  };

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triangleButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('redSlide').oninput = function() {
    g_selectedColor[0] = this.value / 100;
    updateSliderDisplay('redValue', this.value);
  };

  document.getElementById('greenSlide').oninput = function() {
    g_selectedColor[1] = this.value / 100;
    updateSliderDisplay('greenValue', this.value);
  };

  document.getElementById('blueSlide').oninput = function() {
    g_selectedColor[2] = this.value / 100;
    updateSliderDisplay('blueValue', this.value);
  };

  document.getElementById('sizeSlide').oninput = function() {
    g_selectedSize = Number(this.value);
    updateSliderDisplay('sizeValue', this.value);
  };

  document.getElementById('segmentSlide').oninput = function() {
    g_selectedSegments = Number(this.value);
    updateSliderDisplay('segmentValue', this.value);
  };
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  let shape;

  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }

  shape.position = [x, y];
  shape.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedColor[3]];
  shape.size = g_selectedSize;

  g_shapesList.push(shape);
  renderAllShapes();
}

function handleMouseMove(ev) {
  if (ev.buttons === 1 && ev.target === canvas) {
    click(ev);
  }
}

function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  setBackgroundColor();
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (g_showPicture) {
    drawRocketScene();
  }

  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = click;
  canvas.onmousemove = handleMouseMove;

  updateSliderDisplay('redValue', 100);
  updateSliderDisplay('greenValue', 100);
  updateSliderDisplay('blueValue', 100);
  updateSliderDisplay('sizeValue', 10);
  updateSliderDisplay('segmentValue', 10);

  setBackgroundColor();
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();