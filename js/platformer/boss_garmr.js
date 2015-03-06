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
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.states = {
		"troll_cooldown" : Game.DELTASECOND * 16,
		"troll_timer" : 0,
		"troll_release" : false,
		"cooldown" : 0
	}
	
	this.life = 1;
	this.mass = 5.0;
	this.damage = 25;
	this.collideDamage = 25;
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(65);
		audio.play("kill");
		
		Item.drop(this,40);
		this.destroy();
	});
}
Garmr.prototype.update = function(){	
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		this.closeToBoss = false;
		
		if( this.active ) {
			//Boss fight
			this.flip = dir.x > 0;
			_player.force.x += (this.flip ? -1 : 1) * 0.55;
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ){
				this.states.cooldown = Game.DELTASECOND * 0.6;
				var offset = Math.random() > 0.5 ? -8 : 10;
				var bullet = new Bullet(this.position.x, this.position.y + offset);
				bullet.blockable = true;
				bullet.team = this.team;
				bullet.force = new Point((this.flip?-1:1)*3, 0);
				game.addObject(bullet);
			}
			this.projection.x = this.position.x;
			this.projection.y = this.position.y - 64;
		} else {
			//Troll player
			if( Math.abs( dir.x ) < 240 ){
				this.projection.x = this.position.x;
				this.projection.y = this.position.y - 64;
				this.closeToBoss = true;
			} else if( this.states.troll_timer > 0 ){
				if( this.states.troll_timer < Game.DELTASECOND * 3 && !this.states.troll_release ){
					this.states.troll_release = true;
					var bullet = new Bullet(this.projection.x, this.projection.y);
					bullet.force = _player.position.subtract(this.projection).normalize(8);
					bullet.blockable = false;
					bullet.collideDamage = 30;
					bullet.team = this.team;
					game.addObject(bullet);
				}
				this.states.troll_timer -= this.delta;
				this.states.troll_cooldown = Game.DELTASECOND * (20+Math.random()*20);
			} else {
				if( this.states.troll_cooldown <= 0 ) {
					this.states.troll_release = false;
					this.states.troll_timer = Game.DELTASECOND * 6;
					this.projection.x = _player.position.x + (_player.flip ? -80 : 80);
					this.projection.y = _player.position.y - 128;
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
	
	if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
		var flip = this.projection.x - _player.position.x > 0;
		this.sprite.render(g,this.projection.subtract(c),this.projection_frame,this.projection_frame_row, flip);
	}
}
Garmr.prototype.idle = function(){}