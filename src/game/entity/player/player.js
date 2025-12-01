import Matter from "matter-js";
import { Entity } from "../entity.js";

export class Player extends Entity {
  constructor(config, world) {
    // Add player-specific defaults to config
    const playerConfig = {
      shape: "rectangle",
      width: 30,
      height: 75,
      friction: 0.01,
      density: 0.03,
      chamfer: { radius: 15 }, // Rounded corners for pill shape
      ...config,
      label: "player",
      moveForce: config.moveForce || 0.03,
      jumpForce: config.jumpForce || 1.2,
      maxSpeed: config.maxSpeed || 8,
    };

    // Call parent constructor
    super(playerConfig, world);

    // Store player-specific properties
    this.moveForce = playerConfig.moveForce;
    this.jumpForce = playerConfig.jumpForce;
    this.maxSpeed = playerConfig.maxSpeed;

    // Jump state tracking
    this.canJump = true; // Can player jump right now
    this.wasJumpPressed = false; // Was jump pressed last frame

    // Prevent rotation by setting infinite inertia
    const { Body } = Matter;
    Body.setInertia(this.body, Infinity);
  }

  update() {
    // Call parent update for texture loading
    if (super.update) {
      super.update();
    }

    // Check if player is destroyed or has no health
    if (this.isDestroyed) return;

    if (this.health <= 0) {
      this.destroy();
      return;
    }
  }

  updateInput(input) {
    // Check if player is destroyed or has no health
    if (this.isDestroyed) return;

    if (this.health <= 0) {
      return;
    }

    const { Body } = Matter;

    // Horizontal movement
    if (input.isActionPressed("moveLeft")) {
      if (this.body.velocity.x > -this.maxSpeed) {
        Body.applyForce(this.body, this.body.position, {
          x: -this.moveForce,
          y: 0,
        });
      }
    }
    if (input.isActionPressed("moveRight")) {
      if (this.body.velocity.x < this.maxSpeed) {
        Body.applyForce(this.body, this.body.position, {
          x: this.moveForce,
          y: 0,
        });
      }
    }

    // Jump - only on key press (not hold) and only when canJump is true
    const isJumpPressed = input.isActionPressed("jump");
    const isJumpJustPressed = isJumpPressed && !this.wasJumpPressed;
    this.wasJumpPressed = isJumpPressed;

    if (isJumpJustPressed && this.canJump) {
      Body.applyForce(this.body, this.body.position, {
        x: 0,
        y: -this.jumpForce,
      });
      this.canJump = false; // Prevent jumping again until grounded
    }
  }

  // Reset jump when player collides with something (called by collision handler)
  handleCollisionStart(otherBody) {
    // Call parent collision handler if it exists
    if (super.handleCollisionStart) {
      super.handleCollisionStart(otherBody);
    }

    // Reset jump ability when touching any entity
    this.canJump = true;
  }
}
