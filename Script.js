const menu = document.querySelector(".menu");
const game = document.getElementById("game");
const startBtn = document.getElementById("startBtn");
const menuBtn = document.getElementById("menuBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");

let animationId;
let score = 0;
let bubbles = [];
let particles = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

class Bubble {
    constructor() {
        this.r = Math.random() * 25 + 25;
        this.x = Math.random() * (canvas.width - this.r * 2) + this.r;
        this.y = canvas.height + this.r;
        this.speed = Math.random() * 2 + 1;
        this.color = `hsla(${Math.random()*360},100%,70%,0.7)`;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x - this.r/3, this.y - this.r/3, this.r/4, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
    }
}

class Particle {
    constructor(x,y,color){
        this.x=x;
        this.y=y;
        this.dx=(Math.random()-0.5)*8;
        this.dy=(Math.random()-0.5)*8;
        this.life=40;
        this.color=color;
    }

    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        this.life--;
    }

    draw(){
        ctx.fillStyle=this.color;
        ctx.fillRect(this.x,this.y,4,4);
    }
}

function createBubble(){
    bubbles.push(new Bubble());
}

for(let i=0;i<10;i++){
    createBubble();
}

function animate(){
    animationId=requestAnimationFrame(animate);

    ctx.clearRect(0,0,canvas.width,canvas.height);

    bubbles.forEach((bubble,index)=>{
        bubble.update();
        bubble.draw();

        if(bubble.y<-bubble.r){
            bubbles.splice(index,1);
            createBubble();
        }
    });

    particles.forEach((p,index)=>{
        p.update();
        p.draw();

        if(p.life<=0){
            particles.splice(index,1);
        }
    });
}

function popBubble(x,y){

    bubbles.forEach((bubble,index)=>{

        let dx=x-bubble.x;
        let dy=y-bubble.y;
        let dist=Math.sqrt(dx*dx+dy*dy);

        if(dist<bubble.r){

            score++;
            scoreText.innerHTML="Score : "+score;

            if(navigator.vibrate){
                navigator.vibrate(40);
            }

            for(let i=0;i<30;i++){
                particles.push(new Particle(bubble.x,bubble.y,bubble.color));
            }

            bubbles.splice(index,1);
            createBubble();
        }

    });

}

canvas.addEventListener("click",(e)=>{
    popBubble(e.clientX,e.clientY);
});

canvas.addEventListener("touchstart",(e)=>{
    let t=e.touches[0];
    popBubble(t.clientX,t.clientY);
});

startBtn.onclick=()=>{
    menu.style.display="none";
    game.style.display="block";
    animate();
}

menuBtn.onclick=()=>{
    cancelAnimationFrame(animationId);
    game.style.display="none";
    menu.style.display="block";
}
