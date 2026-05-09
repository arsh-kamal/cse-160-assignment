class Camera {
    constructor(canvas) {
      this.canvas = canvas;
  
      this.startEye = [-14.5, 1.6, -14.5];
      this.startYaw = 45;
      this.startPitch = 0;
  
      this.fov = 70;
  
      this.eye = new Vector3(this.startEye);
      this.at = new Vector3([-13.5, 1.6, -13.5]);
      this.up = new Vector3([0, 1, 0]);
  
      this.playerHeight = 1.6;
      this.currentGroundHeight = 0;
  
      this.yaw = this.startYaw;
      this.pitch = this.startPitch;
  
      this.jumpHeight = 0;
      this.isJumping = false;
      this.jumpStartTime = 0;
  
      this.speed = 0.35;
      this.alpha = 5;
  
      this.viewMatrix = new Matrix4();
      this.projectionMatrix = new Matrix4();
  
      this.updateProjectionMatrix();
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    reset() {
      this.fov = 70;
      this.eye = new Vector3(this.startEye);
      this.currentGroundHeight = 0;
      this.yaw = this.startYaw;
      this.pitch = this.startPitch;
      this.jumpHeight = 0;
      this.isJumping = false;
      this.jumpStartTime = 0;
  
      this.updateProjectionMatrix();
      this.updateAtFromAngles();
      this.updateEyeHeight();
      this.updateViewMatrix();
    }
  
    updateProjectionMatrix() {
      this.projectionMatrix.setPerspective(
        this.fov,
        this.canvas.width / this.canvas.height,
        0.1,
        1000
      );
    }
  
    updateAtFromAngles() {
      let yawRad = (this.yaw * Math.PI) / 180;
      let pitchRad = (this.pitch * Math.PI) / 180;
  
      let fx = Math.cos(pitchRad) * Math.cos(yawRad);
      let fy = Math.sin(pitchRad);
      let fz = Math.cos(pitchRad) * Math.sin(yawRad);
  
      this.at = new Vector3([
        this.eye.elements[0] + fx,
        this.eye.elements[1] + fy,
        this.eye.elements[2] + fz
      ]);
    }
  
    updateViewMatrix() {
      this.viewMatrix.setLookAt(
        this.eye.elements[0],
        this.eye.elements[1],
        this.eye.elements[2],
  
        this.at.elements[0],
        this.at.elements[1],
        this.at.elements[2],
  
        this.up.elements[0],
        this.up.elements[1],
        this.up.elements[2]
      );
    }
  
    getForwardVector() {
      let fx = this.at.elements[0] - this.eye.elements[0];
      let fz = this.at.elements[2] - this.eye.elements[2];
  
      let length = Math.sqrt(fx * fx + fz * fz);
  
      if (length === 0) {
        return [0, 0, -1];
      }
  
      return [fx / length, 0, fz / length];
    }
  
    getLookVector3D() {
      let fx = this.at.elements[0] - this.eye.elements[0];
      let fy = this.at.elements[1] - this.eye.elements[1];
      let fz = this.at.elements[2] - this.eye.elements[2];
  
      let length = Math.sqrt(fx * fx + fy * fy + fz * fz);
  
      if (length === 0) {
        return [1, 0, 0];
      }
  
      return [fx / length, fy / length, fz / length];
    }
  
    getMapPosition(x, z) {
      return {
        x: Math.floor(x + 16),
        z: Math.floor(z + 16)
      };
    }
  
    getHeightAtWorldPosition(x, z) {
      let pos = this.getMapPosition(x, z);
  
      if (pos.x < 0 || pos.x >= 32 || pos.z < 0 || pos.z >= 32) {
        return 999;
      }
  
      return g_map[pos.z][pos.x];
    }
  
    updateEyeHeight() {
      let targetY = this.currentGroundHeight + this.playerHeight + this.jumpHeight;
      this.eye.elements[1] = targetY;
  
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    canMoveTo(newX, newZ) {
      let targetHeight = this.getHeightAtWorldPosition(newX, newZ);
  
      if (targetHeight === 999) {
        return false;
      }
  
      // Walking is allowed on same level or going down.
      if (targetHeight <= this.currentGroundHeight) {
        return true;
      }
  
      // If jumping, allow climbing up one level.
      if (this.isJumping && targetHeight <= this.currentGroundHeight + 1) {
        return true;
      }
  
      return false;
    }
  
    tryMove(dx, dz) {
      let newEyeX = this.eye.elements[0] + dx;
      let newEyeZ = this.eye.elements[2] + dz;
  
      if (this.canMoveTo(newEyeX, newEyeZ)) {
        this.eye.elements[0] = newEyeX;
        this.eye.elements[2] = newEyeZ;
  
        this.currentGroundHeight = this.getHeightAtWorldPosition(
          this.eye.elements[0],
          this.eye.elements[2]
        );
  
        this.updateEyeHeight();
      }
  
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    moveForward() {
      let f = this.getForwardVector();
      this.tryMove(f[0] * this.speed, f[2] * this.speed);
    }
  
    moveBackwards() {
      let f = this.getForwardVector();
      this.tryMove(-f[0] * this.speed, -f[2] * this.speed);
    }
  
    moveLeft() {
      let f = this.getForwardVector();
      this.tryMove(f[2] * this.speed, -f[0] * this.speed);
    }
  
    moveRight() {
      let f = this.getForwardVector();
      this.tryMove(-f[2] * this.speed, f[0] * this.speed);
    }
  
    panLeft(degrees = this.alpha) {
      this.yaw -= degrees;
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    panRight(degrees = this.alpha) {
      this.yaw += degrees;
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    lookUp(degrees = 3) {
      this.pitch += degrees;
  
      if (this.pitch > 65) {
        this.pitch = 65;
      }
  
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    lookDown(degrees = 3) {
      this.pitch -= degrees;
  
      if (this.pitch < -65) {
        this.pitch = -65;
      }
  
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    mouseLook(dx, dy) {
      let sensitivity = 0.25;
  
      this.yaw += dx * sensitivity;
      this.pitch -= dy * sensitivity;
  
      if (this.pitch > 65) {
        this.pitch = 65;
      }
  
      if (this.pitch < -65) {
        this.pitch = -65;
      }
  
      this.updateAtFromAngles();
      this.updateViewMatrix();
    }
  
    zoomIn() {
      this.fov -= 5;
  
      if (this.fov < 35) {
        this.fov = 35;
      }
  
      this.updateProjectionMatrix();
    }
  
    zoomOut() {
      this.fov += 5;
  
      if (this.fov > 100) {
        this.fov = 100;
      }
  
      this.updateProjectionMatrix();
    }
  
    jump() {
      if (!this.isJumping) {
        this.isJumping = true;
        this.jumpStartTime = performance.now() / 1000;
      }
    }
  
    jumpForward() {
      this.jump();
  
      let f = this.getForwardVector();
  
      let checkX = this.eye.elements[0] + f[0] * 1.0;
      let checkZ = this.eye.elements[2] + f[2] * 1.0;
  
      let targetHeight = this.getHeightAtWorldPosition(checkX, checkZ);
  
      if (
        targetHeight !== 999 &&
        targetHeight > this.currentGroundHeight &&
        targetHeight <= this.currentGroundHeight + 1
      ) {
        this.eye.elements[0] = checkX;
        this.eye.elements[2] = checkZ;
  
        this.currentGroundHeight = targetHeight;
  
        this.updateEyeHeight();
        this.updateAtFromAngles();
        this.updateViewMatrix();
      }
    }
  
    updateJump() {
      if (!this.isJumping) {
        this.jumpHeight = 0;
        this.updateEyeHeight();
        return;
      }
  
      let now = performance.now() / 1000;
      let t = now - this.jumpStartTime;
  
      let jumpDuration = 0.8;
  
      if (t >= jumpDuration) {
        this.isJumping = false;
        this.jumpHeight = 0;
      } else {
        this.jumpHeight = Math.sin((t / jumpDuration) * Math.PI) * 1.2;
      }
  
      this.updateEyeHeight();
    }
  }