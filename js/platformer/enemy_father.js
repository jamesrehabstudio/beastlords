Father.prototype = new GameObject();
Father.prototype.constructor = GameObject;
function Father(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.characters;
	this.speed = 0.05;
	this.active = false;
	
	this.limit = 512;
	this.start_x = x;
	this.addModule( mod_rigidbody );
	this.temple = dataManager.temples[Math.max(dataManager.currentTemple,0)];
	
	this.states = {
		"cooldown" : Game.DELTASECOND,
		"touch" : 0,
		"direction" : 1
	};
	
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		
	});
	this.on("player_death", function(){
		this.active = false;
	});
}
Father.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.active ) {
		this.force.x += this.delta * this.states.direction * this.speed;
		
		if( Math.abs( dir.x ) < 64 ){
			var force_push = (64-Math.abs( dir.x ))/24;
			_player.force.x += this.delta * force_push * this.states.direction * -1.0;
			this.states.cooldown -= this.delta;
		}
		
		if( this.states.direction > 0 ) {
			if(this.position.x-this.start_x > this.limit) this.destroy();
		} else {
			if(this.position.x-this.start_x < -this.limit) this.destroy();
		}
		
		if( this.states.cooldown <= 0 ) {
			//Spawn Monster
			this.states.cooldown = Game.DELTASECOND * 4;
			var monster_list = dir.y > 32 ? this.temple.minorfly : this.temple.majormonster;
			var name = monster_list[Math.floor(monster_list.length*Math.random())];
			var enemy = new window[name]((this.position.x+_player.position.x)*0.5, (this.position.y+_player.position.y)*0.5);
			enemy.on("sleep", function(){ this.destroy(); });
			game.addObject(enemy);
			game.addObject(new EffectSmoke(this.position.x,this.position.y));
		}
		this.states.cooldown -= this.delta;
	} else {
		if( Math.abs(dir.x) < 128 && Math.abs(dir.y) < 64 ) {
			this.active = true;
			this.states.direction = dir.x > 0 ? 1 : -1;
			this.flip = this.states.direction < 0;
		}
		var _dir = _player.position.x > this.start_x ? 1 : -1;
		this.position.x = this.start_x + (this.limit - 32)*_dir;
	}
	
	this.frame = (this.frame + this.delta * 0.2 * Math.abs(this.force.x)) % 3;
	this.frame_row = 0;
}
Father.prototype.idle = function(){}