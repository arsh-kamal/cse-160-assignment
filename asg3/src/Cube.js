class Cube {
    constructor() {
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
      this.textureNum = -1;
    }
  
    render() {
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      gl.uniform4f(
        u_FragColor,
        this.color[0],
        this.color[1],
        this.color[2],
        this.color[3]
      );
  
      gl.uniform1i(u_TextureNum, this.textureNum);
  
      drawCube();
    }
  }
  
  function drawCube() {
    const verticesUV = new Float32Array([
      // Front
      0,0,1, 0,0,   1,0,1, 1,0,   1,1,1, 1,1,
      0,0,1, 0,0,   1,1,1, 1,1,   0,1,1, 0,1,
  
      // Back
      1,0,0, 0,0,   0,0,0, 1,0,   0,1,0, 1,1,
      1,0,0, 0,0,   0,1,0, 1,1,   1,1,0, 0,1,
  
      // Top
      0,1,1, 0,0,   1,1,1, 1,0,   1,1,0, 1,1,
      0,1,1, 0,0,   1,1,0, 1,1,   0,1,0, 0,1,
  
      // Bottom
      0,0,0, 0,0,   1,0,0, 1,0,   1,0,1, 1,1,
      0,0,0, 0,0,   1,0,1, 1,1,   0,0,1, 0,1,
  
      // Right
      1,0,1, 0,0,   1,0,0, 1,0,   1,1,0, 1,1,
      1,0,1, 0,0,   1,1,0, 1,1,   1,1,1, 0,1,
  
      // Left
      0,0,0, 0,0,   0,0,1, 1,0,   0,1,1, 1,1,
      0,0,0, 0,0,   0,1,1, 1,1,   0,1,0, 0,1
    ]);
  
    if (g_cubeBuffer === null) {
      g_cubeBuffer = gl.createBuffer();
  
      if (!g_cubeBuffer) {
        console.log("Failed to create cube buffer.");
        return;
      }
  
      gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesUV, gl.STATIC_DRAW);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    }
  
    const FSIZE = verticesUV.BYTES_PER_ELEMENT;
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);
  
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }