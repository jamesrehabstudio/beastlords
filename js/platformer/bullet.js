Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.rotation = undefined;
	this.width = 10;
	this.height = 6;
	this.blockable = true;
	this.strikable = true;
	this.ignoreInvincibility = false;
	this.explode = false;
	this.range = 512;
	this.wallStop = true;
	
	this.delay = 0;
	
	this.effect = null;
	this.effect_time = 0;
	
	this.controlAI = function(){}
	
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
	this.on("collideVertical", function(dir){ if(this.wallStop){ this.trigger("death"); } });
	this.on("collideHorizontal", function(dir){ if(this.wallStop){ this.trigger("death"); } });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy(); });
	this.on("hurt_other", function(obj, damage){});
	this.on("kill", function(obj){ if(this.owner) { this.owner.trigger("kill", obj); } } );
	this.on("struck", function(obj){ 
		if(this.strikable && obj.team!=this.team) {
			this.trigger("deflect");
			this.trigger("death");
			audio.play("block");
			game.slow(0,Game.DELTAFRAME30);
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
Bullet.prototype.setDeflect = function(){
	this.on("deflect", function(){
		var rag = new Ragdoll(this.position.x, this.position.y);
		rag.force = this.force.scale(-0.5);
		rag.width = rag.height = 12;
		rag.sprite = this.sprite;
		rag.frame = this.frame;
		rag.rotationSpeed = 3.0;
		game.addObject(rag);
	});
}
Bullet.prototype.update = function(){
	this.trigger("preupdate");
	this.range -= this.force.length() * this.delta;
	if(this.rotation == undefined){
		this.flip = this.force.x < 0;
	}
	if( this.range <= 0 ) { this.destroy(); }
	
	if( this.delay > 0 ) {
		this.deltaScale = 0.0;
		this.delay -= this.deltaUnscaled;
		if( this.delay <= 0 ) this.deltaScale = 1.0;
	}
	
	if(this.frames != undefined ) {
		var f = ( (99999 - this.range) * 3.0 ) % this.frames.length;
		this.frame.x = this.frames[Math.floor(f)];
	}
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y + 6) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
	}
	if(this.light){
		Background.pushLight( this.position, this.light, this.lightColor );
	}
}

Bullet.hit = function(obj){
	if( obj.hasModule(mod_combat) && obj.combat_shootable && this.team != obj.team ) {
		
		if( !this.blockable ) {
			
			if(this.ignoreInvincibility){
				obj.invincible = 0.0;
			}
			
			obj.hurt( this, Combat.getDamage.apply(this) );
			
			this.trigger("death");
		} else {
			var flip = obj.flip ? -1:1;
			var shield = new Line(
				obj.position.x + (obj.guard.x) * flip,
				obj.position.y + (obj.guard.y),
				obj.position.x + (obj.guard.x + obj.guard.w) * flip,
				obj.position.y + (obj.guard.y + obj.guard.h)
			);
			
			let blocked = false;
			let sareas = obj.combat_shieldArea();
			
			for(let i=0; i < sareas.length; i++){
				if( sareas[i].overlaps( this.bounds() ) ){
					this.trigger("blocked",obj);
					obj.trigger("block",this,this.bounds(),this.damage);
					blocked = true;
					break;
				}
			}
			
			if(!blocked){
				if(this.ignoreInvincibility){ obj.invincible = 0.0; }
				
				if(obj.invincible <= 0){
					
					obj.hurt( this, Combat.getDamage.apply(this) );
				}
			}
			
			this.trigger("death");
		}
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
			"rotate" : this.rotation || 0
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
	
	bullet.on("death", function(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
	});
	
	return bullet;
}
Bullet.createHomingMissile = function(x,y,ops){
	ops = ops || new Options();
	var missile = new Bullet(x,y);
	missile.frame = new Point(3,3);
	missile.blockable = false;
	missile.light = 48;
	missile.lightColor = COLOR_WHITE;
	missile.team = ops.getInt("team", 0);
	missile.damage = ops.getInt("damage", 10);
	missile.rotation = ops.getFloat("rotation", 0.0);
	missile.speed = ops.getFloat("speed", 5.0);
	missile.sleepTime = Game.DELTASECOND * ops.getFloat("sleepTime", 0.6);
	missile.turnSpeed = ops.getFloat("turnSpeed", 90.0);
	missile.target = _player;
	missile.setDeflect();
	
	missile.on("death", function(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
	});
	
	missile.on("preupdate", function(){
		if(this.sleepTime > 0){
			this.sleepTime -= this.delta;
			this.gravity = 0.125;
		} else {
			this.gravity = 0.0;
			let targetdif = this.target.position.subtract(this.position);
			let angle = Math.atan2(targetdif.y, targetdif.x) * Math.rad2deg;
			let rdif = Math.sdif(angle, this.rotation);
			
			if(Math.abs(rdif) > this.turnSpeed * this.delta){
				let rdir = rdif > 0 ? 1 : -1;
				this.rotation += rdir * this.turnSpeed * this.delta;
			} else {
				this.rotation = angle;
			}
			let radAngle = this.rotation * Math.deg2rad;
			this.force.x = Math.cos(radAngle) * this.speed;
			this.force.y = Math.sin(radAngle) * this.speed;
		}
	});
	
	return missile;
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
	this.friction = new Point();
	this.gravity = 1.0;
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
	
	o = Options.convert(o);
	if(d instanceof Array && d.length >= 2){
		this.width = d[0] * 1;
		this.height = d[1] * 1;
	}
}
PhantomBullet.prototype.update = function(){
	this.position.x += this.force.x * UNITS_PER_METER * this.delta;
	this.position.y += this.force.y * UNITS_PER_METER * this.delta;
	
	this.force.y += this.gravity * UNITS_PER_METER * this.delta;
	this.force.x *= 1 - (this.friction.x * UNITS_PER_METER * this.delta);
	this.force.y *= 1 - (this.friction.y * UNITS_PER_METER * this.delta);
	
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
	
	this.smokeFrequency = 0.2 + Math.random() * 0.05;
	this._smokeTimer = Math.random() * this.smokeFrequency;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("struck", function(obj, pos, damage){
		if( obj instanceof Player ) {
			this.life = 0;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		
		if( obj.hurt instanceof Function ) {
			this.life = 0;
			obj.hurt( this, Combat.getDamage.apply(this) );
		}
	});
	this.on("death", function(){
		this.destroy();
	});
}
Fire.prototype.update = function(){
	Background.pushLight( this.position, 48, [1,0.8,0,1] );
	
	this.frame.x = (this.frame.x + (this.delta * 15.0)) % 3;
	this.life -= this.delta;
	
	if( this.life <= 0 ){
		this.trigger("death");
	}
	
	this._smokeTimer += this.delta;
	if(this._smokeTimer >= this.smokeFrequency) {
		//Produce smoke
		Background.pushSmoke( this.position, 16, new Point(Math.random()-0.5, -5) );
		this._smokeTimer -= this.smokeFrequency;
	}
}

class FallingSpike extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = game.map.tileset;
		this.origin = new Point();
		this.team = 0;
		
		this.damageFixed = 12;
		
		this.frame = new Point(14,8);
		
		
		
		this.on("collideVertical", function(v){
			if( v > 0 ){
				this.destroy();
			}
		});
		this.on("sleep", function(){
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_combat) && obj.team != this.team ){
				obj.hurt( this, Combat.getDamage.apply(this) );
			}
		});
		
		this.addModule( mod_rigidbody );
		
		this.pushable = false;
		this.force = new Point();
		this.gravity = 0.0;
		this._time = 1.0;
	}
	update(){
		if(this._time <= 0 ){
			this.gravity = 0.5;
		} else {
			this._time -= this.delta;
		}
	}
	render(g,c){
		if( this._time > 0){
			c = c.add( new Point(Math.randomRange(-1,1),0).round() );
		}
		super.render(g,c);
	}
}

ExplodingEnemy.prototype = new GameObject();
ExplodingEnemy.prototype.constructor = GameObject;
function ExplodingEnemy(x,y, d, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.startPos = new Point(x,y);
	this.width = 24;
	this.height = 24;
	this.team = 1;
	
	this.owner = ops.owner || null;
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
	this.ignoreList = new Array();
	
	this.life = Game.DELTASECOND * 0.5;

	this.on("collideVertical", function(obj){ this.life = 0; });
	this.on("collideHorizontal", function(obj){ this.life = 0; });
	this.on("kill", function(obj){ if(this.owner) { this.owner.trigger("kill", obj); } } );
		
	this.on("collideObject", function(obj){
		if( this.ignoreList.indexOf(obj) >= 0){
			return;
		}
		
		if( this.launch && obj.hurt instanceof Function && this.team != obj.team ) {
			this.ignoreList.push( obj );
			
			obj.hurt( this, this.damage );
			
			createExplosion(this.position, 32 );
			game.slow(0, 0.25);
		}
	});
	this.on("death", function(){
		/*
		game.addObject(new Explosion(
			this.position.x, 
			this.position.y,
			null,
			{"damage" : Math.floor( this.damage * 0.6666 ) }
		));
		*/
		createExplosion(this.position, 64 );
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
ExplodingEnemy.prototype.render = function(g,c){
	let midPoint = this.position.add(this.startPos).scale(0.5);
	let lengthPoint = this.position.subtract(this.startPos);
	let distance = lengthPoint.length();
	let height = (this.life / (Game.DELTASECOND * 0.5)) * 24;
	let rotate = (Math.atan2(lengthPoint.y,lengthPoint.x)/ Math.PI) * 180;
	
	g.renderSprite("halo",midPoint.subtract(c),this.zIndex,new Point(),false,{"scalex":distance/240,"scaley":height/240,"rotate":rotate});
	GameObject.prototype.render.apply(this,[g,c]);
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


class CarpetBomb extends GameObject{
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.height = 12;
		this.width = 12;
		this.sprite = "bullets";
		this.frame = new Point(5,1);
		
		this.damage = 0;
		this.damageFire = 10;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		
		this.addModule(mod_rigidbody);
		this.gravity = 0.4;
		this.pushable = false;
		this.friction = 0.02;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt(this);
				game.addObject(new EffectBang(this.position.x, this.position.y));
				this.destroy();
			}
		});
		this.on("collideHorizontal", function(h){
			//Hit wall, explode into flames
			this.burst();
			this.destroy();
		});
		this.on("collideVertical", function(v){
			if(v > 0){
				//Hit floor, spread fire
				this.spread();
				this.destroy();
			} else {
				this.burst();
				this.destroy();
			}
		});
		this.on("sleep",function(){
			this.destroy();
		});
	}
	
	spread(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
		
		for(let i=0; i < 3; i++){
			for(let j=0; j < 2; j++){
				let offset = (j > 0 ? -1 : 1) * (i+0.5) * 32;
				var ftower = new FlameTower(this.position.x + offset, this.position.y);
				ftower.damageFire = this.damageFire;
				ftower.time = Game.DELTASECOND * i * -0.2;
				game.addObject(ftower);
			}
		}
	}
	
	burst(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
		
		for(let i=0; i < 6; i++){
			var fire = new Fire(this.position.x, this.position.y);
			fire.force = new Point(Math.random(), Math.random()).normalize(6);
			game.addObject(fire);
		}
	}
	
	render(g,c){
		let rot = Math.atan2(this.force.y, this.force.x) * Math.rad2deg;
		this.frame.x = 5 + (game.time*0.5) % 3;
		
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{
			"rotate" : rot
		});
	}
}
self["CarpetBomb"] = CarpetBomb;

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
		"wait" : Game.DELTASECOND * 0.0,
		"active" : Game.DELTASECOND * 0.5,
		"destroy" : Game.DELTASECOND * 0.9
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