Baller.prototype = new GameObject();
Baller.prototype.constructor = GameObject;
function Baller(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "baller";
	this.zIndex = 1;
	this.idleMargin = 128;
	this.anchorpoint = new Point(0,0);
	
	this.ball = new BallerBall(x-48,y);
	this.ball.owner = this;
	
	this.links = new Array();
	for(var i=0; i < 8; i++) { this.links.push(new Point(x,y)); }
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.timers = {
		"swing" : 4,
		"release" : Game.DELTASECOND * 1.5,
		"pull" : Game.DELTASECOND * 4.0,
		"retrieve" : Game.DELTASECOND * 2.0,
	}
	this.states = {
		"swing" : this.timers.swing,
		"release" : 0.0,
		"pull" : 0.0,
		"retrieve" : 0.0,
	};
	
	o = o || {};
	
	this.spinType = 0;
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("type" in o){
		this.spinType = o["type"] * 1;
	}
	
	this.death_time = Game.DELTASECOND * 1.0;
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(7,this.difficulty);
	this.mass = 4.0;
	this.recoverySpeed = 180;
	this.arcSize = 56;
	this.archSpeed = 6.0;
	this.spinSpeed = 2.1;
	
	game.addObject(this.ball);
	
	this.on("wakeup", function(){
		this.states.swing = this.timers.swing;
		this.states.release = 0.0;
		this.states.pull = 0.0;
		this.states.retrieve = 0.0;
		this.ball.position.x = this.position.x;
		this.ball.position.y = this.position.y;
		
		if(game.objects.indexOf(this.ball) < 0){
			game.addObject(this.ball);
		}
	});
	
	this.on("sleep", function(){
		this.ball.destroy();
	});
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt", this.position);
	});
	this.on("pre_death", function(){
		this.ball.destroy();
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Baller.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = dir.x > 0;
		
		
		if(this.spinType == 0 ){
			if( this.ball.reflect ) {
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				var direction = this.ball.position.subtract(this.position).normalize(2 * this.delta * this.recoverySpeed);
				this.ball.position = this.ball.position.subtract(direction);
			} else if( this.states.retrieve > 0 ) {
				this.states.retrieve -= this.delta;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				if(this.bounds().overlaps(this.ball.bounds())){
					this.anchorpoint = new Point(-16,-16);
					this.ball.visible = false;
					this.frame.x = 2;
					this.frame.y = 2;
				} else {
					this.frame.x = 2;
					this.frame.y = 0;
					var direction = this.ball.position.subtract(this.position).normalize(this.delta * this.recoverySpeed);
					this.ball.position = this.ball.position.subtract(direction);
					this.ball.flip = direction.x > 0;
				} 
				
				if(this.states.retrieve <= 0){
					this.states.swing = this.timers.swing;
					this.ball.visible = true;
				}
			} else if( this.states.pull > 0 ) {
				this.states.pull -= this.delta;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				this.frame.x = Math.max((this.frame.x + this.delta * 0.1) % 3,1);
				this.frame.y = 1;
				
				if(this.states.pull <= 0){
					this.states.retrieve = this.timers.retrieve;
				}
				
			} else if ( this.states.release > 0 ) {
				this.states.release -= this.delta;
				this.anchorpoint = new Point(0,0);
				this.frame.x = Math.min(this.frame.x + this.delta * 0.01, 1);
				this.frame.y = 1;
				
				if(this.states.release <= 0 || this.ball.grounded){
					this.ball.strikeable = false;
					this.states.pull = this.timers.pull;
					this.states.release = 0.0;
				}
			} else if ( this.states.swing > 0 ) {
				var distance = Math.sin(game.timeScaled * this.archSpeed) * this.arcSize;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				this.ball.position = this.position.add(new Point(distance, -16));
				this.ball.flip = this.ball.position.x < this.position.x;
				this.anchorpoint = new Point(-16,-16);
				
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
				this.frame.y = 0;
				
				if(distance < this.forward() * this.arcSize * 0.98){
					if(this.flip && this.ball.zIndex < this.zIndex ){
						this.states.swing--;
					}
					this.ball.zIndex = this.zIndex + 1;
				}
				if(distance > this.forward() * this.arcSize * 0.98){
					if(!this.flip && this.ball.zIndex >= this.zIndex){
						this.states.swing--;
					}
					this.ball.zIndex = this.zIndex - 1;
				}
				
				if(this.states.swing <= 0){
					this.states.release = this.timers.release;
					this.frame.x = 0;
					this.ball.strikeable = true;
					this.ball.force.x = this.forward() * 10;
					this.ball.force.y = -3;
					this.ball.flip = this.flip;
					this.ball.gravity = 0.5;
					this.ball.grounded = false;
				}
			} else {
				
			}
		} else if(this.spinType == 1){
			
			var radius = 80;
			var angle = (game.timeScaled * this.spinSpeed) % (Math.PI * 2);
			var ballPos = new Point(Math.sin(angle) * radius, Math.cos(angle) * radius);
			
			this.anchorpoint = new Point(-16,-16);
			this.ball.position = this.position.add(ballPos);
			this.ball.rigidbodyActive = false;
			this.ball.zIndex = this.zIndex + 1;
			
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}
Baller.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if(this.life > 0){
		var ap = this.anchorpoint.scale(this.forward(),1);
		var linkFrame = new Point(1,3);
		
		for(var i=0; i < this.links.length; i++){
			if(i==0){
				this.links[i] = Point.lerp(this.position.add(ap),this.links[i+1],0.5);
			} else if( i+1>=this.links.length ){
				this.links[i] = Point.lerp(this.links[i-1],this.ball.position,0.5);
			} else {
				this.links[i] = Point.lerp(this.links[i-1],this.links[i+1],0.5);
			}
			
			if(i>0){
				g.renderLine(
					this.links[i-1].subtract(c),
					this.links[i].subtract(c),
					1
				);
			}
			/*
			g.renderSprite(
				this.sprite,
				this.links[i].subtract(c),
				this.zIndex - 2,
				linkFrame,
				false
			);
			*/
		}
	}
}

BallerBall.prototype = new GameObject();
BallerBall.prototype.constructor = GameObject;
function BallerBall(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "baller";
	this.damage = 0;
	this.strikeable = false;
	this.reflect = false;
	this.owner = false;
	this.zIndex = 1;
	
	this.strikeBox = this.bounds().transpose(this.position.scale(-1.0));
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.defencePhysical = 99;
	this.defenceFire = 99;
	this.defenceSlime = 99;
	this.defenceIce = 99;
	this.defenceLight = 99;
	
	this.on(["hurt_other","blocked"], function(obj, damage){
		this.force.x = 0;
		this.force.y = Math.max(this.force.y, 0);
	});
	this.on("collideObject", function(obj){
		if(this.reflect && obj === this.owner){
			this.reflect = false;
			obj.hurt(this,obj.lifeMax);
		}
	});
	this.on("hurt", function(obj, damage){
		audio.play("hurt", this.position);
	});
	this.on("struck", function(obj) {
		if(this.strikeable && obj instanceof Player){
			this.reflect = true;
		}
	});
	
	this.lifeMax = this.life = Number.MAX_SAFE_INTEGER;
	this.damageReduction = 0.9999999;
	this.mass = 3.0;
	this.friction = 0.04;
	this.gravity = 0;
	this.pushable = false;
	
	this.frame.x = 0
	this.frame.y = 3;
}

BallerBall.prototype.update = function(){
	if( this.damage > 0 && !this.reflect) {
		this.strike( this.strikeBox );
	}
}