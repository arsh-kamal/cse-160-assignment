let canvas;
let ctx;

function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  ctx = canvas.getContext('2d');
  clearCanvas();

  let v1 = new Vector3([2.25, 2.25, 0]);
  let v2 = new Vector3([1.0, 1.0, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function clearCanvas() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2);
  ctx.lineTo(
    canvas.width / 2 + v.elements[0] * 20,
    canvas.height / 2 - v.elements[1] * 20
  );
  ctx.stroke();
}

function handleDrawEvent() {
  clearCanvas();

  let x1 = parseFloat(document.getElementById('v1x').value);
  let y1 = parseFloat(document.getElementById('v1y').value);
  let x2 = parseFloat(document.getElementById('v2x').value);
  let y2 = parseFloat(document.getElementById('v2y').value);

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();
  let cosAlpha = dot / (mag1 * mag2);
  let angleRadians = Math.acos(cosAlpha);
  let angleDegrees = angleRadians * 180 / Math.PI;
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let area = cross.magnitude() / 2;
  return area;
}

function handleDrawOperationEvent() {
  clearCanvas();

  let x1 = parseFloat(document.getElementById('v1x').value);
  let y1 = parseFloat(document.getElementById('v1y').value);
  let x2 = parseFloat(document.getElementById('v2x').value);
  let y2 = parseFloat(document.getElementById('v2y').value);
  let op = document.getElementById('operation').value;
  let scalar = parseFloat(document.getElementById('scalar').value);

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');

  if (op === 'add') {
    let v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (op === 'sub') {
    let v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (op === 'mul') {
    let v3 = new Vector3([x1, y1, 0]);
    let v4 = new Vector3([x2, y2, 0]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'div') {
    let v3 = new Vector3([x1, y1, 0]);
    let v4 = new Vector3([x2, y2, 0]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'magnitude') {
    console.log('Magnitude v1:', v1.magnitude());
    console.log('Magnitude v2:', v2.magnitude());
  } else if (op === 'normalize') {
    let v3 = new Vector3([x1, y1, 0]);
    let v4 = new Vector3([x2, y2, 0]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'angle') {
    console.log('Angle between:', angleBetween(v1, v2));
  } else if (op === 'area') {
    console.log('Area of the triangle:', areaTriangle(v1, v2));
  }
}