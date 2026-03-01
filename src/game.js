import { playShootSound, playExplosionSound, playEngineHum, stopEngineHum } from './audio/synth.js';
import { Bomber } from './entities/bomber.js';

export class Game {
    constructor(canvas, context, bomberImage, bgImage) {
        this.ctx = context;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;

        // Assets
        this.bomberImage = bomberImage;
        this.bgImage = bgImage;

        // State
        this.isPlaying = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        this.bombers = [];
        this.explosions = []; // simple particle effects
        this.flakBursts = []; // bullet hits
        this.droppedBombs = []; // bombs dropped by planes

        this.totalKills = 0;
        this.onMilestone = null; // Callback for milestone
        this.churchillWave5Shown = false;
        this.hitler30Shown = false;
        this.hitler50Shown = false;

        this.lastTime = 0;

        // Background scrolling
        this.bgX = 0;
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bombers = [];
        this.explosions = [];
        this.flakBursts = [];
        this.droppedBombs = [];
        this.totalKills = 0;
        this.churchillWave5Shown = false;
        this.hitler30Shown = false;
        this.hitler50Shown = false;
        this.lastTime = performance.now();
        playEngineHum();
        this.loop(this.lastTime);
    }

    stop() {
        this.isPlaying = false;
        stopEngineHum();
    }

    update(deltaTime) {
        // Scroll Background slowly
        this.bgX -= 0.02 * deltaTime;
        if (this.bgX <= -this.width) {
            this.bgX = 0;
        }

        // Spawn bombers based on level (reduced frequency)
        const spawnChance = 0.003 + (this.level * 0.002);
        if (Math.random() < spawnChance && this.bombers.length < 3 + this.level) {
            this.bombers.push(new Bomber(this.width, this.height, this.level, this.bomberImage));
        }

        // Update bombers
        for (let i = this.bombers.length - 1; i >= 0; i--) {
            let b = this.bombers[i];
            let newBomb = b.update(deltaTime);
            if (newBomb) {
                this.droppedBombs.push(newBomb);
            }

            // If active is false but health > 0, it means it flew past!
            if (!b.active && b.health > 0) {
                this.lives--;
                this.bombers.splice(i, 1);
                this.updateHUD();

                // Camera shake effect placeholder (handled in render)

                if (this.lives <= 0) {
                    this.triggerGameOver();
                }
            } else if (!b.active && b.health <= 0) {
                // Destroyed logic already handled in handleClick
                this.bombers.splice(i, 1);
            }
        }

        // Update Particles (Flak bursts)
        for (let i = this.flakBursts.length - 1; i >= 0; i--) {
            this.flakBursts[i].life -= deltaTime;
            if (this.flakBursts[i].life <= 0) this.flakBursts.splice(i, 1);
        }

        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            let e = this.explosions[i];
            e.x += e.vx * (deltaTime * 0.05);
            e.y += e.vy * (deltaTime * 0.05);
            e.life -= deltaTime * 0.0015;
            if (e.life <= 0) this.explosions.splice(i, 1);
        }

        // Update dropped bombs
        for (let i = this.droppedBombs.length - 1; i >= 0; i--) {
            let bomb = this.droppedBombs[i];
            bomb.y += bomb.vy * (deltaTime * 0.05);

            if (bomb.y > this.height - 30) {
                // Ground explosion effect
                for (let k = 0; k < 12; k++) {
                    this.explosions.push({
                        x: bomb.x + (Math.random() * 20 - 10),
                        y: bomb.y + (Math.random() * 10 - 20),
                        vx: (Math.random() - 0.5) * 6,
                        vy: -(Math.random()) * 8, // blast upwards
                        life: 0.8 + Math.random() * 0.4,
                        color: Math.random() > 0.5 ? '#ffaa00' : (Math.random() > 0.5 ? '#ff3300' : '#888888'),
                        size: Math.random() * 8 + 4
                    });
                }
                playExplosionSound();
                this.droppedBombs.splice(i, 1);
            }
        }
    }

    render() {
        // Clear and draw background
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw scrolling background (if loaded)
        if (this.bgImage && this.bgImage.complete) {
            // The generated background has borders, so we crop the middle part
            // image is likely 1024x1024. Let's crop out top 10% and bottom 10%.
            const sX = 0;
            const sY = this.bgImage.height * 0.1;
            const sW = this.bgImage.width;
            const sH = this.bgImage.height * 0.8;

            this.ctx.drawImage(this.bgImage, sX, sY, sW, sH, Math.floor(this.bgX), 0, this.width, this.height);

            // Draw flipped second half for seamless loop
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.bgImage, sX, sY, sW, sH, -Math.floor(this.bgX) - (this.width * 2), 0, this.width, this.height);
            this.ctx.restore();
        } else {
            // Fallback starry night
            this.ctx.fillStyle = '#0b1021';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Screen shake if lives just lost (omitting complex shake logic, just rendering entities)

        this.bombers.forEach(b => b.draw(this.ctx));

        // Draw flak bursts
        this.flakBursts.forEach(burst => {
            this.ctx.fillStyle = `rgba(255, 200, 0, ${Math.max(0, burst.life) / 200})`;
            this.ctx.beginPath();
            const radius = Math.max(0, (200 - burst.life) / 5);
            this.ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw explosions
        this.explosions.forEach(e => {
            this.ctx.globalAlpha = Math.max(0, e.life);
            this.ctx.fillStyle = e.color;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, Math.max(0, e.size * e.life), 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Draw dropped bombs
        this.ctx.fillStyle = '#cccccc';
        this.droppedBombs.forEach(bomb => {
            this.ctx.beginPath();
            this.ctx.ellipse(bomb.x, bomb.y, 3, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    loop(timestamp) {
        if (!this.isPlaying) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    handleClick(x, y) {
        if (!this.isPlaying) return;

        playShootSound();

        // Add a visual flak burst at click
        this.flakBursts.push({ x, y, life: 200 });

        // Check hits (reverse order to hit top ones first)
        let hit = false;
        for (let i = this.bombers.length - 1; i >= 0; i--) {
            if (this.bombers[i].checkHit(x, y)) {
                this.bombers[i].health--;
                if (this.bombers[i].health <= 0) {
                    this.bombers[i].active = false;
                    this.totalKills++;
                    this.score += 100 * this.level;

                    // Level is purely based on kills now, equally lengthed (10 kills = 1 level)
                    const newLevel = Math.floor(this.totalKills / 10) + 1;
                    if (newLevel > this.level) {
                        this.level = newLevel;
                    }

                    if (this.level >= 5 && !this.churchillWave5Shown) {
                        this.churchillWave5Shown = true;
                        if (this.onMilestone) this.onMilestone('churchill5');
                    }
                    if (this.totalKills >= 30 && !this.hitler30Shown) {
                        this.hitler30Shown = true;
                        if (this.onMilestone) this.onMilestone('hitler30');
                    }
                    if (this.totalKills >= 50 && !this.hitler50Shown) {
                        this.hitler50Shown = true;
                        if (this.onMilestone) this.onMilestone('hitler50');
                    }

                    playExplosionSound();

                    // Extra massive explosion effect here
                    for (let k = 0; k < 30; k++) {
                        // Create a fiery particle explosion
                        this.explosions.push({
                            x: x + (Math.random() * 20 - 10),
                            y: y + (Math.random() * 20 - 10),
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            life: 1.0 + Math.random() * 0.5,
                            color: Math.random() > 0.5 ? '#ffaa00' : (Math.random() > 0.5 ? '#ff3300' : '#ffffff'),
                            size: Math.random() * 15 + 5
                        });
                    }
                }
                hit = true;
                break; // Only hit one bomber per click
            }
        }

        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('scoreText').innerText = `SCORE: ${this.score}`;
        document.getElementById('livesText').innerText = `LIVES: ${this.lives}`;
        document.getElementById('levelText').innerText = `WAVE: ${this.level}`;
    }

    triggerGameOver() {
        this.stop();
        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');

        // Show default cursor again just in case, but custom crosshair is global
        document.getElementById('crosshair').style.display = 'none';
        document.body.style.cursor = 'default';
    }
}
