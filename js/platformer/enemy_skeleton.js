Skeleton.prototype = new GameObject();
Skeleton.prototype.constructor = GameObject;
function Skeleton(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "skele";
	this.speed = .3;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	this.guard.active = true;
	
	this.attacktimes = {
		"warm" : 30.0,
		"release" : 14.0,
		"rest" : 10.0
	};
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(5,this.difficulty);
	this.mass = 0.8;
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.stun_time = 0;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ){
			if( !this.grounded && this.position.y < obj.position.y ) 
				obj.hurt( this, this.damage );
			//else 
			//	obj.hurt( this, this.collideDamage );
		}
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if(this.team == obj.team) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = 30.0;
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Skeleton.prototype.update = function(){	
	this.sprite = "skele";
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -10.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attacktimes.warm;
			this.states.cooldown = Game.DELTASECOND;
		}
		
		if ( this.states.attack > this.attacktimes.rest && this.states.attack <= this.attacktimes.release ){
			this.strike(new Line(
				new Point( 12, -6 ),
				new Point( 24, -10 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame.x = 0;
		this.frame.y = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame.x = 0;
			if( this.states.attack <= this.attacktimes.release ) this.frame.x = 1;
			if( this.states.attack <= this.attacktimes.rest ) this.frame.x = 2;
			this.frame.y = 1
		} else if( !this.grounded ) {
			this.frame.x = 3;
			this.frame.y = 1;
		} else {
			this.frame.y = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame.x = (this.frame.x + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4;
			}
		}
	}
}
Skeleton.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(4,0),this.flip);
}