Bombjar.prototype = new GameObject();
Bombjar.prototype.constructor = GameObject;
function Bombjar(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "bombjar";
	this.speed = 3.0;
	this.zIndex = 3;
	this.blastradius = 24;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.walkcycle = 0.0;
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.xpDrop = Spawn.xp(4,this.difficulty);
	this.bounceCount = 4;
	this.mass = 1.0;
	this.death_time = 0.1;
	this.gravity = 0.5;
	this.pushable = false;
	this.flip = x > _player.position.x;
	
	this.on("collideHorizontal", function(x){
		this.force.x = -this.force.x;
		this.flip = !this.flip;
	});
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
		}
	});
	this.on("hurt", function(){
		
	});
	this.on("death", function(){
		var explosion = new EffectBang(this.position.x,this.position.y);
		game.addObject(explosion);
		
		let dir = this.target().position.subtract(this.position);
		
		var free = new BombjarFree(this.position.x, this.position.y);
		free.force = dir.normalize(-8);
		game.addObject(free);
		
		/*
		c = this.corners();
		l = new Line(
			c.left - this.blastradius, 
			c.top - this.blastradius, 
			c.right + this.blastradius, 
			c.bottom + this.blastradius
		);
		list = game.overlaps(l);
		for(var i=0; i < list.length; i++){
			var obj = list[i];
			if(obj instanceof Player){
				obj.hurt(this, this.damage);
			} else if(obj.hasModule(mod_combat)){
				obj.hurt(this, this.damage * 4);
			}
		}
		*/
		shakeCamera(Game.DELTASECOND * 0.5, 4);
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		Item.drop(this);
		this.destroy();
	});
}
Bombjar.prototype.update = function(){
	if ( this.life > 0 ) {
		
		if(this.grounded){
			this.force.x = this.forward() * this.speed;
			this.force.y = -5;
			this.grounded = false;
			this.bounceCount--
			
			if(this.bounceCount <= 0){
				this.bounceCount = 4;
				var fire = new Fire(this.position.x, this.position.y - this.height * 0.5);
				fire.grounded = false;
				fire.force.y = -5;
				fire.damageFire = this.damage;
				game.addObject(fire);
			}
		}
		
		this.walkcycle = (this.walkcycle + this.delta * 9.0) % 6;
		this.frame.x = this.walkcycle % 3;
		this.frame.y = this.walkcycle / 3;
		
		Background.pushLight( this.position, 180, COLOR_FIRE );
	} else{
		
	}
}

class BombjarFree extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);

		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 16;
		
		this.speed = 9.0;
		this.rotSpeed = 130.0;
		
		this.sprite = "bombjar";
		this.rotation = 0;
		this.tailTrans = 0;
		this.frame = new Point(0,2);
		this.force = new Point();
		this.wakeuptime = 2.0;
		this.lifeTime = 8.0;
		
		this.addModule(mod_combat);
		this.friction = 0.1;
		this.lifeMax = this.life = 100;
		this.defencePhysical = 99;
		this.defenceFire = 99;
		this.defenceSlime = 99;
		this.defenceIce = 99;
		this.defenceLight = 99;
		
		this.damage = 0;
		this.damageFire = 10;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(this.wakeuptime <= 0){
					obj.hurt(this);
				}
			}
		});
		
		this.on("hurt", function(obj, damage){
			
			this.force = this.position.subtract(obj.position).normalize(6);
		});
		
		this.tail = [
			new Vector(-4,-8,0),
			new Vector(-8,-12,0),
			new Vector(-16,-10,0),
			new Vector(-24,-8,0),
			new Vector(-4,8,0),
			new Vector(-8,12,0),
			new Vector(-16,10,0),
			new Vector(-24,8,0)
		];
	}
	update(){
		let dir = this.position.subtract(_player.position);
		let angle = Math.atan2(-dir.y, -dir.x) * Math.rad2deg;
		
		let rdif = Math.sdif(angle, this.rotation);
			
		if(Math.abs(rdif) > this.rotSpeed * this.delta){
			let rdir = rdif > 0 ? 1 : -1;
			this.rotation += rdir * this.rotSpeed * this.delta;
		} else {
			this.rotation = angle;
		}
		
		for(let i=0; i < this.tail.length; i++){
			this.tail[i].z = Math.slerp(
				this.tail[i].z,
				this.rotation,
				this.delta * Math.abs(0.5 + this.tail[i].x / 24)
			);
		}
		
		this.wakeuptime -= this.delta;
		this.lifeTime -= this.delta;
		
		this.force.x += Math.cos(this.rotation * Math.deg2rad) * this.delta * this.speed;
		this.force.y += Math.sin(this.rotation * Math.deg2rad) * this.delta * this.speed;
		this.force = this.force.scale( 1.0-(this.friction * UNITS_PER_METER * this.delta) );
		
		//Apply force
		this.position.x += this.force.x * this.delta * UNITS_PER_METER;
		this.position.y += this.force.y * this.delta * UNITS_PER_METER;
		
		if(this.lifeTime <= 0){
			this.destroy();
		}
		
		Background.pushLight( this.position, 180, COLOR_FIRE );
	}
	render(g,c){
		let r = this.rotation;
		this.flip = false;
		/*if(r > 90 || r < -90){
			this.flip = true;
			r = 180 - r;
		}*/
		for(let i=0; i < this.tail.length; i++){
			let t = this.tail[i];
			let n = 5 + (game.timeScaled * 16) % 3;
			let r = t.z * Math.deg2rad;
			let a = new Point( t.x * Math.cos(r) + t.y * Math.sin(r), t.x * Math.sin(r) + t.y * Math.cos(r) );
			g.renderSprite(
				"bullets",
				this.position.add(a).subtract(c),
				this.zIndex-1,
				new Point(n,1),
				this.flip,
				{
					"rotate" : t.z
				}
			);
			
			/*
			let a = Point.lerp(this.tail[i], this.tail[i+1], this.tailTrans);
			let b = Point.lerp(this.tail[i+1], this.tail[i+2], this.tailTrans);
			
			g.renderLine(
				a.subtract(c),
				b.subtract(c),
				8,
				[1.0,0.9,0.1,1.0]
			);
			*/
		}
		
		g.renderSprite(
			this.sprite,
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"rotate" : r
			}
		);
	}
}
self["BombjarFree"] = BombjarFree;