class Axesub extends GameObject{
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 28;
		this.height = 30;
		this.sprite = "axesub";
		this.speed = 7.5;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.times = {
			"attack" : Game.DELTASECOND * 1.6,
			"landedhit" : Game.DELTASECOND * 3,
			"background" : Game.DELTASECOND * 3,
			"carryon" : Game.DELTASECOND * 2
		}
		
		this.states = {
			"wakingup" : 0,
			"attack" : 0,
			"landedhit" : 0,
			"carryon" : 0,
			"background" : 0
		}
		
		
		this.difficulty = o.getInt("difficulty", Spawn.difficulty);
		this.states.background = o.getBool("background", false);
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.xpDrop = Spawn.xp(3,this.difficulty);
		this.mass = 1;
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		this.pushable = false;
		this.friction = 0.05;
		
		this.on("collideHorizontal", function(h){
			if(this.states.carryon > 0){
				this.flip = h > 0;
			}
		});
		this.on(["hurt_other","blockOther","blocked"], function(obj){
			this.states.landedhit = this.times.landedhit;
			this.jump();
			this.force.x = this.forward() * -5;
		});
		
		
		this.on("struck", EnemyStruck);
		this.on("hurt", function(){
			
		});
		this.on("death", function(){
			this.destroy();
			Item.drop(this,4);
			audio.play("kill",this.position);
			createExplosion(this.position, 40 );
		});
	}

	update(){
		if ( this.life > 0 ) {
			var dir = this.position.subtract(_player.position);
			
			if(this.states.background > 0){
				this.frame.x = 0;
				this.frame.y = 3;
				this.zIndex = -1;
				this.interactive = false;
				
				if(dir.length() < 64){
					this.states.wakingup = 1;
				}
				
				if(this.states.wakingup){
					this.frame = Axesub.anim_emerge.frame(1-this.states.background/this.times.background);
					
					this.states.background -= this.delta;
					if(this.states.background <= 0){
						this.interactive = true;
						this.zIndex = 1;
					}
				}
				
			} else if( this.states.landedhit > 0) {
				//Bounce back and try again
				this.frame.x = 3; this.frame.y = 1;
				
				if(this.states.landedhit > this.times.landedhit - Game.DELTASECOND * 1.25){
					this.force.y -= this.gravity * 0.5 * this.delta;
					this.addHorizontalForce( this.forward() * -this.speed );
				}
				
				this.states.attack = 0;
				this.states.landedhit -= this.delta;
				
			} else if( this.states.attack > 0) {
				//Leap and swing at the player
				this.frame = Axesub.anim_attack.frame(1.0 - this.states.attack/this.times.attack);
				
				if(this.frame.x == 0 ){
					this.force.y -= this.gravity * 0.5 * this.delta;
					this.addHorizontalForce( this.forward() * this.speed );
				}
				
				if(this.frame.x == 1 || this.frame.x == 2){
					this.strike(Axesub.attackRect);
				}
				
				this.states.attack -= this.delta;
			} else if(this.states.carryon > 0) {
				this.addHorizontalForce( this.forward() * this.speed );
				this.states.carryon -= this.delta;
			} else {
				//Run at player
				this.frame.x = this.frame.y = 0;
				
				this.flip = dir.x > 0;
				this.addHorizontalForce( this.forward() * this.speed );
				
				var distance = Math.abs(this.force.x * this.times.attack * 18.0);
				
				if(Math.abs(dir.x) < distance){
					if(Math.abs(dir.y < 64)){
						this.states.attack = this.times.attack;
						if(this.grounded){
							this.jump();
						}
					} else {
						this.states.carryon = this.times.carryon;
					}
				}
			}
		}
	}
	jump(){
		this.grounded = false;
		this.force.y = -10;
	}
}

Axesub.attackRect = new Line(8,-24,40,16);
Axesub.anim_attack = new Sequence([
	[0,1,0.3],
	[1,1,0.1],
	[2,1,0.1],
	[3,1,0.6]
]);
Axesub.anim_emerge = new Sequence([
	[1,3,0.8],
	[2,3,0.1],
	[3,3,0.1]
]);

self["Axesub"] = Axesub;