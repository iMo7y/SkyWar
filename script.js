window.addEventListener('load', function(){
    //canvas setup 
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 722;

    //Inputhandler setup
    class InputHandler {
        constructor(game){
            this.game = game;
            window.addEventListener('keydown', e => {
                if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && 
                    this.game.keys.indexOf(e.key) === -1){
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    if (this.game.player.powerUp) {
                        this.game.player.rocketShot(); 
                    } else {
                        this.game.player.shootTop(); 
                    }
                } else if (e.key === 'd'){
                    this.game.debug = !this.game.debug;
                }
            });
            window.addEventListener('keyup', e => {
                if(this.game.keys.indexOf(e.key) > -1){
                    this.game.keys.splice(
                    this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }
    //Sounds setup
    class SoundController {
        constructor(){
            this.powerUpSound = document.getElementById('powerup');
            this.explosionSound = document.getElementById('explosion');
            this.shotSound = document.getElementById('shot');
            this.hitSound = document.getElementById('hit');
            this.winningSound = document.getElementById('win');
        }
        powerUp(){
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play();
        }
        explosion(){
            this.explosionSound.currentTime = 0;
            this.explosionSound.play();
        }
        shot(){
            this.shotSound.currentTime = 0;
            this.shotSound.play();
        }
        hit(){
            this.hitSound.currentTime = 0;
            this.hitSound.play();
        }
        win(){
            this.winningSound.currentTime = 0;
            this.winningSound.play();
        }
    }

    // projectile setup
    class Projectile {
        constructor(game, x, y, type) { 
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 60;
            this.height = 18;
            this.speed = [];
            this.markedForDeletion = false;
            if (type === 'rocket') {
                this.image = document.getElementById('rocket');
                this.damage = 5;
                this.speed = 10;
            } else {
                this.image = document.getElementById('ammo');
                this.width = 70; 
                this.height = 15;
                this.damage = 1;
                this.speed = 5;
            }
        }
        update(){
            this.x += this.speed;
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    //player setup
    class Player {
        constructor(game){
            this.game = game;
            this.width = 200;
            this.height = 60;
            this.x = 20;
            this.burners = [];
            this.burnerOffsetY = 0;
            this.y = 100;
            this.speedY = 0;
            this.maxSpeed = 6;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
            this.burnerAnimationSpeed = 1;
            this.burnerDelay = 20;

            // Initialize burners
            for (let i = 1; i <= 6; i++) {
                const burnersImage = document.getElementById('burner' + i);
                this.burners.push(burnersImage);
            }
        }
        update(deltaTime){
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;
            // vertical boundaries
            if (this.y > this.game.height - this.height * 0.5) this.y = this.game.height - this.height * 0.5;
            else if (this.y < -this.height * 0.5) this.y = -this.height *0.5;
            // handle projectiles
            this.projectiles.forEach(projectile => {
            projectile.update();
            });
            //burners 
            this.burnerOffsetY += this.burnerAnimationSpeed * deltaTime;
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
            //power up 
            if (this.powerUp){
                if(this.powerUpTimer > this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.game.ammo += 0.1;
                }
            }
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            const burnerIndex = Math.floor(this.burnerOffsetY) % this.burners.length;
            const burner = this.burners[burnerIndex];
            const xOffset = this.width - 220; 
            const yOffset = this.height / 3 - 1; 
            context.drawImage(burner, this.x + xOffset, this.y + yOffset, 40, 30); 

            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }
        shootTop() {
            if (this.game.ammo > 0) {
                const projectileX = this.x + this.width / 1.2;
                const projectileY = this.y + this.height / 1.6;
                const projectileType = 'ammo';
                this.projectiles.push(new Projectile(this.game, projectileX, projectileY, projectileType));
                this.game.ammo--;
            }
            this.game.sound.shot();
        }
        rocketShot() {
            if (this.powerUp && this.game.ammo > 0) {
                const projectileX = this.x + this.width / 1.2;
                const projectileY = this.y + this.height / 1.6;
                this.projectiles.push(new Projectile(this.game, projectileX, projectileY, 'rocket'));
                this.game.ammo--;
            }
        }
        enterPowerUp(){
            this.powerUpTimer = 0;
            this.powerUp = true;
            if (this.game.ammo < this.game.maxAmmo) this.game.ammo = 
            this.game.maxAmmo; 
            this.game.sound.powerUp();
        }
    }

    //enemy setup
    class Enemy {
         constructor(game){
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
         }
         update(){
            this.x += this.speedX - this.game.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
         }
         draw(context){
            if (this.game.debug)context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            if (this.game.debug){
            context.font = '20px Helvetica';
            context.fillText(this.lives, this.x, this.y);
            }
        }
    }

    class Enemyjet extends Enemy {
         constructor(game){
            super(game);
            this.width = 200;
            this.height = 60;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('enemyjet');
            this.lives= 5;
            this.score = 10;
            
         }
    }
    class Helicopter extends Enemy {
        constructor(game){
           super(game);
           this.width = 200;
           this.height = 60;
           this.y = Math.random() * (this.game.height * 0.95 - this.height);
           this.image = document.getElementById('helicopter');
           this.lives= 8;
           this.score = 15;
           
        }
   }

    class LuckyBird extends Enemy {
        constructor(game){
           super(game);
           this.width = 30;
           this.height = 30;
           this.y = Math.random() * (this.game.height * 0.95 - this.height);
           this.image = document.getElementById('luckybird');
           this.lives = 1;
           this.score = 3;
           this.type = 'lucky';
        }
    }

    //layers setup
    class Layer {
       constructor(game, image, speedModifier){
        this.game = game;
        this.image = image;
        this.speedModifier = speedModifier;
        this.width = this.game.width;
        this.height = this.game.height;
        this.x = 0;
        this.y = 0;
       }
       update(){
        if (this.x <= -this.width) this.x = 0;
        this.x -= this.game.speed * this.speedModifier;
       }
       draw(context){
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.x + this.width, this.y, this.width, this.height); 
       }
    }


    //explosion setup
    class Explosion{
        constructor(game, x, y){
            this.game = game;
            this.frameX = 0;
            this.spriteHeight = 200;
            this.spriteWidth = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 50;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime){
            this.x -= this.game.speed;
            if (this.timer > this.interval){
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            
            if (this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context){
            context.drawImage(this.image, this.frameX * this.
            spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.
            x, this.y, this.width, this.height);
        }
    }
         
class SmokeExplosion extends Explosion {
   constructor(game, x, y){
    super(game, x, y);
    this.image = document.getElementById('smokeExplosion');
   }
}
class FireExplosion extends Explosion {
    constructor(game, x, y){
        super(game, x, y);
        this.image = document.getElementById('fireExplosion');
       }
}
    //background setup
    class Background {
        constructor(game){
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.image4 = document.getElementById('layer4');
            this.layer1 = new Layer(this.game, this.image1, 2.5);
            this.layer2 = new Layer(this.game, this.image2, 2);
            this.layer3 = new Layer(this.game, this.image3, 2);
            this.layer4 = new Layer(this.game, this.image4, 3);
            this.layers = [this.layer1, this.layer2, this.layer3, this.layer4];
        }
        update(){
            this.layers.forEach(layer => layer.update());
            
        }
        draw(context){
            this.layers.forEach(layer => layer.draw(context));
    
        }
    }

    //ui setup
    class UI {
    constructor(game){
        this.game = game;
        this.fontSize = 25;
        this.fontFamily = 'Bangers';
        this.color = 'white';
    }
    draw(context){
        context.save();
        context.fillStyle = this.color;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = 'black';
        context.font = this.fontSize + 'px ' + this.fontFamily;
        //score
        context.fillText('Score: ' + this.game.score, 20, 40);
        //timer
        const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
        context.fillText('Timer: ' + formattedTime, 20, 100);
        //game over messages
        if (this.game.gameOver){
            context.textAlign ='center';
            let message1;
            let message2;
            if (this.game.score > this.game.winningScore){
                message1 = 'Mission Accomplished!';
                message2 = 'Congratulations, Pilot! You conquered the skies!';
                document.getElementById('win').play();
            } else {
                message1 = 'Defeat in the Skies!';
                message2 = 'Redemption takes flight!';
                document.getElementById('lose').play();
            }
            context.font = '90px ' + this.fontFamily;
            context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 30);
            context.font = '35px ' + this.fontFamily;
            context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 40);
    
        }
        //ammo 
        if (this.game.player.powerUp) context.fillStyle = 'red';
        for (let i = 0; i < this.game.ammo; i++){
            context.fillRect(20 + 5* i, 50, 3, 20);
        }
        context.restore();
      }
    }

    //game setup
    class Game {
       constructor(width, height){
        this.width = width;
        this.height = height;
        this.background = new Background(this);
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.ui = new UI(this);
        this.sound = new SoundController();
        this.keys = [];
        this.enemies =[]
        this.explosions = [];
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.ammo = 20;
        this.maxAmmo = 50;
        this.ammoTimer = 0;
        this.ammoInterval = 350;
        this.gameOver = false;
        this.score = 0;
        this.winningScore = 200;
        this.gameTime = 0;
        this.timeLimit = 60000;
        this.speed = 1.5;
        this.debug = false;
       }
       update(deltaTime){
        if (!this.gameOver) this.gameTime += deltaTime;
        if (this.gameTime > this.timeLimit) this.gameOver = true;
        this.background.update()
           this.player.update(deltaTime);
           if (this.ammoTimer > this.ammoInterval){
              if (this.ammo < this.maxAmmo) this.ammo++;
            this.ammoTimer = 0;
           } else {
            this.ammoTimer += deltaTime;
           }
           this.explosions.forEach(explosion => explosion.update(deltaTime));
           this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);
           this.enemies.forEach(enemy => {
            enemy.update();
            if (this.checkCollision(this.player, enemy)){
                enemy.markedForDeletion = true;
                this.addExplosion(enemy);
                this.sound.hit();
                if (enemy.type === 'lucky') this.player.enterPowerUp();
                else if (!this.gameOver) this.score--;
            }
            this.player.projectiles.forEach(projectile =>  {
                if (this.checkCollision(projectile, enemy)){
                    enemy.lives--;
                    projectile.markedForDeletion = true;
                    if (enemy.lives <= projectile.damage){
                        enemy.markedForDeletion = true;
                        this.sound.explosion();
                        this.addExplosion(enemy);
                       if(!this.gameOver) this.score+= enemy.score;
                    }
                }
            })
           });
           this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
           if (this.enemyTimer > this.enemyInterval && !this.gameOver){
               this.addEnemy();
               this.enemyTimer = 0;
           } else {
            this.enemyTimer += deltaTime;
           }
       }
       draw(context){
        this.background.draw(context)
        this.ui.draw(context);
        this.player.draw(context)
        this.enemies.forEach(enemy => {
            enemy.draw(context);
           });
           this.explosions.forEach(explosion => {
            explosion.draw(context);
           });
       } 
       addEnemy() {
        const randomize = Math.random();
        
        if (randomize < 0.6) {
          this.enemies.push(new Enemyjet(this));
          this.enemies.push(new Helicopter(this));
        } else {
          this.enemies.push(new LuckyBird(this));
        }
      }
    
       addExplosion(enemy){
        const randomize = Math.random();
        if (randomize < 0.5) {
        this.explosions.push(new 
        SmokeExplosion(this, enemy.x + enemy.width * 0.5, enemy.y 
        + enemy.height * 0.5));
        } else {
            this.explosions.push(new 
                FireExplosion(this, enemy.x + enemy.width * 0.5, enemy.y 
                + enemy.height * 0.5));
        }
       }
       checkCollision(rect1, rect2) {
        return (
          rect1.x < rect2.x + rect2.width &&
          rect1.x + rect1.width > rect2.x &&
          rect1.y < rect2.y + rect2.height &&
          rect1.y + rect1.height > rect2.y
        );
       }
    } 

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    // animation loop
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate(0);
});