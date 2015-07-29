Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	this.blockable = true;
	this.range = 512;
	
	this.delay = 0;
	
	this.effect = null;
	this.effect_time = 0;
	
	this.attackEffects = {
		"slow" : [0,10],
		"poison" : [0,10],
		"cursed" : [0,15],
		"weaken" : [0,30],
		"bleeding" : [0,30],
		"rage" : [0,30]
	};
	
	this.speed = 6.0;
	this.sprite = sprites.bullets;
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !this.blockable ) {
				obj.hurt( this, this.damage );
			} else {
				if( "_shield" in obj && game.overlaps(this.bounds()).indexOf(obj._shield) > -1 ){
					obj.trigger("block",this,this.position,this.damage);
				} else {
					obj.hurt( this, this.damage );
				}
				
			}
			this.trigger("death");
		} 
	});
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy();});
	this.on("struck", function(obj){ 
		if(this.blockable && obj.team!=this.team) {
			this.trigger("death");
			audio.play("slash");
			game.slow(0,Game.DELTASECOND*0.1);
		}
	});
	
	this.team = 0;
	this.damage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
}
Bullet.prototype.update = function(){
	this.range -= this.force.length() * this.delta;
	this.flip = this.force.x < 0;
	if( this.range <= 0 ) this.destroy();
	
	if( this.delay > 0 ) {
		this.deltaScale = 0.0;
		this.delay -= this.deltaUnscaled;
		if( this.delay <= 0 ) this.deltaScale = 1.0;
	}
	
	if(this.frames != undefined ) {
		var f = ( 99999 - this.range) % this.frames.length;
		this.frame = this.frames[Math.floor(f)];
	}
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
	}
}

Fire.prototype = new GameObject();
Fire.prototype.constructor = GameObject;
function Fire(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	this.team = 0;
	this.damage = 10;
	this.pushable = false;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = sprites.bullets;
	this.frame = 0;
	this.frame_row = 3;
	this.life = Game.DELTASECOND * 8;
	
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.life = 0;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		this.life = 0;
		if( obj.hurt instanceof Function ) 
			obj.hurt( this, this.damage );
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
Fire.prototype.update = function(){
	this.frame = (this.frame + (this.delta * 0.3)) % 2;
	this.life -= this.delta;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

ExplodingEnemy.prototype = new GameObject();
ExplodingEnemy.prototype.constructor = GameObject;
function ExplodingEnemy(x,y, direction, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	this.speed = ops.speed || 20;
	this.sprite = ops.sprite || sprites.bullets;
	this.frame = ops.frame || 0;
	this.frame_row = ops.frame_row || 0;
	this.flip = ops.flip || false;
	this.filter = ops.filter || "hurt";
	
	this.addModule( mod_rigidbody );
	
	this.gravity = 0.1;
	this.friction = 0;
	this.pushable = false;
	this.launch = false;
	this.force = direction.normalize(this.speed);
	
	this.life = Game.DELTASECOND * 0.5;

	this.on("collideVertical", function(obj){ this.life = 0; });
	this.on("collideHorizontal", function(obj){ this.life = 0; });
		
	this.on("collideObject", function(obj){
		if( this.launch && obj.hurt instanceof Function && this.team != obj.team ) {
			this.life = 0;
			obj.hurt( this, this.damage );
		}
	});
	this.on("death", function(){
		game.addObject(new Explosion(
			this.position.x, 
			this.position.y,
			null,
			{"damage" : Math.floor( this.damage * 0.6666 ) }
		));
		this.destroy();
	});
}
ExplodingEnemy.prototype.idle = function(){}
ExplodingEnemy.prototype.update = function(){
	this.life -= this.delta;
	this.launch = true;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

Explosion.prototype = new GameObject();
Explosion.prototype.constructor = GameObject;
function Explosion(x,y, d, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.width = 96;
	this.height = 96;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	
	this.sprite = sprites.explosion;
	
	this.totalTime = Game.DELTASECOND * 0.5;
	this.time = this.totalTime;

	this.on("collideObject", function(obj){
		if( obj.hurt instanceof Function && this.team != obj.team ) {
			obj.hurt( this, this.damage );
		}
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
	
	try{
		//Shake screen
		var dir = this.position.subtract(_player.position).normalize(20);
		window.shakeCamera(dir);
	} catch (err) {}
}
Explosion.prototype.idle = function(){}
Explosion.prototype.update = function(){
	var progress = 1.0 - (this.time / this.totalTime);
	
	this.frame = Math.floor( progress * 8 ) % 4;
	this.frame_row = Math.floor( progress * 2 );
	
	this.time -= this.delta;
	if( this.time <= 0 ){
		this.trigger("death");
	}
}

Explosion.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this, [g,c]);
	
	var progress = this.time / this.totalTime;
	Background.pushLight( this.position.subtract(c), 360 * progress );
}