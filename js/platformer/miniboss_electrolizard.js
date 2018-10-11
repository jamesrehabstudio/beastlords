ElectroLizard.prototype = new GameObject();
ElectroLizard.prototype.constructor = GameObject;
function ElectroLizard(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y-1;
	this.width = 40;
	this.height = 64;
	this.sprite = "electrolizard";
	this.startX = x;
	this.speed = 0.8;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(14,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);;
	this.damageLight = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);

	this.defenceLight = Spawn.defence(2,this.difficulty);
	this.defenceSlime = Spawn.defence(-2,this.difficulty);
	
	this.death_time = Game.DELTASECOND * 0.5;
	
	this.mass = 5.0;
	this.gravity = 0.4;
	this.pushable = true;
	
	this.states = {
		"arrows" : 5,
		"rest" : 0.0,
		"next" : 0,
		"phase" : 0,
		"time" : 0.0
	};
	
	this.on("collideObject",function(obj){
		
	});
	this.on("hurt", function(){
		if(Math.random() > 0.6){
			this.states.next = 7;
		}
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		Item.drop(this);
		this.destroy();
	});
}

ElectroLizard.prototype.setState = function(s){
	this.states.phase = s;
	this.states.next = 0;
	
	if(s == 1) {this.states.time = ElectroLizard.TIME_READYCHARGE;}
	if(s == 2) {this.states.time = ElectroLizard.TIME_CHARGE;}
	if(s == 3) {this.states.time = ElectroLizard.TIME_HAMMERDOWN;}
	if(s == 4) {this.states.time = ElectroLizard.TIME_READYARROW;}
	if(s == 5) {this.states.time = ElectroLizard.TIME_ARROW;}
	if(s == 6) {this.states.time = ElectroLizard.TIME_HAMMERATTACK;}
	if(s == 7) {this.states.time = ElectroLizard.TIME_PRELEAP;}
}

ElectroLizard.prototype.shootArrow = function(){
	var bolt = new Bullet(this.position.x, this.position.y+12);
	bolt.team = this.team;
	bolt.force.x = this.forward() * 10;
	bolt.flip = this.flip;
	bolt.sprite = "boarbow";
	bolt.frame.x = 2;
	bolt.frame.y = 2;
	bolt.damage = this.damage;
	bolt.setDeflect();
	game.addObject(bolt);
}

ElectroLizard.prototype.lightningArc = function(){
	var amount = 16;
	for(var i=0; i < amount; i++){
		var rad = (i / amount) * 2 * Math.PI;
		var deg = (i / amount) * 360;
		var bullet = new Bullet(this.position.x, this.position.y + 16);
		bullet.team = this.team;
		bullet.damage = 0;
		bullet.damageLight = this.damageLight;
		bullet.force.x = Math.sin(rad) * 7;
		bullet.force.y = Math.cos(rad) * 7;
		bullet.bounce = 1.0;
		bullet.collisionReduction = 1.0;
		bullet.friction = 0.0;
		bullet.wallStop = false;
		bullet.light = 96.0;
		bullet.lightColor = COLOR_LIGHTNING;
		bullet.range = 300;
		game.addObject(bullet);
	}
}

ElectroLizard.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		this.states.time -= this.delta;
		
		if(!this.grounded){
			//In air
			this.frame.x = Math.min(this.frame.x + this.delta * 0.2, 2);
			this.frame.y = 5;
			this.force.x = -this.forward() * this.speed * 2.5;
			this.states.phase = 0;
			this.states.time = 0.0;
			this.states.rest = Game.DELTASECOND * 0.25;
			this.states.next = Math.random() > 0.5 ? 3:6;
		} else if(this.states.rest > 0){
			//Rest
			this.frame.x = 3;
			this.frame.y = 5;
			this.states.rest -= this.delta;
		} else if(this.states.phase == 1){
			//Ready Charge
			var progress = 1 - (this.states.time / ElectroLizard.TIME_READYCHARGE);
			this.frame = ElectroLizard.anim_readycharge.frame(progress);
			this.states.next = 2;
		} else if(this.states.phase == 2){
			//Charge
			this.force.x += this.forward() * this.speed * this.delta;
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
			this.frame.y = 1;
			this.states.next = 6;
			this.startX = this.position.x;
			
			this.strike(new Line(0,8,48,16));
		} else if(this.states.phase == 3){
			//Slam hammer down
			var progress = 1 - (this.states.time / ElectroLizard.TIME_HAMMERDOWN);
			this.frame = ElectroLizard.anim_slamhammer.frame(progress);
			
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_HAMMERDOWN*0.24, this.delta)){
				this.lightningArc();
				var str = Math.min(Math.max((200-Math.abs(dir.x))/100,0),1) * 4;
				shakeCamera(Game.DELTASECOND*0.25,str);
			}
		} else if(this.states.phase == 4){
			//Ready Arrow
			var progress = 1 - (this.states.time / ElectroLizard.TIME_READYARROW);
			this.frame = ElectroLizard.anim_readyarrow.frame(progress);
			this.states.next = 5;
			this.states.arrows = 3 + Math.floor(Math.random() * 4);
		} else if(this.states.phase == 5){
			//Arrow Volley
			this.frame.x = 4;
			this.frame.y = 6;
			if(this.states.time < ElectroLizard.TIME_ARROW*0.5){
				this.frame.x = 3;
			}
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_ARROW*0.5, this.delta)){
				this.shootArrow();
			}
			if(this.states.time <= 0 && this.states.arrows > 0){
				this.states.arrows--;
				this.states.time = ElectroLizard.TIME_ARROW;
			}
		} else if(this.states.phase == 6){
			//Hammer attack
			var progress = 1 - (this.states.time / ElectroLizard.TIME_HAMMERATTACK);
			this.frame = ElectroLizard.anim_hammerattack.frame(progress);
			
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_HAMMERATTACK*0.4, this.delta)){
				var str = Math.min(Math.max((200-Math.abs(dir.x))/100,0),1) * 4;
				shakeCamera(Game.DELTASECOND*0.25,str);
			}
			if(this.frame.y == 7 && this.frame.x >= 3 && this.frame.x < 5){
				this.strike(new Line(0,-40,88,32), {"blockable" : 0});
			}
		} else if(this.states.phase == 7){
			//Leap back
			if(this.states.time <= 0){
				this.grounded = false;
				this.force.y = -5.0;
			}
		} else {
			//Idle
			this.frame.x = this.frame.y = 0;
			this.flip = dir.x > 0;
			
			if(this.states.next){
				this.setState(this.states.next);
			} else if(this.states.time < -Game.DELTASECOND * 1.2){
				if(
					(this.flip && this.position.x - this.startX > 64) || 
					(!this.flip && this.position.x - this.startX < -64)
				){
					if(Math.random() < 0.5){
						this.setState(1);
					} else {
						this.setState(6);
					}
				} else {
					if(Math.abs(dir.x) < 96 ){
						if(Math.random() < 0.5){
							this.setState(3);
						} else {
							this.setState(6);
						}
					} else {
						if(Math.random() < 0.9){
							this.setState(4);
						} else {
							this.setState(6);
						}
						
					}
				}
			}
		}
		
		if(this.states.time <= 0){
			this.states.phase = 0;
		}
		
	} else{
		this.force.x = 0;
		this.frame.x = 0;
		this.frame.y = 8;
	}
}

ElectroLizard.TIME_READYCHARGE = Game.DELTASECOND * 1.5;
ElectroLizard.TIME_CHARGE = Game.DELTASECOND * 1.5;
ElectroLizard.TIME_HAMMERDOWN = Game.DELTASECOND * 2.5;
ElectroLizard.TIME_READYARROW = Game.DELTASECOND * 0.5;
ElectroLizard.TIME_ARROW = Game.DELTASECOND * 0.4;
ElectroLizard.TIME_HAMMERATTACK = Game.DELTASECOND * 1.8;
ElectroLizard.TIME_PRELEAP = Game.DELTASECOND * 0.2;

ElectroLizard.anim_readycharge = new Sequence([
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.1],
	[3,2,0.5]
]);
ElectroLizard.anim_slamhammer = new Sequence([
	[0,3,0.1],
	[1,3,0.1],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.1],
	[0,4,0.5],
	[1,4,0.1],
	[2,4,0.5],
	[3,4,0.05],
	[4,4,0.5]
]);
ElectroLizard.anim_readyarrow = new Sequence([
	[0,6,0.1],
	[1,6,0.1],
	[2,6,0.1],
	[3,6,0.1],
	[4,6,0.25]
]);
ElectroLizard.anim_hammerattack = new Sequence([
	[3,5,0.5],
	[0,7,0.08],
	[1,7,0.3],
	[2,7,0.1],
	[3,7,0.1],
	[4,7,0.1],
	[5,7,0.5]
]);