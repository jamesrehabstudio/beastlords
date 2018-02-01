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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		var explosion = new EffectBang(this.position.x,this.position.y);
		game.addObject(explosion);
		
		var free = new BombjarFree(this.position.x, this.position.y);
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
				game.addObject(fire);
			}
		}
		
		this.walkcycle = (this.walkcycle + this.delta * 0.3) % 6;
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
		
		this.speed = 1.5;
		this.rotSpeed = 6.0;
		
		this.sprite = "bombjar";
		this.rotation = 0;
		this.tailTrans = 0;
		this.frame = new Point(0,2);
		this.force = new Point();
		
		this.addModule(mod_combat);
		this.friction = 0.1;
		this.lifeMax = this.life = 100;
		this.defencePhysical = 99;
		this.defenceFire = 99;
		this.defenceSlime = 99;
		this.defenceIce = 99;
		this.defenceLight = 99;
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt",this.position);
			this.force = this.position.subtract(obj.position).normalize(6);
		});
		
		this.tail = [
			new Vector(-4,-8),
			new Vector(-8,-12),
			new Vector(-16,-10),
			new Vector(-24,-8),
			new Vector(-4,8),
			new Vector(-8,12),
			new Vector(-16,10),
			new Vector(-24,8)
		];
	}
	update(){
		var dir = this.position.subtract(_player.position);
		let r = Math.atan2(-dir.y, -dir.x) * Math.rad2deg;
		
		if(r < -45 && this.rotation > 45){
			r = 180 - r;
		}
		
		if(r > this.rotation+this.rotSpeed){
			this.rotation += this.rotSpeed * this.delta;
		} else if(r < this.rotation-this.rotSpeed){
			this.rotation -= this.rotSpeed * this.delta;
		}
		if(this.rotation < -180){
			this.rotation = 360 + this.rotation;
		}
		
		for(let i=0; i < this.tail.length; i++){
			this.tail[i].z = Math.slerp(
				this.tail[i].z,
				this.rotation,
				this.delta*(1/Math.abs(this.tail[i].x))
			);
		}
		
		this.position.x += Math.cos(this.rotation * Math.deg2rad) * this.delta * this.speed;
		this.position.y += Math.sin(this.rotation * Math.deg2rad) * this.delta * this.speed;
		
		//Apply force
		this.position.x += this.force.x * this.delta;
		this.position.y += this.force.y * this.delta;
		this.force = this.force.scale(1.0-(this.friction*this.delta));
		
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
			let r = t.z * Math.deg2rad;
			let a = new Point(t.x*Math.cos(r), t.y*Math.sin(r));
			g.renderSprite(
				"bullets",
				this.position.add(a).subtract(c),
				this.zIndex-1,
				new Point(5,1),
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