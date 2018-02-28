BigBones.prototype = new GameObject();
BigBones.prototype.constructor = GameObject;
function BigBones(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 40;
	this.sprite = "bigbones";
	this.speed = .3;
	this.active = true;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	//this.guard.active = true;
	
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
	if( "active" in o ) {
		this.active = o.active.toLowerCase() == "true";
	}
	if( "flip" in o ) {
		this.flip = o.flip.toLowerCase() == "true";
	}
	
	this.life = Spawn.life(9,this.difficulty);
	this.mass = 2.0;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(7,this.difficulty);
	this.stun_time = Game.DELTASECOND * 0.25;
	
	
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
BigBones.prototype.update = function(){	
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
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
				new Point( 12, -1 ),
				new Point( 32, 3 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 3;
	} else { 
		if( this.states.attack > this.attacktimes.rest ) {
			if( this.states.attack <= this.attacktimes.release ) {
				this.frame_row = 1;
				this.frame = 1;
			} else { 
				this.frame_row = 0;
				var progress = (this.attacktimes.warm - this.states.attack) / Math.abs(this.attacktimes.release-this.attacktimes.warm);
				this.frame = Math.floor(progress * 4);
			}
		} else {
			var progress = (1000-this.states.cooldown*0.1) % 6;
			this.frame = (progress+2) % 4;
			this.frame_row = progress >= 2 ? 2 : 1;
		}
	}
}
BigBones.prototype.render = function(g,c){
	this.sprite.render(g,this.position.subtract(c),4,0,this.flip);
	GameObject.prototype.render.apply(this,[g,c]);
}