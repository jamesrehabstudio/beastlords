Skeleton.prototype = new GameObject();
Skeleton.prototype.constructor = GameObject;
function Skeleton(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.skele;
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
	
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = 20;
	this.mass = 0.8;
	this.damage = 15;
	this.collideDamage = 8;
	this.stun_time = 0;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( (this.states.block_down && dir.y < 0) || (!this.states.block_down && dir.y > 0) ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -1 : 1) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = 30.0;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(4);
		audio.play("kill");
		this.destroy();
	});
}
Skeleton.prototype.update = function(){	
	this.sprite = sprites.skele;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -8.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attack_warm;
			this.states.cooldown = Game.DELTASECOND;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time ){
			this.strike(new Line(
				new Point( 12, -6 ),
				new Point( 20, -10 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_time ? 2 : (this.states.attack < this.attack_time*1.5 ? 1 : 0);
			this.frame_row = 1
		} else if( !this.grounded ) {
			this.frame = 3;
			this.frame_row = 1;
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4, 1 );
			}
		}
	}
}