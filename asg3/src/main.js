const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_TextureNum;

  void main() {
    if (u_TextureNum == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_TextureNum == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_TextureNum == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_TextureNum == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
  }
`;

let canvas;
let gl;

let a_Position;
let a_UV;

let u_FragColor;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_TextureNum;

let g_camera;
let g_cubeBuffer = null;

let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

let g_startTime = performance.now() / 1000;
let g_seconds = 0;

let g_lastFrameTime = performance.now();
let g_fps = 0;

let g_selectedCell = null;
let g_goalReached = false;

let g_storyMode = false;
let g_introMode = false;
let g_endCinematic = false;
let g_storyStartTime = 0;

let g_flowersVisible = false;
let g_butterfliesVisible = false;
let g_animalsVisible = false;

let g_map = createBaseMap();

function createBaseMap() {
  let map = [];

  for (let z = 0; z < 32; z++) {
    let row = [];

    for (let x = 0; x < 32; x++) {
      if (x === 0 || x === 31 || z === 0 || z === 31) {
        row.push(2);
      } else {
        row.push(0);
      }
    }

    map.push(row);
  }

  // Main brown maze/world walls
  for (let x = 2; x < 30; x++) {
    if (x !== 5 && x !== 14 && x !== 23) map[4][x] = 1;
    if (x !== 8 && x !== 17 && x !== 26) map[7][x] = 2;
    if (x !== 4 && x !== 13 && x !== 22) map[10][x] = 1;
    if (x !== 6 && x !== 15 && x !== 24) map[23][x] = 2;
    if (x !== 10 && x !== 20 && x !== 28) map[27][x] = 1;
  }

  for (let z = 2; z < 30; z++) {
    if (z !== 5 && z !== 12 && z !== 21) map[z][5] = 1;
    if (z !== 8 && z !== 16 && z !== 25) map[z][9] = 2;
    if (z !== 6 && z !== 15 && z !== 24) map[z][22] = 2;
    if (z !== 10 && z !== 20 && z !== 28) map[z][27] = 1;
  }

  // Extra brown block structures so the map does not feel empty
  addBrownStructure(map, 2, 2, 6, 5, 2);
  addBrownStructure(map, 24, 2, 28, 5, 2);
  addBrownStructure(map, 2, 24, 6, 28, 1);
  addBrownStructure(map, 24, 24, 28, 28, 2);

  addBrownStructure(map, 2, 12, 6, 15, 2);
  addBrownStructure(map, 25, 12, 29, 15, 2);

  addBrownLine(map, 12, 2, 12, 6, 1);
  addBrownLine(map, 16, 2, 16, 6, 1);
  addBrownLine(map, 19, 2, 19, 7, 2);

  addBrownLine(map, 12, 25, 12, 29, 1);
  addBrownLine(map, 17, 25, 17, 29, 2);
  addBrownLine(map, 20, 24, 20, 29, 1);

  // Clear open zone around tower and stairs
  for (let z = 10; z <= 26; z++) {
    for (let x = 12; x <= 19; x++) {
      map[z][x] = 0;
    }
  }

  // Tower outer wall collision.
  // Tower is x 13-18, z 13-18, height 8.
  for (let z = 13; z <= 18; z++) {
    for (let x = 13; x <= 18; x++) {
      let isWall = x === 13 || x === 18 || z === 13 || z === 18;

      if (isWall) {
        map[z][x] = 8;
      }
    }
  }

  // Entrance opening at front/south side
  map[18][15] = 0;
  map[18][16] = 0;

  // SIMPLE STRAIGHT BROWN STAIRS.
  // Start outside, then go straight into the tower.
  map[26][15] = 1;
  map[25][15] = 1;
  map[24][15] = 2;
  map[23][15] = 2;
  map[22][15] = 3;
  map[21][15] = 3;
  map[20][15] = 4;
  map[19][15] = 4;
  map[18][15] = 5; // entrance stair
  map[17][15] = 6; // inside tower
  map[16][15] = 7; // second-top stair / story trigger
  map[15][15] = 8; // top stair / goal platform

  return map;
}

function addBrownStructure(map, x1, z1, x2, z2, height) {
  for (let z = z1; z <= z2; z++) {
    for (let x = x1; x <= x2; x++) {
      let isBorder = x === x1 || x === x2 || z === z1 || z === z2;

      if (isBorder) {
        map[z][x] = height;
      }
    }
  }
}

function addBrownLine(map, x1, z1, x2, z2, height) {
  if (x1 === x2) {
    for (let z = z1; z <= z2; z++) {
      map[z][x1] = height;
    }
  } else if (z1 === z2) {
    for (let x = x1; x <= x2; x++) {
      map[z1][x] = height;
    }
  }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();

  g_camera = new Camera(canvas);

  setupKeyboardControls();
  setupMouseControls();

  gl.clearColor(0.45, 0.65, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  startIntroStory();

  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context.");
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");

  u_TextureNum = gl.getUniformLocation(gl.program, "u_TextureNum");

  let identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function tick() {
  let now = performance.now();

  g_fps = Math.round(1000 / (now - g_lastFrameTime));
  g_lastFrameTime = now;

  let fpsDisplay = document.getElementById("fps");
  if (fpsDisplay) {
    fpsDisplay.innerText = "FPS: " + g_fps;
  }

  g_seconds = performance.now() / 1000 - g_startTime;

  if (g_camera) {
    g_camera.updateJump();

    if (g_endCinematic) {
      updateEndCinematic();
    } else {
      checkGoalReached();
    }
  }

  renderScene();

  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  drawSky();
  drawGround();
  drawWorld();
  drawTower();

  if (g_flowersVisible) drawFlowers();
  if (g_butterfliesVisible) drawButterflies();
  if (g_animalsVisible) drawAnimals();

  drawSelectedMarker();
}

function drawGround() {
  let ground = new Cube();

  ground.color = [0.3, 0.8, 0.25, 1.0];
  ground.textureNum = 1;

  ground.matrix.translate(-16, -0.05, -16);
  ground.matrix.scale(32, 0.1, 32);

  ground.render();
}

function drawSky() {
  let sky = new Cube();

  sky.color = [0.45, 0.65, 1.0, 1.0];
  sky.textureNum = -1;

  sky.matrix.translate(-500, -500, -500);
  sky.matrix.scale(1000, 1000, 1000);

  sky.render();
}

function isTowerZone(x, z) {
  return x >= 13 && x <= 18 && z >= 13 && z <= 18;
}

function isTowerStairCell(x, z) {
  return x === 15 && z >= 15 && z <= 26;
}

function drawWorld() {
  for (let z = 0; z < 32; z++) {
    for (let x = 0; x < 32; x++) {
      if (isTowerZone(x, z) || isTowerStairCell(x, z)) {
        continue;
      }

      let height = g_map[z][x];

      if (height > 0) {
        for (let y = 0; y < height; y++) {
          let block = new Cube();

          // Normal world blocks are brown/dirt.
          block.color = [0.55, 0.36, 0.20, 1.0];
          block.textureNum = 0;

          block.matrix.translate(x - 16, y, z - 16);
          block.render();
        }
      }
    }
  }
}

function drawTower() {
  // Tall gray tower walls with entrance.
  // No clock face, no roof, no extra gray block under glow.
  for (let z = 13; z <= 18; z++) {
    for (let x = 13; x <= 18; x++) {
      let isWall = x === 13 || x === 18 || z === 13 || z === 18;
      let isEntrance = z === 18 && (x === 15 || x === 16);

      if (isWall && !isEntrance) {
        for (let y = 0; y < 8; y++) {
          let wall = new Cube();

          wall.color = [0.62, 0.62, 0.62, 1.0];
          wall.textureNum = 2;

          wall.matrix.translate(x - 16, y, z - 16);
          wall.render();
        }
      }
    }
  }

  // Straight brown stairs, easy access.
  drawBrownStair(15, 26, 1);
  drawBrownStair(15, 25, 1);
  drawBrownStair(15, 24, 2);
  drawBrownStair(15, 23, 2);
  drawBrownStair(15, 22, 3);
  drawBrownStair(15, 21, 3);
  drawBrownStair(15, 20, 4);
  drawBrownStair(15, 19, 4);
  drawBrownStair(15, 18, 5);
  drawBrownStair(15, 17, 6);
  drawBrownStair(15, 16, 7);
  drawBrownStair(15, 15, 8);

  // Glowing block directly above final brown stair.
  let pulse = 0.5 + 0.5 * Math.sin(g_seconds * 5);

  let glow = new Cube();
  glow.color = [
    1.0,
    0.15 + pulse * 0.75,
    0.02,
    1.0
  ];
  glow.textureNum = -1;

  glow.matrix.translate(-0.75, 8.35 + pulse * 0.25, -0.75);
  glow.matrix.rotate(g_seconds * 120, 0, 1, 0);
  glow.matrix.scale(1.5, 1.5, 1.5);

  glow.render();
}

function drawBrownStair(x, z, height) {
  for (let y = 0; y < height; y++) {
    let step = new Cube();

    step.color = [0.55, 0.36, 0.20, 1.0];
    step.textureNum = 0;

    step.matrix.translate(x - 16, y, z - 16);
    step.render();
  }
}

function drawSelectedMarker() {
  if (!g_selectedCell) return;

  let height = g_map[g_selectedCell.z][g_selectedCell.x];

  let marker = new Cube();
  marker.color = [1.0, 1.0, 0.0, 1.0];
  marker.textureNum = -1;

  marker.matrix.translate(
    g_selectedCell.x - 16 - 0.03,
    height + 0.02,
    g_selectedCell.z - 16 - 0.03
  );
  marker.matrix.scale(1.06, 0.08, 1.06);

  marker.render();
}

function setupKeyboardControls() {
  document.addEventListener("keydown", function(event) {
    if (!g_camera) return;

    const key = event.key.toLowerCase();

    if (key === "m") {
      exitStoryMode();
      renderScene();
      return;
    }

    if (g_endCinematic) {
      if (key === "c") {
        resetCameraPosition();
      }
      return;
    }

    if (key === "w") {
      g_camera.moveForward();
    } else if (key === "s") {
      g_camera.moveBackwards();
    } else if (key === "a") {
      g_camera.moveLeft();
    } else if (key === "d") {
      g_camera.moveRight();
    } else if (key === "q") {
      g_camera.panLeft();
    } else if (key === "e") {
      g_camera.panRight();
    } else if (key === "z") {
      g_camera.zoomIn();
    } else if (key === "x") {
      g_camera.zoomOut();
    } else if (key === "f") {
      addBlockToSelectedCell();
    } else if (key === "r") {
      removeBlockFromSelectedCell();
    } else if (key === "c") {
      resetCameraPosition();
    } else if (key === "arrowup") {
      g_camera.lookUp();
    } else if (key === "arrowdown") {
      g_camera.lookDown();
    } else if (event.code === "Space") {
      event.preventDefault();

      // Space works anytime. Use Space + W while facing the stair.
      g_camera.jumpForward();
    }

    renderScene();
  });
}

function setupMouseControls() {
  let mouseDownX = 0;
  let mouseDownY = 0;
  let didDrag = false;

  canvas.addEventListener("mousedown", function(event) {
    if (g_endCinematic) return;

    g_isDragging = true;
    didDrag = false;

    mouseDownX = event.clientX;
    mouseDownY = event.clientY;

    g_lastMouseX = event.clientX;
    g_lastMouseY = event.clientY;
  });

  canvas.addEventListener("mouseup", function(event) {
    if (g_endCinematic) return;

    g_isDragging = false;

    let totalDx = Math.abs(event.clientX - mouseDownX);
    let totalDy = Math.abs(event.clientY - mouseDownY);

    if (totalDx < 5 && totalDy < 5 && !didDrag) {
      let clickedCell = getCellFromMouseClick(event.clientX, event.clientY);

      if (!clickedCell) {
        g_selectedCell = null;
        updateStatusText("Nothing selected.");
        renderScene();
        return;
      }

      if (
        g_selectedCell &&
        g_selectedCell.x === clickedCell.x &&
        g_selectedCell.z === clickedCell.z
      ) {
        g_selectedCell = null;
        updateStatusText("Unselected block.");
      } else {
        g_selectedCell = clickedCell;

        let height = g_map[g_selectedCell.z][g_selectedCell.x];

        if (height > 0) {
          updateStatusText("Selected block. F = add, R = remove. Space jumps anytime.");
        } else {
          updateStatusText("Selected ground. F = add a block.");
        }
      }

      renderScene();
    }
  });

  canvas.addEventListener("mouseleave", function() {
    g_isDragging = false;
  });

  canvas.addEventListener("mousemove", function(event) {
    if (g_endCinematic) return;
    if (!g_isDragging || !g_camera) return;

    let dx = event.clientX - g_lastMouseX;
    let dy = event.clientY - g_lastMouseY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      didDrag = true;
    }

    g_lastMouseX = event.clientX;
    g_lastMouseY = event.clientY;

    g_camera.mouseLook(dx, dy);
  });
}

function getCellFromMouseClick(mouseX, mouseY) {
  let rect = canvas.getBoundingClientRect();

  let x = ((mouseX - rect.left) / rect.width) * 2 - 1;
  let y = 1 - ((mouseY - rect.top) / rect.height) * 2;

  let viewProjectionMatrix = new Matrix4(g_camera.projectionMatrix);
  viewProjectionMatrix.multiply(g_camera.viewMatrix);

  let inverseViewProjectionMatrix = new Matrix4();
  inverseViewProjectionMatrix.setInverseOf(viewProjectionMatrix);

  let nearPoint = inverseViewProjectionMatrix.multiplyVector4(
    new Vector4([x, y, -1, 1])
  );

  let farPoint = inverseViewProjectionMatrix.multiplyVector4(
    new Vector4([x, y, 1, 1])
  );

  nearPoint.elements[0] /= nearPoint.elements[3];
  nearPoint.elements[1] /= nearPoint.elements[3];
  nearPoint.elements[2] /= nearPoint.elements[3];

  farPoint.elements[0] /= farPoint.elements[3];
  farPoint.elements[1] /= farPoint.elements[3];
  farPoint.elements[2] /= farPoint.elements[3];

  let rayX = farPoint.elements[0] - nearPoint.elements[0];
  let rayY = farPoint.elements[1] - nearPoint.elements[1];
  let rayZ = farPoint.elements[2] - nearPoint.elements[2];

  let length = Math.sqrt(rayX * rayX + rayY * rayY + rayZ * rayZ);

  rayX /= length;
  rayY /= length;
  rayZ /= length;

  let selectedGroundCell = null;

  for (let t = 0.2; t <= 30; t += 0.05) {
    let worldX = nearPoint.elements[0] + rayX * t;
    let worldY = nearPoint.elements[1] + rayY * t;
    let worldZ = nearPoint.elements[2] + rayZ * t;

    let mapX = Math.floor(worldX + 16);
    let mapZ = Math.floor(worldZ + 16);

    if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) continue;

    let height = g_map[mapZ][mapX];

    if (height > 0 && worldY >= 0 && worldY <= height + 0.3) {
      return {
        x: mapX,
        z: mapZ
      };
    }

    if (height === 0 && worldY <= 0.1) {
      selectedGroundCell = {
        x: mapX,
        z: mapZ
      };
    }
  }

  return selectedGroundCell;
}

function addBlockToSelectedCell() {
  if (!g_selectedCell) {
    updateStatusText("Click ground or block first.");
    return;
  }

  let x = g_selectedCell.x;
  let z = g_selectedCell.z;

  if (isTowerZone(x, z) || isTowerStairCell(x, z)) {
    updateStatusText("Tower and story stairs cannot be edited.");
    return;
  }

  if (g_map[z][x] < 6) {
    g_map[z][x]++;
    updateStatusText("Added block.");
  } else {
    updateStatusText("Max height reached.");
  }
}

function removeBlockFromSelectedCell() {
  if (!g_selectedCell) {
    updateStatusText("Click a block first.");
    return;
  }

  let x = g_selectedCell.x;
  let z = g_selectedCell.z;

  if (isTowerZone(x, z) || isTowerStairCell(x, z)) {
    updateStatusText("Tower and story stairs cannot be removed.");
    return;
  }

  if (g_map[z][x] > 0) {
    g_map[z][x]--;
    updateStatusText("Removed block.");
  } else {
    updateStatusText("Selected cell is empty.");
  }
}

function resetCameraPosition() {
  g_map = createBaseMap();

  g_camera.reset();

  g_selectedCell = null;
  g_goalReached = false;

  g_storyMode = false;
  g_introMode = false;
  g_endCinematic = false;

  g_flowersVisible = false;
  g_butterfliesVisible = false;
  g_animalsVisible = false;

  hideMovieOverlay();

  let playAgain = document.getElementById("playAgain");
  if (playAgain) {
    playAgain.style.display = "none";
  }

  updateStatusText("Reset complete. Follow the brown stairs to the glowing block.");
  renderScene();
}

function checkGoalReached() {
  // 2nd top stair is map[16][15]
  // world x = -0.5, world z = 0.5, height = 7
  let goalX = -0.5;
  let goalZ = 0.5;

  let dx = g_camera.eye.elements[0] - goalX;
  let dz = g_camera.eye.elements[2] - goalZ;

  let distance = Math.sqrt(dx * dx + dz * dz);

  if (
    distance < 1.6 &&
    g_camera.currentGroundHeight >= 7 &&
    !g_goalReached
  ) {
    g_goalReached = true;
    startEndStoryMode();
  }
}

function updateStatusText(message) {
  let status = document.getElementById("status");

  if (status) {
    status.innerText = message;
  }
}

function initTextures() {
  let dirtTexture = createCheckerTexture(
    [135, 100, 70],
    [90, 65, 45]
  );

  let grassTexture = createCheckerTexture(
    [70, 170, 50],
    [45, 125, 35]
  );

  let stoneTexture = createCheckerTexture(
    [130, 130, 135],
    [80, 80, 85]
  );

  loadTextureToUnit(dirtTexture, 0, u_Sampler0);
  loadTextureToUnit(grassTexture, 1, u_Sampler1);
  loadTextureToUnit(stoneTexture, 2, u_Sampler2);
}

function createCheckerTexture(colorA, colorB) {
  let size = 64;
  let textureCanvas = document.createElement("canvas");

  textureCanvas.width = size;
  textureCanvas.height = size;

  let ctx = textureCanvas.getContext("2d");

  let blockSize = 8;

  for (let y = 0; y < size; y += blockSize) {
    for (let x = 0; x < size; x += blockSize) {
      let useColorA = ((x / blockSize) + (y / blockSize)) % 2 === 0;
      let c = useColorA ? colorA : colorB;

      ctx.fillStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }

  return textureCanvas;
}

function loadTextureToUnit(image, unit, sampler) {
  let texture = gl.createTexture();

  if (!texture) {
    console.log("Failed to create texture.");
    return;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (unit === 0) {
    gl.activeTexture(gl.TEXTURE0);
  } else if (unit === 1) {
    gl.activeTexture(gl.TEXTURE1);
  } else if (unit === 2) {
    gl.activeTexture(gl.TEXTURE2);
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(sampler, unit);
}

function startIntroStory() {
  g_introMode = true;
  g_storyMode = true;

  showMovieOverlay(
    "🧙‍♂️",
    "Welcome, explorer! Follow the brown stairs into the stone tower. Reach the glowing block at the top."
  );

  setTimeout(function() {
    if (g_introMode && !g_endCinematic) {
      hideMovieOverlay();
      g_introMode = false;
      g_storyMode = false;
      updateStatusText("Follow the brown stairs. Use Space + W to climb.");
    }
  }, 5000);
}

function startEndStoryMode() {
  g_storyMode = true;
  g_endCinematic = true;
  g_storyStartTime = performance.now() / 1000;

  g_flowersVisible = true;
  g_butterfliesVisible = true;
  g_animalsVisible = true;

  showMovieOverlay(
    "🧚‍♀️",
    "Congratulations! You reached the glowing block at the top. The world is celebrating!"
  );

  playMagicSound();

  updateStatusText("Story mode started. Enjoy the cinematic tour!");
}

function updateEndCinematic() {
  let now = performance.now() / 1000;
  let t = now - g_storyStartTime;

  let radius = 22;
  let angle = t * 0.35;

  let camX = Math.cos(angle) * radius;
  let camZ = Math.sin(angle) * radius;
  let camY = 18 + Math.sin(t * 0.8) * 3;

  g_camera.eye = new Vector3([camX, camY, camZ]);
  g_camera.at = new Vector3([0, 3.0, 0]);
  g_camera.fov = 75;

  g_camera.updateProjectionMatrix();
  g_camera.updateViewMatrix();

  if (t > 4 && t < 8) {
    showMovieOverlay(
      "🦋",
      "Butterflies are flying across the sky. The tower is glowing with restored magic!"
    );
  } else if (t >= 8 && t < 12) {
    showMovieOverlay(
      "🌸",
      "Flowers and friendly cube animals have appeared throughout the world."
    );
  } else if (t >= 12 && t < 16) {
    showMovieOverlay(
      "🎉",
      "Your adventure is complete. Press C to play again, or keep exploring."
    );
  }

  if (t >= 16) {
    endCinematicTour();
  }
}

function endCinematicTour() {
  g_endCinematic = false;
  g_storyMode = false;

  showMovieOverlay(
    "🏆",
    "The tour is complete! Press C to play again."
  );

  let playAgain = document.getElementById("playAgain");
  if (playAgain) {
    playAgain.style.display = "block";
  }

  setTimeout(function() {
    if (!g_endCinematic) {
      hideMovieOverlay();
    }
  }, 6000);
}

function exitStoryMode() {
  g_storyMode = false;
  g_introMode = false;
  g_endCinematic = false;

  hideMovieOverlay();

  updateStatusText("Exited story mode.");
}

function showMovieOverlay(face, text) {
  let overlay = document.getElementById("movieOverlay");
  let guideFace = document.getElementById("guideFace");
  let storyText = document.getElementById("storyText");

  if (overlay) {
    overlay.style.display = "block";
  }

  if (guideFace) {
    guideFace.innerText = face;
  }

  if (storyText) {
    storyText.innerText = text;
  }
}

function hideMovieOverlay() {
  let overlay = document.getElementById("movieOverlay");

  if (overlay) {
    overlay.style.display = "none";
  }
}

function playMagicSound() {
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();

  let notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];

  for (let i = 0; i < notes.length; i++) {
    let osc = audioContext.createOscillator();
    let gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(notes[i], audioContext.currentTime + i * 0.18);

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + i * 0.18 + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + i * 0.18 + 0.25
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(audioContext.currentTime + i * 0.18);
    osc.stop(audioContext.currentTime + i * 0.18 + 0.3);
  }
}

function drawFlowers() {
  let flowerPositions = [
    [-12, -10], [-9, -6], [-6, -12], [-4, -4],
    [3, -8], [5, -3], [8, -10], [11, -5],
    [-10, 6], [-6, 8], [2, 7], [7, 9],
    [12, 4], [10, 12]
  ];

  for (let i = 0; i < flowerPositions.length; i++) {
    drawFlower(flowerPositions[i][0], flowerPositions[i][1], i);
  }
}

function drawFlower(x, z, index) {
  let stem = new Cube();
  stem.color = [0.1, 0.7, 0.1, 1.0];
  stem.textureNum = -1;
  stem.matrix.translate(x + 0.45, 0, z + 0.45);
  stem.matrix.scale(0.1, 0.6, 0.1);
  stem.render();

  let pulse = 0.5 + 0.5 * Math.sin(g_seconds * 3 + index);

  let flower = new Cube();
  flower.color = [1.0, 0.3 + pulse * 0.5, 0.8, 1.0];
  flower.textureNum = -1;
  flower.matrix.translate(x + 0.25, 0.6, z + 0.25);
  flower.matrix.scale(0.5, 0.25, 0.5);
  flower.render();
}

function drawButterflies() {
  let butterflyPositions = [
    [-9, 3, -9],
    [-3, 5, -5],
    [4, 4, -8],
    [8, 6, 3],
    [-7, 5, 8],
    [3, 7, 9]
  ];

  for (let i = 0; i < butterflyPositions.length; i++) {
    drawButterfly(
      butterflyPositions[i][0],
      butterflyPositions[i][1],
      butterflyPositions[i][2],
      i
    );
  }
}

function drawButterfly(x, y, z, index) {
  let flap = Math.sin(g_seconds * 8 + index) * 0.25;
  let floatY = Math.sin(g_seconds + index) * 0.5;

  let body = new Cube();
  body.color = [0.1, 0.1, 0.1, 1.0];
  body.textureNum = -1;
  body.matrix.translate(x, y + floatY, z);
  body.matrix.scale(0.15, 0.35, 0.15);
  body.render();

  let leftWing = new Cube();
  leftWing.color = [0.9, 0.2, 1.0, 1.0];
  leftWing.textureNum = -1;
  leftWing.matrix.translate(x - 0.35 - flap, y + floatY, z);
  leftWing.matrix.scale(0.35, 0.25, 0.08);
  leftWing.render();

  let rightWing = new Cube();
  rightWing.color = [0.2, 0.8, 1.0, 1.0];
  rightWing.textureNum = -1;
  rightWing.matrix.translate(x + 0.2 + flap, y + floatY, z);
  rightWing.matrix.scale(0.35, 0.25, 0.08);
  rightWing.render();
}

function drawAnimals() {
  drawCubeAnimal(-8, 0, 4, [1.0, 0.7, 0.7, 1.0]);
  drawCubeAnimal(6, 0, 6, [0.7, 0.7, 1.0, 1.0]);
  drawCubeAnimal(10, 0, -7, [1.0, 0.9, 0.5, 1.0]);
}

function drawCubeAnimal(x, y, z, color) {
  let body = new Cube();
  body.color = color;
  body.textureNum = -1;
  body.matrix.translate(x, y + 0.3, z);
  body.matrix.scale(0.9, 0.5, 0.5);
  body.render();

  let head = new Cube();
  head.color = color;
  head.textureNum = -1;
  head.matrix.translate(x + 0.65, y + 0.55, z + 0.1);
  head.matrix.scale(0.45, 0.45, 0.45);
  head.render();

  let leg1 = new Cube();
  leg1.color = [0.15, 0.15, 0.15, 1.0];
  leg1.textureNum = -1;
  leg1.matrix.translate(x + 0.1, y, z + 0.05);
  leg1.matrix.scale(0.15, 0.35, 0.15);
  leg1.render();

  let leg2 = new Cube();
  leg2.color = [0.15, 0.15, 0.15, 1.0];
  leg2.textureNum = -1;
  leg2.matrix.translate(x + 0.55, y, z + 0.05);
  leg2.matrix.scale(0.15, 0.35, 0.15);
  leg2.render();
}