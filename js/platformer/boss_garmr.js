Garmr.prototype = new GameObject();
Garmr.prototype.constructor = GameObject;
function Garmr(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.garmr;
	this.speed = 1.8;
	
	this.active = false;
	this.closeToBoss = false;
	
	this.projection = new Point(x,y);
	this.projection_frame = 0;
	this.projection_frame_row = 0;
	this.projection_flip = false;
	this.projection_goto = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 2;
	this.bossface_frame_row = 0;
	
	this.states = {
		"troll_cooldown" : Game.DELTASECOND * 16,
		"troll_timer" : 0,
		"troll_release" : false,
		"cooldown" : 0,
		"attack_type" : 1,
		"fireballCount" : new Timer(0, Game.DELTASECOND * 0.1)
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.mass = 5.0;
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("activate", function() {
		var dir = this.position.subtract( _player.position );
		_player.force.x = (dir.x > 0 ? -1 : 1) * 4;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,40);
		this.destroy();
	});
	this.calculateXP();
}
Garmr.prototype.update = function(){	
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		this.closeToBoss = false;
		
		if( this.active ) {
			
			if( this.states.attack_type == 0 ) {
				//Fire missiles at player
				
			} else if ( this.states.attack_type == 1 ) {
				//Fire wall of bullets at player
				
				if( this.states.fireballCount.time <= 0 ) {
					//Break cycle
					this.states.fireballCount.set( Game.DELTASECOND * 10 );
					this.projection_goto.y = _player.position.y - 16;
					this.projection_flip = dir.x > 0;
				} else if( this.states.fireballCount.status(this.delta) ) {
					for(var i= 0; i < 2; i++){
						var pos = Math.sin( this.states.fireballCount.time * 0.075 );
						var bullet = new PhantomBullet(this.projection.x, pos*32 + this.projection.y + i * 72 - 36);
						
						bullet.force.x = this.projection_flip ? -4 : 4;
						bullet.force.y = 0;
						game.addObject( bullet );
						
					}
				}
				
			} else if ( this.states.attack_type == 2 ) {
				//Fire rods down at player
				
			}
			
			this.projection = Point.lerp(this.projection, this.projection_goto, this.delta * 0.01);
		} else {
			//Troll player
			if( Math.abs( dir.x ) < 240 && Math.floor(_player.position.y/256) == Math.floor(this.position.y/256)){
				this.projection.x = this.position.x;
				this.projection.y = this.position.y - 80;
				this.closeToBoss = true;
			} else if( this.states.troll_timer > 0 ){
				if( this.states.troll_timer < Game.DELTASECOND * 3 && !this.states.troll_release ){
					this.states.troll_release = true;
					var bullet = new Bullet(this.projection.x, this.projection.y);
					bullet.force = _player.position.subtract(this.projection).normalize(8);
					bullet.blockable = false;
					bullet.damage = this.damage;
					bullet.effect = EffectSmoke;
					bullet.team = this.team;
					game.addObject(bullet);
				}
				this.states.troll_timer -= this.delta;
				this.states.troll_cooldown = Game.DELTASECOND * (15+Math.random()*10);
			} else {
				if( this.states.troll_cooldown <= 0 ) {
					this.states.troll_release = false;
					this.states.troll_timer = Game.DELTASECOND * 6;
					this.projection.x = _player.position.x + (_player.flip ? -80 : 80);
					this.projection.y = Math.floor(this.position.y/256)*256 + 80;
				}
				this.states.troll_cooldown -= this.delta;
			}
		}
	}
	
	/* Animation */
	this.frame = 0;
	this.frame_row = 3;
	if( this.active ) {
		this.projection_frame = Math.max( (this.projection_frame + this.delta * 0.3) % 3, 1);
		this.projection_frame_row = 2;
	} else if( this.closeToBoss ){
		this.projection_frame = 0;
		this.projection_frame_row = 2;
	} else if( this.states.troll_timer > Game.DELTASECOND * 3 && this.states.troll_timer < Game.DELTASECOND * 4 ) {
		this.projection_frame = 0;
		this.projection_frame_row = 1;
	} else {
		this.projection_frame = (this.projection_frame + (this.delta * 0.2)) % 3;
		this.projection_frame_row = 0;
	}
}
Garmr.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	try {
		if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
			var flip = this.projection.x - _player.position.x > 0;
			this.sprite.render(g,this.projection.subtract(c),this.projection_frame,this.projection_frame_row, this.projection_flip);
		}
	} catch (err){}
}
Garmr.prototype.idle = function(){}