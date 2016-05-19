GhostChort.prototype = new GameObject();
GhostChort.prototype.constructor = GameObject;
function GhostChort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = "pigboss";
	this.speed = .9;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = Spawn.life(26,this.difficulty);
	this.collideDamage = 5;
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(6,this.difficulty);
	
	this.mass = 6.0;
	this.gravity = 0.4;
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 100.0,
		"bounce" : 0.0,
		"bounceCount" : 0,
		"direction" : 1.0,
	}
	
	this.attack_times = {
		"warm" : 24,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			//else
			//	obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Quests.set("q2","complete");
		
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
}
GhostChort.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.active ) {
		if( this.states.bounce > 0 ) {
			if( this.grounded ) {
				this.collideDamage = 5;
				this.criticalChance = 0.0;
				if( this.states.bounceCount > 0 ) {
					this.force.y = -9;
					this.states.bounceCount--;
				} else {
					this.states.bounce -= this.delta;
				}
			} else {
				if( this.force.y < 0 ) {
					//Target player
					this.force.x += ( dir.x > 0 ? -1 : 1 ) * this.speed * this.delta * 0.5;
				} else {
					this.collideDamage = this.landDamage;
					this.criticalChance = 1.0;
				}
			}
		} else {
			if( this.states.attack > 0 ) {
				//Swing at player
				this.states.attack -= this.delta;
			} else if( Math.abs(dir.x) < 32 ) {
				//Start punch
				this.states.attack = this.attack_times.warm;
				this.force.x = 0;
			} else {
				//Walking phase
				if(this.position.x - this.start_x < -64 ) this.states.direction = 1;
				if(this.position.x - this.start_x > 64 ) this.states.direction = -1;
				
				this.flip = dir.x > 0;
				this.force.x = this.speed * this.states.direction * this.delta;
				this.states.cooldown -= this.delta;
				if( this.states.cooldown <= 0 ){
					this.states.bounce = Game.DELTASECOND * 3;
					this.states.bounceCount = 3 + Math.floor(Math.random() * 3);
					this.states.cooldown = Game.DELTASECOND * (2+(Math.random()*3));
				}
			}
		}
		
		if( this.states.attack <= this.attack_times.release && this.states.attack > this.attack_times.cool ) {
			this.strike( new Line(12,-6,32,10) );
		}
	}
	
	/* animation */
	
	//28, 48
	if( this.states.bounce > 0 ) {
		this.width = 48;
		this.frame_row = 1;
		this.frame = 1;
		if( this.grounded ) {
			this.frame = 3;
		} else if ( this.force.y < 0 ) {
			this.frame = 2;
		}
	}else if ( this.states.attack > 0 ){
		this.width = 28;
		this.frame_row = 2; 
		this.frame = 0; 
		if( this.states.attack <= this.attack_times.release ) this.frame = 1;
		if( this.states.attack <= this.attack_times.cool ) this.frame = 2;
	} else {
		this.width = 28;
		this.frame = (this.frame + this.delta * 0.3 * Math.abs(this.force.x)) % 3;
		this.frame_row = 0;
	}
}

GhostChort.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), 180 );
}