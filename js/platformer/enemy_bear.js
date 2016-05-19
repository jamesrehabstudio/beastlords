Bear.prototype = new GameObject();
Bear.prototype.constructor = GameObject;
function Bear(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "bear";
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_down" : false,
		"guard" : 2 //0 none, 1 bottom, 2 top
	}
	
	this.attack_warm = 40.0;
	this.attack_time = 23.0;
	this.attack_rest = 0.0;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = Math.random() > 0.6 ? 0 : 30;
		this.states.guard = Math.random() > 0.5 ? 1 : 2;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Bear.prototype.update = function(){	
	//this.sprite = "knight";
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active && this.states.attack <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 ){
			this.states.attack_down = Math.random() > 0.5;
			this.states.guard = 0;
			this.states.attack = this.attack_warm;
			this.states.cooldown = 70.0;
		}
		
		if( this.states.guard == 0 && this.states.attack <= 0 ){
			this.states.guard = Math.random() > 0.5 ? 1 : 2;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time && this.states.attack > this.attack_rest ){
			this.strike(new Line(
				new Point( 15, (this.states.attack_down ? 8 : -8) ),
				new Point( 27, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* guard */
	this.guard.active = this.states.guard != 0;
	this.guard.x = 8;
	this.guard.y = this.states.guard == 1 ? 6 : -5;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame.x = 0;
		this.frame.y = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame.x = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame.y = 1;
			this.criticalChance = 1.0;
		} else {
			this.criticalChance = 0.0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame.x = Math.max( (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4, 1 );
			} else {
				this.frame.x = 0;
			}
			this.frame.y = 0;
		}
	}
}
Bear.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		g.renderSprite(
			this.sprite,
			new Point(this.position.x - c.x, this.position.y - c.y),
			this.zIndex,
			new Point((this.states.guard > 1 ? 2 : 3 ), 2),
			this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Sword
	var _x = 0
	if( this.states.attack > 0 ){
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	}
	g.renderSprite(
		this.sprite,
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.zIndex,
		new Point(this.frame.x, this.frame.y+3),
		this.flip
	);
}