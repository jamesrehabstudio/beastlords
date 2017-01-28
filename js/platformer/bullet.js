Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.rotation = 0;
	this.width = 10;
	this.height = 6;
	this.blockable = true;
	this.ignoreInvincibility = false;
	this.explode = false;
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
	this.sprite = "bullets";
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
	
	this.on("collideObject", Bullet.hit);
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy(); });
	this.on("hurt_other", function(obj, damage){
		if(this.explode){
			game.addObject(new EffectBang(this.position.x, this.position.y));
			this.explode = false;
		}
	});
	this.on("struck", function(obj){ 
		if(this.blockable && obj.team!=this.team) {
			this.trigger("death");
			audio.play("slash");
			game.slow(0,Game.DELTASECOND*0.1);
		}
	});
	
	this.team = 0;
	
	this.damage = 10;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
	this.light = false;
	this.lightColor = [1,1,1,1];
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
		var f = ((99999 - this.range)*0.2) % this.frames.length;
		this.frame.x = this.frames[Math.floor(f)];
	}
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
	}
	if(this.light){
		Background.pushLight( this.position, this.light, this.lightColor );
	}
}

Bullet.hit = function(obj){
	if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
		if( !this.blockable || !obj.hasModule(mod_combat) ) {
			if(this.ignoreInvincibility){
				obj.invincible = 0.0;
			}
			obj.hurt( this, Combat.getDamage.apply(this) );
		} else {
			var flip = obj.flip ? -1:1;
			var shield = new Line(
				obj.position.x + (obj.guard.x) * flip,
				obj.position.y + (obj.guard.y),
				obj.position.x + (obj.guard.x + obj.guard.w) * flip,
				obj.position.y + (obj.guard.y + obj.guard.h)
			);
			
			if( obj.guard.active && (this.flip!=obj.flip) && shield.overlaps(this.bounds()) ){
				this.trigger("blocked",obj);
				obj.trigger("block",this,this.position,this.damage);
			} else {
				if(this.ignoreInvincibility){
					obj.invincible = 0.0;
				}
				this.trigger("hurt_other",obj);
				obj.hurt( this, Combat.getDamage.apply(this) );
			}
			
		}
		this.trigger("death");
	}
}
Bullet.prototype.render = function(g,c){
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"rotate" : this.rotation
		}
	)
}
Bullet.createFireball = function(x,y,ops){
	ops = ops || {};
	var bullet = new Bullet(x,y);
	bullet.blockable = 0;
	bullet.frames = [5,6,7];
	bullet.frame.y = 1;
	bullet.explode = true;
	bullet.light = 56;
	bullet.lightColor = COLOR_FIRE;
	bullet.damage = 0;
	bullet.damageFire = 10;
	if("team" in ops){
		bullet.team = ops.team * 1;
	}
	if("damage" in ops){
		bullet.damageFire = ops.damage * 1;
	}
	return bullet;
}

PhantomBullet.prototype = new GameObject();
PhantomBullet.prototype.constructor = GameObject;
function PhantomBullet(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 6;
	
	this.sprite = "bullets";
	this.frame = new Point(0,0);
	
	this.blockable = true;
	this.force = new Point();
	this.team = 0;
	this.time = Game.DELTASECOND * 2;
	
	this.damage = 10;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.on("collideObject", Bullet.hit);
	this.on("sleep", function(){ this.destroy(); } );
	this.on("death", function(){ this.destroy(); } );
	
	o = o || {};
	if(d instanceof Array && d.length >= 2){
		this.width = d[0] * 1;
		this.width = d[1] * 1;
	}
}
PhantomBullet.prototype.update = function(){
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	this.time -= this.delta;
	this.flip = this.force.x < 0;
	
	if(this.time <= 0){
		this.destroy();
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
	this.pushable = false;
	this.zIndex = 5;
	
	this.damage = 0;
	this.damageFire = 8;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = "bullets";
	this.frame.x = 0;
	this.frame.y = 3;
	this.life = Game.DELTASECOND * 8;
	this.mass = 0;
	this.friction = 1.0;
	this.physicsLayer = physicsLayer.particles;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.life = 0;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		
		if( obj.hurt instanceof Function ) {
			this.life = 0;
			obj.hurt( this, Combat.getDamage.apply(this) );
		}
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
Fire.prototype.update = function(){
	Background.pushLight( this.position, 48, [1,0.8,0,1] );
	
	this.frame.x = (this.frame.x + (this.delta * 0.5)) % 3;
	this.life -= this.delta;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

FallingRock.prototype = new GameObject();
FallingRock.prototype.constructor = GameObject;
function FallingRock(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.team = 0;
	this.damage = 10;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = "bullets";
	this.gravity = 0.333;
	this.pushable = false;
	this.frame.x = 3;
	this.frame.y = 0;
	
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.trigger("death");
	});
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hurt instanceof Function ){
			obj.hurt( this, this.damage );
		}
	});
	this.on("collideVertical", function(obj){ this.trigger("death");});
	this.on("collideHorizontal", function(obj){ this.trigger("death");});
	this.on("death", function(){
		audio.play("explode2");
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
FallingRock.prototype.idle = function(){}

ExplodingEnemy.prototype = new GameObject();
ExplodingEnemy.prototype.constructor = GameObject;
function ExplodingEnemy(x,y, d, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	this.speed = ops.speed || 20;
	this.sprite = ops.sprite || "bullets";
	this.frame = ops.frame || new Point(0,0);
	this.flip = ops.flip || false;
	this.filter = ops.filter || "hurt";
	this.direction = ops.direction || new Point(1,0);
	
	this.addModule( mod_rigidbody );
	
	this.gravity = 0.1;
	this.friction = 0;
	this.pushable = false;
	this.launch = false;
	this.force = this.direction.normalize(this.speed);
	
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
	
	this.sprite = "explosion";
	
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
		shakeCamera(dir);
	} catch (err) {}
}
Explosion.prototype.idle = function(){}
Explosion.prototype.update = function(){
	var progress = 1.0 - (this.time / this.totalTime);
	
	this.frame.x = Math.floor( progress * 8 ) % 4;
	this.frame.y = Math.floor( progress * 2 );
	
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

FlameTower.prototype = new GameObject();
FlameTower.prototype.constructor = GameObject;
function FlameTower(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 32;
	this.time = 0;
	
	this.damage = 0;
	this.damageFire = 10;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.flameHeight = 88;
	
	this.timers = {
		"wait" : Game.DELTASECOND,
		"active" : Game.DELTASECOND * 2.5,
		"destroy" : Game.DELTASECOND * 2.9
	};
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.time > this.timers.active) {
			obj.hurt(this,Combat.getDamage.apply(this));
		}
	});
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
}

FlameTower.prototype.update = function(){
	this.time += this.delta;
	if(this.time < this.timers.wait){
		
	}else if(this.time < this.timers.active){
		var prog = Math.min((this.time-this.timers.wait)/(this.timers.active-this.timers.wait) ,1);
		Background.pushLight( this.position, 64*Math.sin(Math.PI*prog), COLOR_FIRE );
	} else {
		var prog = Math.min((this.time-this.timers.active)/(this.timers.destroy-this.timers.active) ,1);
		var preh = this.height;
		this.height = this.flameHeight * Math.min(prog*1.5,1);
		this.rigidbodyActive = false;
		this.position.y -= 0.5 * (this.height-preh);
		Background.pushLight( this.position, this.height*2, COLOR_FIRE );
	}
	if(this.time > this.timers.destroy){
		this.destroy();
	}
}
	
FlameTower.prototype.render = function(g,c){
	if(this.time > this.timers.wait){
		var w = 0;
		var h = 0;
		if(this.time < this.timers.active){
			var prog = Math.min((this.time-this.timers.wait)/(this.timers.active-this.timers.wait) ,1);
			w = 1.5 * this.width * prog;
			h = 16 * (1 - prog);
		} else {
			//active
			w = this.width;
			h = this.height;
		}
		
		g.renderSprite(
			"effect_fire",
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"shader" : "fire",
				"u_time" : game.timeScaled * 0.01,
				"scalex" : w / 64,
				"scaley" : h / 64,
			}
		)
	} 
}