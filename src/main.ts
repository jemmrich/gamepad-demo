interface GamepadState {
    x: number;
    y: number;
    rotation: number;
    connected: boolean;
    shooting: boolean;
    lastShotTime: number;
}

interface Projectile {
    x: number;
    y: number;
    rotation: number;
    speed: number;
    active: boolean;
}

class GamepadDemo {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private statusElement: HTMLElement;
    private gamepadState: GamepadState;
    private projectiles: Projectile[] = [];
    private animationFrameId: number = 0;
    private shootCooldown: number = 250; // ms between shots
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.statusElement = document.getElementById('status')!;
        
        // Initial state
        this.gamepadState = {
            x: this.canvas.width / 2 - 25, // Center rectangle horizontally
            y: this.canvas.height / 2 - 25, // Center rectangle vertically
            rotation: 0,                    // Initial rotation in radians
            connected: false,
            shooting: false,
            lastShotTime: 0
        };
        
        // Initialize event listeners
        window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
        
        // Start the game loop
        this.gameLoop();
    }
    
    private onGamepadConnected(event: GamepadEvent): void {
        this.gamepadState.connected = true;
        this.statusElement.textContent = `Gamepad connected: ${event.gamepad.id}`;
    }
    
    private onGamepadDisconnected(): void {
        this.gamepadState.connected = false;
        this.statusElement.textContent = 'No gamepad detected. Press any button on your controller to connect.';
    }
    
    private shootProjectile(): void {
        const now = Date.now();
        
        // Check if enough time has passed since last shot
        if (now - this.gamepadState.lastShotTime > this.shootCooldown) {
            // Create a new projectile
            const projectile: Projectile = {
                x: this.gamepadState.x + 25, // Start at center of rectangle
                y: this.gamepadState.y + 25,
                rotation: this.gamepadState.rotation,
                speed: 8,                    // Projectile speed
                active: true
            };
            
            this.projectiles.push(projectile);
            this.gamepadState.lastShotTime = now;
        }
    }
    
    private updateProjectiles(): void {
        // Update each projectile position based on its direction and speed
        for (let i = 0; i < this.projectiles.length; i++) {
            const projectile = this.projectiles[i];
            
            if (projectile.active) {
                // Move the projectile based on its rotation and speed
                projectile.x += Math.cos(projectile.rotation) * projectile.speed;
                projectile.y += Math.sin(projectile.rotation) * projectile.speed;
                
                // Deactivate projectiles that go off screen
                if (
                    projectile.x < 0 || 
                    projectile.x > this.canvas.width || 
                    projectile.y < 0 || 
                    projectile.y > this.canvas.height
                ) {
                    projectile.active = false;
                }
            }
        }
        
        // Remove inactive projectiles from array 
        // (only when there are too many to improve performance)
        if (this.projectiles.length > 100) {
            this.projectiles = this.projectiles.filter(p => p.active);
        }
    }
    
    private updateGamepadState(): void {
        const gamepads = navigator.getGamepads();
        
        // Find the first connected gamepad
        for (const gamepad of gamepads) {
            if (gamepad) {
                // Left analog stick (typically axes 0 and 1)
                const horizontalAxis = gamepad.axes[0];
                const verticalAxis = gamepad.axes[1];
                
                // Right analog stick (typically axes 2 and 3)
                const rightHorizontalAxis = gamepad.axes[2] || 0;
                const rightVerticalAxis = gamepad.axes[3] || 0;
                
                // Right trigger (usually buttons[7] or buttons[5] depending on the controller)
                // Check multiple common trigger buttons to support different controllers
                const rightTrigger = 
                    gamepad.buttons[7]?.pressed || // RT on Xbox
                    gamepad.buttons[5]?.pressed || // R1 on PlayStation
                    gamepad.buttons[6]?.pressed || // R2 on PlayStation
                    false;
                
                // Apply a small dead zone to avoid drift
                const deadZone = 0.1;
                
                // Update rectangle position based on left analog stick input
                if (Math.abs(horizontalAxis) > deadZone) {
                    this.gamepadState.x += horizontalAxis * 5; // Adjust speed as needed
                }
                
                if (Math.abs(verticalAxis) > deadZone) {
                    this.gamepadState.y += verticalAxis * 5; // Adjust speed as needed
                }
                
                // Update rotation based on right analog stick
                if (Math.abs(rightHorizontalAxis) > deadZone || Math.abs(rightVerticalAxis) > deadZone) {
                    // Calculate angle from right stick position
                    const angle = Math.atan2(rightVerticalAxis, rightHorizontalAxis);
                    this.gamepadState.rotation = angle;
                }
                
                // Keep rectangle within canvas boundaries
                this.gamepadState.x = Math.max(0, Math.min(this.canvas.width - 50, this.gamepadState.x));
                this.gamepadState.y = Math.max(0, Math.min(this.canvas.height - 50, this.gamepadState.y));
                
                // Handle shooting with trigger
                if (rightTrigger) {
                    this.shootProjectile();
                    this.gamepadState.shooting = true;
                } else {
                    this.gamepadState.shooting = false;
                }
                
                // Button state information
                const triggerInfo = `Trigger: ${rightTrigger ? 'PRESSED' : 'released'}`;
                
                // Update status with axes information
                this.statusElement.textContent = `Connected: ${gamepad.id}
Left Stick: X: ${horizontalAxis.toFixed(2)}, Y: ${verticalAxis.toFixed(2)}
Right Stick: X: ${rightHorizontalAxis.toFixed(2)}, Y: ${rightVerticalAxis.toFixed(2)}
Rotation: ${(this.gamepadState.rotation * 180 / Math.PI).toFixed(0)}°
${triggerInfo}
Projectiles: ${this.projectiles.filter(p => p.active).length}`;
                
                break; // Only use the first gamepad
            }
        }
    }
    
    private renderProjectiles(): void {
        // Draw all active projectiles
        this.ctx.fillStyle = '#f39c12'; // Orange projectiles
        
        for (const projectile of this.projectiles) {
            if (projectile.active) {
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    private render(): void {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw projectiles
        this.renderProjectiles();
        
        // Save the current state
        this.ctx.save();
        
        // Translate to rectangle center for rotation
        this.ctx.translate(
            this.gamepadState.x + 25, 
            this.gamepadState.y + 25
        );
        
        // Rotate around the center
        this.ctx.rotate(this.gamepadState.rotation);
        
        // Draw the rectangle (centered at origin due to translation)
        this.ctx.fillStyle = this.gamepadState.connected ? 
            (this.gamepadState.shooting ? '#e74c3c' : '#3498db') : '#ccc';
        this.ctx.fillRect(-25, -25, 50, 50);
        
        // Draw direction indicator
        this.ctx.fillStyle = '#ecf0f1'; // White indicator
        this.ctx.fillRect(15, -2, 10, 4);
        
        // Restore the context state
        this.ctx.restore();
    }
    
    private gameLoop(): void {
        // Update gamepad state
        if (this.gamepadState.connected) {
            this.updateGamepadState();
        }
        
        // Update projectiles
        this.updateProjectiles();
        
        // Render the scene
        this.render();
        
        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize the demo when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new GamepadDemo();
});