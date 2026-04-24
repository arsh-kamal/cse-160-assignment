class Cylinder {
    constructor() {
      this.color = [1.0, 0.5, 0.6, 1.0];
      this.matrix = new Matrix4();
    }
  
    render() {
      gl.uniform4f(
        u_FragColor,
        this.color[0],
        this.color[1],
        this.color[2],
        this.color[3]
      );
  
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      drawCylinder();
    }
  }
  
  let g_cylinderVertexBuffer = null;
  let g_cylinderVertexCount = 0;
  
  function initCylinderBuffer() {
    const vertices = [];
    const segments = 24;
    const radius = 0.5;
    const height = 1.0;
  
    for (let i = 0; i < segments; i++) {
      let angle1 = (i * 2 * Math.PI) / segments;
      let angle2 = ((i + 1) * 2 * Math.PI) / segments;
  
      let x1 = Math.cos(angle1) * radius;
      let z1 = Math.sin(angle1) * radius;
      let x2 = Math.cos(angle2) * radius;
      let z2 = Math.sin(angle2) * radius;
  
      let yTop = height / 2;
      let yBottom = -height / 2;
  
      // Side face
      vertices.push(
        x1, yBottom, z1,
        x2, yBottom, z2,
        x2, yTop, z2,
  
        x1, yBottom, z1,
        x2, yTop, z2,
        x1, yTop, z1
      );
  
      // Top face
      vertices.push(
        0, yTop, 0,
        x2, yTop, z2,
        x1, yTop, z1
      );
  
      // Bottom face
      vertices.push(
        0, yBottom, 0,
        x1, yBottom, z1,
        x2, yBottom, z2
      );
    }
  
    g_cylinderVertexCount = vertices.length / 3;
  
    g_cylinderVertexBuffer = gl.createBuffer();
  
    if (!g_cylinderVertexBuffer) {
      console.log("Failed to create cylinder buffer");
      return;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cylinderVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }
  
  function drawCylinder() {
    if (g_cylinderVertexBuffer === null) {
      initCylinderBuffer();
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cylinderVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, g_cylinderVertexCount);
  }