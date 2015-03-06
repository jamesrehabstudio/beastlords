EffectExplosion.prototype = new GameObject();
EffectExplosion.prototype.constructor = GameObject;
function EffectExplosion(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 2;
	this.sprite = sprites.bullets;
	
	this.speed = 0.3;	
	audio.play("explode2");
}

EffectExplosion.prototype.update = function(){
	this.frame = this.frame + (this.speed * game.deltaUnscaled);
	this.frame_row = 1;
	
	if(this.frame >= 3) this.destroy();
}

EffectSmoke.prototype = new GameObject();
EffectSmoke.prototype.constructor = GameObject;
function EffectSmoke(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 2;
	this.sprite = sprites.bullets;
	this.time = Game.DELTASECOND * Math.max(Math.random(),0.7);
	this.speed = 1 + Math.random()*0.3;
}

EffectSmoke.prototype.update = function(){
	this.frame = 0;
	this.frame_row = 2;
	this.time -= game.deltaUnscaled;
	
	this.position.y -= game.deltaUnscaled * this.speed;
	
	if(this.time <=0 ) this.destroy();
}