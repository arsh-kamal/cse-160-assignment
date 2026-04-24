class Cube {
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
  
      drawCube();
    }
  }
  
  let g_cubeVertexBuffer = null;
  
  function initCubeBuffer() {
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
  
      // Back face
      -0.5, -0.5, -0.5,
      -0.5,  0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
       0.5, -0.5, -0.5,
  
      // Top face
      -0.5,  0.5, -0.5,
      -0.5,  0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5, -0.5,
       0.5,  0.5,  0.5,
       0.5,  0.5, -0.5,
  
      // Bottom face
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5, -0.5,  0.5,
      -0.5, -0.5, -0.5,
       0.5, -0.5,  0.5,
      -0.5, -0.5,  0.5,
  
      // Right face
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
       0.5,  0.5,  0.5,
       0.5, -0.5, -0.5,
       0.5,  0.5,  0.5,
       0.5, -0.5,  0.5,
  
      // Left face
      -0.5, -0.5, -0.5,
      -0.5, -0.5,  0.5,
      -0.5,  0.5,  0.5,
      -0.5, -0.5, -0.5,
      -0.5,  0.5,  0.5,
      -0.5,  0.5, -0.5,
    ]);
  
    g_cubeVertexBuffer = gl.createBuffer();
  
    if (!g_cubeVertexBuffer) {
      console.log("Failed to create cube buffer");
      return;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }
  
  function drawCube() {
    if (g_cubeVertexBuffer === null) {
      initCubeBuffer();
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }