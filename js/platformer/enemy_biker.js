Biker.prototype = new GameObject();
Biker.prototype.constructor = GameObject;
function Biker(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 56;
	this.previousForceX = 0.0;
	this.start_x = x;
	
	this.speed = 0.13;
	this.sprite = "biker";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
		this.states.runaway = Game.DELTASECOND * 0.5;
	});
	this.on("collideObject", function(obj){
		if( this.states.collideCooldown > 0 || this.team == obj.team ){
			return;
		} 
		if( obj instanceof Player && obj.hurt instanceof Function ) {
			var dir = _player.position.subtract(this.position);
			if((this.force.x > 0.25 && dir.x > 0) || (this.force.x < -0.25 && dir.x < 0)){
				this.states.collideCooldown = Game.DELTASECOND;
				this.states.runaway = Game.DELTASECOND * 1.0;
				obj.hurt( this, this.collideDamage );
			}
		}
	});
	this.on("pre_death", function(obj,pos,damage){
		var body = new BikerBody(this.position.x, this.position.y);
		body.force.x = this.force.x * 2;
		body.force.y = -6;
		body.grounded = false;
		game.addObject( body );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.mass = 5.3;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"collideCooldown" : 0.0,
		"runaway" : 0.0
	};
	
	this.calculateXP();
	
}
Biker.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.previousForceX = this.force.x;
	
	if( this.life > 0 ) {
		this.flip = this.force.x < 0;
		var direction = 0;
		if(this.states.runaway > 0){
			direction = this.force.x > 0 ? 1 : -1;
		} else {
			direction = dir.x < 0 ? 1 : -1;
		}
		this.force.x += this.speed * this.delta * direction;
		this.states.collideCooldown -= this.delta;
		this.states.runaway -= this.delta;
	} else {
		this.force.x = 0;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame.x = 0;
		this.frame.y = 1;
	} else {
		if( Math.abs( this.force.x ) > 2 ) {
			if(Math.abs(this.previousForceX) > Math.abs(this.force.x)){
				this.frame.y = 0;
				this.frame.x = 1;
			} else {
				this.frame.y = 0;
				this.frame.x = 0;
			}
		} else {
			this.frame.y = 0;
			this.frame.x = 2;
		}
	}
}
Biker.prototype.idle = function(){}

BikerBody.prototype = new GameObject();
BikerBody.prototype.constructor = GameObject;
function BikerBody(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 56;
	this.sprite = "biker";
	
	this.addModule( mod_rigidbody );
	this.interactive = false;
	this.friction = 0.05;
}

BikerBody.prototype.update = function(){
	if(this.grounded){
		this.frame.x = 2;
		this.frame.y = 1;
	} else {
		this.frame.x = 1;
		this.frame.y = 1;
	}
}

//Arm Wrestler

ArmWrestler.prototype = new GameObject();
ArmWrestler.prototype.constructor = GameObject;
function ArmWrestler(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 56;
	this.sprite = "biker";
	
	this.active = false;
	this.defeated = false;
	
	this.score = 0;
	this.scoreTotal = 24;
	this.presses = 0;
	this.rate = 0.1;
	this.timebetween = 0.0;
	this.average = 0.0;
	this.time = 0.0;
	this.cry = Game.DELTASECOND;
	
	this.states = {
		"cooldown" : 0,
		"attack" : 0
	}
	
	this.addModule( mod_rigidbody );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.mass = 1;
	this.friction = 0.01;
	this.pushable = false;
	this.damage = Spawn.damage(5,this.difficulty);
	
	this.on("startwrestle", function(obj){
		this.score = this.scoreTotal * 0.5;
		this.presses = 0;
		this.rate = 0.1;
		this.timebetween = 0.0;
		this.average = 0.0;
		this.time = 0.0;
		
		//Remove the player from the world
		obj.visible = false;
		obj.deltaScale = 0.0;
	});
	this.on("stopwrestle", function(obj){
		obj.visible = true;
		obj.deltaScale = 1.0;
	});
	
	
	
	this.on("sleep", function(){
		if(this.defeated){
			this.destroy();
		}
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	})
	this.on("collideObject", function(obj){
		if(obj instanceof Player && !this.defeated && !this.active){
			this.active = true;
			this.trigger("startwrestle",obj);
		}
	});
}

ArmWrestler.prototype.update = function(){
	if ( this.active) {
		this.frame.x = Math.max((this.frame.x + this.delta * 0.5) % 6, 4);
		this.frame.y = 0;
		
		this.timebetween += this.delta;
		this.time += this.delta;
		
		var seconds = this.time / Game.DELTASECOND;
		var effort = Math.max(Math.min(1.2+Math.max(Math.sin(seconds)*.3,0)-seconds*0.05,1.4),0.1);
		
		
		this.score -= this.rate * this.delta * effort;
		
		if(input.state("fire") == 1){
			this.score += 1;
			
			if(this.presses > 0){
				this.average = (this.average*this.presses+this.timebetween) / (this.presses+1);
			} else {
				this.average = this.timebetween;
			}
			this.timebetween = 0.0;
			this.presses++;
			this.rate = Math.max(1 / this.average, 0.2);
		}
		
		if(this.score <= 0){
			this.active = false;
			_player.hurt(this,this.damage);
			_player.position.x = this.position.x + this.forward() * this.width;
			this.trigger("stopwrestle",_player);
		}
		if(this.score >= this.scoreTotal){
			this.active = false;
			this.defeated = true;
			
			audio.play("kill",this.position);
			this.grounded = false;
			this.force.y = -5;
			Item.drop(this,15);
			
			this.trigger("stopwrestle",_player);
		}
	} else if (this.defeated){
		if(this.cry <= 0){
			this.frame.x = Math.max((this.frame.x + this.delta * 0.2) % 5, 3);
			this.frame.y = 1;
		} else {
			if(this.grounded){
				this.cry -= this.delta
				this.frame.x = 2;
				this.frame.y = 1;
			} else {
				this.frame.x = 1;
				this.frame.y = 1;
			}
		}
	} else {
		this.frame.x = 3;
		this.frame.y = 0;
	}
}
ArmWrestler.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if(this.active){
		g.renderSprite(
			"player",
			this.position.add(new Point(36*this.forward(),4)).subtract(c),
			this.zIndex + 1,
			new Point(1,4),
			!this.flip
		);
	}
}
ArmWrestler.prototype.hudrender = function(g,c){
	if(this.active){
		var width = 64;
		var height = 6;
		var percent = this.score / this.scoreTotal;
		var topleft = this.position.subtract(new Point(width*0.5,40)).subtract(c);
		
		g.color = [1,1,1,1];
		g.scaleFillRect(topleft.x-1,topleft.y-1,width+2,height+2);
		
		g.color = [0,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width,height);
		
		g.color = [1,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width*percent,height);
	}
}