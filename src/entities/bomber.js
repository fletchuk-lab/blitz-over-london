export class Bomber {
    constructor(canvasWidth, canvasHeight, level, spriteImage) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.sprite = spriteImage;

        // Difficulty scaling (slower base speed to make game playable)
        const speedBase = 0.7 + (level * 0.15);

        // Spawn configuration (always fly left to right, or right to left horizontally)
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // Fixed dimensions for the bomber
        this.width = 90;
        this.height = 90;

        if (this.direction === 1) {
            this.x = -this.width;
            this.y = 50 + Math.random() * (canvasHeight * 0.4); // Top 40% of screen only
        } else {
            this.x = canvasWidth + this.width;
            this.y = 50 + Math.random() * (canvasHeight * 0.4);
        }

        this.vx = speedBase * this.direction + (Math.random() * 0.3 * this.direction);
        this.vy = (Math.random() - 0.5) * 0.3; // Slight vertical drift

        this.active = true;
        this.health = 1; // 1 hit to kill initially
    }

    update(deltaTime) {
        // Multiply deltaTime so it scales with frame rate if needed, but simple add is fine for now
        this.x += this.vx;
        this.y += this.vy;

        // Check if out of bounds to deactivate
        if ((this.direction === 1 && this.x > this.canvasWidth + 50) ||
            (this.direction === -1 && this.x < -this.width - 50)) {
            this.active = false;
        }

        // Randomly drop a bomb if over the city area
        let newBomb = null;
        if (this.x > 0 && this.x < this.canvasWidth - this.width && Math.random() < 0.003) {
            newBomb = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vy: 2 + Math.random() * 2 // slight variety in fall speed
            };
        }

        return newBomb;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.direction === -1) {
            ctx.rotate(Math.PI);
        } else {
            ctx.rotate(Math.PI / 2);
        }

        if (this.sprite && this.sprite.complete) {
            // Apply multiply blend mode to hide white/light checkerboard from generated image
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.globalCompositeOperation = 'source-over'; // reset
        } else {
            // Fallback shape
            ctx.fillStyle = 'darkgray';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }

    // Check if clicked
    checkHit(cx, cy) {
        // Simple bounding box collision with slightly generous hit area
        return (cx >= this.x - 10 && cx <= this.x + this.width + 10 &&
            cy >= this.y - 10 && cy <= this.y + this.height + 10);
    }
}
