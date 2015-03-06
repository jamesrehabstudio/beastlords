Igbo.prototype = new GameObject();
Igbo.prototype.constructor = GameObject;
function Igbo(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 46;
	this.sprite = sprites.igbo;
	this.speed = 0.3;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"backup" : 1
	}
	
	this.attack_warm = Game.DELTASECOND * 2.5;
	this.attack_time = Game.DELTASECOND * 1.5;
	this.attack_rest = Game.DELTASECOND * 1.4;
	
	this.life = 120;
	this.damage = 20;
	this.collideDamage = 10;
	this.mass = 3.0;
	this.friction = 0.3;
	this.inviciple_time = this.stun_time;
	
	this.cooldown_time = Game.DELTASECOND * 1.6;
	
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	/*
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	*/
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		this.states.cooldown -= 20;
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,40);
		_player.addXP(45);
		audio.play("kill");
		this.destroy();
	});
}
Igbo.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack <= 0 ) {
			var direction = 1;
			
			if( this.position.x - this.start_x > 48 ) this.states.backup = -1;
			if( this.position.x - this.start_x < -48 ) this.states.backup = 1;
			
			var direction = this.states.backup;
			if( Math.abs( dir.x ) < 32 ) direction = dir.x > 0 ? 1 : -1;
			
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
		
		if( Math.abs( dir.x ) < 32 && this.states.attack <= 0 ) {
			this.states.attack = this.attack_time;
			this.states.attack_down = true;
		}
		
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 48 ){
			this.states.attack_down = false;
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if ( this.states.attack > this.attack_rest && this.states.attack < this.attack_time ){
			var range = this.states.attack_down ? 20 : 35;
			this.strike(new Line(
				new Point( 10, (this.states.attack_down ? 0: 0) ),
				new Point( range, (this.states.attack_down ? 8 : 24) ) ), 
				this.states.attack_down ? "struck" : "hurt"
			);
		}
	}
	
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = 0;
		if( this.states.attack <= this.attack_time ) this.frame = 1;
		if( this.states.attack <= this.attack_rest ) this.frame = 2;
		this.frame_row = (this.states.attack_down ? 2 : 1);
	} else {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3;
		} else {
			this.frame = 0;
		}
		this.frame_row = 0;
	}
}
/*
Igbo.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 3 : 4 ), this.fr_offset, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
}
*/