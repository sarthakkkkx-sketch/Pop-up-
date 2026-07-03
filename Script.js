const menu = document.querySelector(".menu");
const game = document.getElementById("game");
const startBtn = document.getElementById("startBtn");
const menuBtn = document.getElementById("menuBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const comboText = document.getElementById("combo");
const highScoreText = document.getElementById("highScore");
const soundBtn = document.getElementById("soundBtn");

let animationId, gameTimer;
let score = 0, combo = 0, lastPopTime = 0;
let timeLeft = 60;
let bubbles = [], particles = [];
let soundOn = true;
let highScore = localStorage.getItem('bubbleHighScore') || 0;
highScoreText.textContent = highScore;

// Sound effects using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPopSound() {
    if (!soundOn) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

class Bubble {
    constructor() {
        this.r = Math.random() * 20 + 20;
        this.x = Math.random() * (canvas.width - this.r * 2) + this.r;
        this.y = canvas.height + this.r;
        this.speed = Math.random() * 1.5 + 0.5 + score * 0.01;
        this.hue = Math.random() * 360;
        this.color = `hsla(${this.hue}, 100%, 60%, 0.8)`;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update() {
        this.y -= this.speed;
        this.wobble += 0.05;
        this.x += Math.sin(this.wobble) * 0.5;
    }

    draw() {
        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Highlight
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x - this.r/3, this.y - this.r/3, this.r/3, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, hue){
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 10;
        this.dy = (Math.random() - 0.5) * 10;
        this.life = 50;
        this.hue = hue;
        this.size = Math.random() * 4 + 2;
    }

    update(){
        this.x += this.dx;
        this.y += this.dy;
        this.dy += 0.2;
        this.life--;
        this.size *= 0.97;
    }

    draw(){
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.life/50})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function createBubble(){
    bubbles.push(new Bubble());
}

function spawnBubbles(){
    if (bubbles.length < 15) createBubble();
}

function animate(){
    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach((bubble, index) => {
        bubble.update();
        bubble.draw();
        if(bubble.y < -bubble.r){
            bubbles.splice(index, 1);
        }
    });

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if(p.life <= 0) particles.splice(index, 1);
    });
    
    spawnBubbles();
}

function popBubble(x, y){
    let hit = false;
    bubbles.forEach((bubble, index) => {
        let dx = x - bubble.x;
        let dy = y - bubble.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < bubble.r){
            hit = true;
            
            // Combo system
            let now = Date.now();
            if (now - lastPopTime < 500) {
                combo++;
            } else {
                combo = 1;
            }
            lastPopTime = now;
            
            let points = combo;
            score += points;
            scoreText.textContent = `Score: ${score}`;
            comboText.textContent = combo > 1? `x${combo} Combo!` : '';
            
            if(navigator.vibrate) navigator.vibrate(30);
            playPopSound();
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 300);
            
            for(let i = 0; i < 20; i++){
                particles.push(new Particle(bubble.x, bubble.y, bubble.hue));
            }
            
            bubbles.splice(index, 1);
        }
    });
    if (!hit) combo = 0;
}

function startGame() {
    score = 0;
    combo = 0;
    timeLeft = 60;
    bubbles = [];
    particles = [];
    scoreText.textContent = "Score: 0";
    comboText.textContent = "";
    
    menu.style.display = "none";
    game.style.display = "block";
    
    for(let i = 0; i < 8; i++) createBubble();
    animate();
    
    gameTimer = setInterval(() => {
        timeLeft--;
        timerText.textContent = `Time: ${timeLeft}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    cancelAnimationFrame(animationId);
    clearInterval(gameTimer);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('bubbleHighScore', highScore);
        highScoreText.textContent = highScore;
        alert(`New High Score: ${score}! 🎉`);
    } else {
        alert(`Game Over! Score: ${score}`);
    }
    
    game.style.display = "none";
    menu.style.display = "flex";
}

canvas.addEventListener("click", (e) => popBubble(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    let t = e.touches[0];
    popBubble(t.clientX, t.clientY);
});

startBtn.onclick = startGame;
menuBtn.onclick = endGame;
soundBtn.onclick = () => {
    soundOn =!soundOn;
    soundBtn.textContent = soundOn? '🔊' : '🔇';
  }
