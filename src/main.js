import './style.css';
import { Game } from './game.js';

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const crosshair = document.getElementById('crosshair');
const gameContainer = document.getElementById('game-container');

const splashScreen = document.getElementById('splashScreen');
const hud = document.getElementById('hud');
const gameOverScreen = document.getElementById('gameOverScreen');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Character elements
const characterPopup = document.getElementById('characterPopup');
const characterSpeechBubble = document.getElementById('characterSpeechBubble');
const characterHead = document.getElementById('characterHead');

// Load Images centrally
const assets = {
  bomber: new Image(),
  bg: new Image()
};

let imagesLoaded = 0;
const totalImages = 2;

assets.bomber.onload = checkImagesLoaded;
assets.bg.onload = checkImagesLoaded;

assets.bomber.src = '/assets/bomber.png';
assets.bg.src = '/assets/game_bg.png';

let game = null;

function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded >= totalImages) {
    initGame();
  }
}

function initGame() {
  game = new Game(canvas, ctx, assets.bomber, assets.bg);

  // Bind character event
  game.onMilestone = (event) => {
    if (event === 'churchill5') {
      showCharacter('churchill', "Good shot soldier!", '/assets/audio/churchill.mp3');
    } else if (event === 'hitler30') {
      showCharacter('hitler', "Oh no! Not my precious Heinkel bombers!", '/assets/audio/hitler1.mp3');
    } else if (event === 'hitler50') {
      showCharacter('hitler', "We surrender!", '/assets/audio/hitler2.mp3');

      // Auto complete the game 5 seconds after this action
      setTimeout(() => {
        if (game) {
          game.triggerGameOver();
          const title = document.querySelector('#gameOverScreen h2');
          if (title) {
            title.innerText = "VICTORY!";
            title.setAttribute('data-title', "VICTORY!");
          }
        }
      }, 5000);
    }
  };

  // Draw initial background before start
  ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
}

function showCharacter(character, text, audioFile) {
  // Setup visuals
  characterHead.src = `/assets/${character}.png`;
  characterSpeechBubble.innerText = text;

  // Slide up
  characterPopup.classList.add('slide-up');

  // Play audio
  if (audioFile) {
    const audio = new Audio(audioFile);
    audio.onended = () => {
      setTimeout(() => {
        characterPopup.classList.remove('slide-up');
      }, 1500);
    };
    audio.play().catch(e => {
      console.error("Audio playback failed:", e);
      // Fallback if audio fails to play
      setTimeout(() => {
        characterPopup.classList.remove('slide-up');
      }, 4000);
    });
  } else {
    // Fallback if no audio file provided
    setTimeout(() => {
      characterPopup.classList.remove('slide-up');
    }, 4000);
  }
}

// Mouse tracking for crosshair
gameContainer.addEventListener('mousemove', (e) => {
  // Position custom crosshair at mouse coordinates
  crosshair.style.left = `${e.clientX}px`;
  crosshair.style.top = `${e.clientY}px`;
});

// Hide cursor when leaving container
gameContainer.addEventListener('mouseleave', () => {
  crosshair.style.opacity = '0';
});
gameContainer.addEventListener('mouseenter', () => {
  crosshair.style.opacity = '1';
});

// Click to shoot
gameContainer.addEventListener('mousedown', (e) => {
  if (game && game.isPlaying) {
    // Adjust mouse coordinates to canvas coordinates
    const rect = canvas.getBoundingClientRect();

    // Calculate scaling if canvas is resized by CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    game.handleClick(canvasX, canvasY);

    // Add recoil effect to crosshair
    crosshair.style.transform = 'translate(-50%, -50%) scale(1.5)';
    setTimeout(() => {
      crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
  }
});

// UI Event Listeners
startBtn.addEventListener('click', () => {
  splashScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  // Ensure crosshair is visible and default is hidden
  crosshair.style.display = 'block';
  document.body.style.cursor = 'none';

  showCharacter('citizen', "Everybody... to the air raid shelters!", '/assets/audio/citizen.mp3');
  game.start();
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  crosshair.style.display = 'block';
  document.body.style.cursor = 'none';

  showCharacter('citizen', "Everybody... to the air raid shelters!", '/assets/audio/citizen.mp3');
  game.start();
});
