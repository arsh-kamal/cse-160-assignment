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
  let n = 3;

  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
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

function drawPicture() {
  renderAllShapes();

  // Simple starter picture: house + roof + sun
  drawColoredTriangle([-0.5, -0.2,  0.0, -0.2, -0.5,  0.3], [0.7, 0.4, 0.2, 1.0]);
  drawColoredTriangle([ 0.0, -0.2,  0.0,  0.3, -0.5,  0.3], [0.7, 0.4, 0.2, 1.0]);

  drawColoredTriangle([-0.55, 0.3,  0.05, 0.3, -0.25, 0.6], [0.8, 0.0, 0.0, 1.0]);

  drawColoredTriangle([-0.3, -0.2, -0.15, -0.2, -0.3, 0.05], [0.4, 0.2, 0.1, 1.0]);
  drawColoredTriangle([-0.15, -0.2, -0.15, 0.05, -0.3, 0.05], [0.4, 0.2, 0.1, 1.0]);

  drawColoredTriangle([-0.1, 0.05,  0.0, 0.05, -0.1, 0.15], [0.2, 0.7, 1.0, 1.0]);
  drawColoredTriangle([ 0.0, 0.05,  0.0, 0.15, -0.1, 0.15], [0.2, 0.7, 1.0, 1.0]);

  drawColoredTriangle([0.45, 0.55, 0.62, 0.55, 0.45, 0.72], [1.0, 0.9, 0.0, 1.0]);
  drawColoredTriangle([0.62, 0.55, 0.62, 0.72, 0.45, 0.72], [1.0, 0.9, 0.0, 1.0]);
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
    renderAllShapes();
  };

  document.getElementById('drawPictureButton').onclick = function() {
    drawPicture();
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
  };

  document.getElementById('greenSlide').oninput = function() {
    g_selectedColor[1] = this.value / 100;
  };

  document.getElementById('blueSlide').oninput = function() {
    g_selectedColor[2] = this.value / 100;
  };

  document.getElementById('sizeSlide').oninput = function() {
    g_selectedSize = Number(this.value);
  };

  document.getElementById('segmentSlide').oninput = function() {
    g_selectedSegments = Number(this.value);
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
  if (ev.buttons === 1) {
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
  gl.clear(gl.COLOR_BUFFER_BIT);

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

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();