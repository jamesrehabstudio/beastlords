class Lava extends Puddle{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.viscosity = 0.125;
		this.fireDamage = 1;
		this.damageTickTimer = Game.DELTASECOND * 0.3;
		
		this.color1 = [0.8,0.25,0.0,1.0];
		this.color2 = [1.0,0.5,0.0,1.0];
		
		this.waveSize = 4;
		this.waveFrequency = 0.05;
		this.waveSpeed = 0.5;
		
		this.raisedHeight = d[1];
		this.lowerHeight = ops.getInt("triggerheight", this.raisedHeight);
		this.speed = ops.getFloat("drainspeed", 1.0) * Math.clamp( 32 / Math.abs(this.raisedHeight - this.lowerHeight), 1e-16, 1e16 );
		this.delay = ops.getFloat("delay", 0.0);
		this.triggersave = ops.getString("triggersave");
		
		this._tid = ops.getString("trigger", null);
		
		this._damageTick = false;
		this._damageTickTimer = 0.0;
		this._drained = false;
		this._drainLevel = 0.0;
		
		if(this.triggersave){
			if(NPC.get(this.triggersave)){
				this.height = this.lowerHeight;
				this._drained = true;
				this._drainLevel = 1.0;
			}
		}
		
		this.on(["sleep","wakeup"], function(){
			if(this._drained){
				this._drainLevel = 1.0;
				this.height = this.lowerHeight;
			} else {
				this._drainLevel = 0.0;
				this.height = this.raisedHeight;
			}
		});
		
		this.on("activate", function(){
			this._drained = true;
		});
		
		this.on("collideObject", function(obj){
			if(this.height > 0){
				//Only hurt if it has volume
				if(obj.hasModule(mod_rigidbody)){
					this.floatObject(obj);
				}
				if(this._damageTick && obj.hasModule(mod_combat)){
					audio.play("burn", obj.position);
					obj.life -= this.fireDamage;
					obj.displayDamage(this.fireDamage);
					obj.isDead();
					
					obj.trigger("in_lava", this);
					
					
				}
			}
		});
	}
	update(){
		super.update();
		
		if(this.height > 0 && this.width > 0){
			this.glow(64,COLOR_FIRE);
		}
		
		this._damageTickTimer -= this.delta;
		this._damageTick = false;
		if(this._damageTickTimer <= 0){
			this._damageTickTimer = this.damageTickTimer + this._damageTickTimer;
			this._damageTick = true;
		}
		
		if(this._drained){
			if(this.delay > 0){
				this.delay -= this.delta;
			} else {
				this._drainLevel = Math.clamp01( this._drainLevel + this.speed * this.delta );
			}
		} else {
			this._drainLevel = Math.clamp01( this._drainLevel - this.speed * this.delta );
		}
		this.height = Math.lerp( this.raisedHeight, this.lowerHeight, this._drainLevel);
	}
	render(g,c){
		if(this.height > 0){
			super.render(g,c);
		}
	}
}

self["Lava"] = Lava;

/*
Lava.prototype = new GameObject();
Lava.prototype.constructor = GameObject;
function Lava(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 999;
	this.idleMargin = Lava.lightradius;
	
	this.drain = 0;
	this.bottom = this.position.y + this.height;
	this.triggerheight = 4;
	this.triggerdelete = 0;
	this.triggerdelay = 0;
	this.triggersave = 0;
	this.speed = 2;
	
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("triggerheight" in ops){
		this.triggerheight = ops["triggerheight"] * 1;
	}
	if("triggerdelete" in ops){
		this.triggerdelete = ops["triggerdelete"] * 1;
	}
	if("triggerdelay" in ops){
		this.triggerdelay = ops["triggerdelay"] * Game.DELTASECOND;
	}
	
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave)){
			this.height = this.triggerheight;
			this.drain = true;
		}
	}
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat)){
			if(obj.life > 0){
				obj.life = 0;
				obj.stun = 1;
				obj.trigger("hurt", this, 0)
				obj.isDead();
			}
		}
	});
	
	this.on("activate", function(){
		this.drain = 1;
		if(this.triggersave){
			NPC.set(this.triggersave, 1);
		}
	});
	
	this.on("wakeup", function(){
		if(this.drain){
			this.height = this.triggerheight;
			this.position.y = this.bottom - this.height;
		}
	})
}

Lava.prototype.update = function(){
	if(this.drain){
		if(this.height > this.triggerheight){
			if(this.triggerdelay > 0){
				this.triggerdelay -= this.delta;
			} else {
				this.height -= this.speed * this.delta;
			}
		} else {
			this.height = this.triggerheight;
			if(this.triggerdelete){
				this.destroy();
			}
		}
		this.position.y = this.bottom - this.height;
	}
	
	Background.pushLightArea(new Line(this.position,this.position.add(new Point(this.width,this.height))),Lava.lightradius,[1.0,0.6,0.2,1.0]);
	this.interactive = this.width > 0 && this.height > 0;
}

Lava.prototype.render = function(g,c){
	g.renderSprite(
		"lava", 
		this.position.subtract(c),
		this.zIndex,
		new Point(),
		false,
		{
			"u_time" : game.timeScaled * 0.1,
			"u_size" : [this.width, this.height],
			"scalex" : this.width / 64.0,
			"scaley" : this.height / 64.0
		}
	)
	return;
	if(this.interactive){
		g.color = [1.0,0.5,0.0,1.0];
		Renderer.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		)
	}
}
Lava.lightradius = 64;

/*
Lava.prototype.lightrender = function(g,c){
	if(this.interactive){
		g.color = [0.2,0.1,0.0,1.0];
		for(var i=0; i < 8; i++){
			var extra = 2 * Math.sin(i *0.5 + game.timeScaled * 0.1) + (8 * i+1);
			Renderer.scaleFillRect(
				this.position.x - extra - c.x,
				this.position.y - extra- c.y,
				this.width + extra * 2,
				this.height  + extra * 2
			)
		}
	}
}
*/

Lavafalls.prototype = new GameObject();
Lavafalls.prototype.constructor = GameObject;
function Lavafalls(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 898;
	
	this.sprite = "lavafalls";
	this.speed = 12.0;
	this.ends = new Point(0, 0);
	
	this.damage = 12;
	this.yexcess = 72;
	this.ystep = 72;
	this.waketime = Game.DELTASECOND * 1.0;
	this.sleeptime = Game.DELTASECOND * 2.0;
	this.timer = 0;
	this.active = true;
	
	if("waketime" in ops){
		this.waketime = ops["waketime"] * 1;
	}
	if("sleeptime" in ops){
		this.waketime = ops["sleeptime"] * 1;
	}
	
	this.on("activate", function(){
		this.active = !this.active;
	});
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat)){
			var c_top = obj.position.y - obj.height * obj.origin.y;
			var c_bot = obj.position.y + obj.height * obj.origin.y;
			if(
				c_bot > this.position.y + this.ends.x && 
				c_top < this.position.y + this.ends.y
			){
				obj.hurt(this, this.damage);
			}
		}
	});
}

Lavafalls.bloboffset = [
	{x:0,y:0,z:2,f:0,g:Math.random()*16},
	{x:0,y:16,z:1,f:1,g:Math.random()*16},
	{x:0,y:4,z:2,f:2,g:Math.random()*16},
	{x:-24,y:24,z:0,f:3,g:Math.random()*16}
];

Lavafalls.prototype.update = function(g,c){
	if(this.ends.x >= this.height+this.yexcess){
		//Go to sleep
		if(this.timer >= this.sleeptime){
			this.timer = this.ends.x = this.ends.y = 0;
		}
	} else {
		this.ends.y += this.speed * this.delta;
		if(this.timer >= this.waketime){
			this.ends.x += this.speed * this.delta;
		}
		if(this.ends.x >= this.height+this.yexcess){
			this.timer = 0;
		}
	}
	
	if(this.active){
		this.timer += this.delta;
	}
	
	Background.pushLightArea(
		new Line(
			this.position.add(new Point(0, this.ends.x)), 
			this.position.add(new Point(
				this.width,
				Math.min(this.height, this.ends.y - this.ends.x)
			)
		)),
		Lava.lightradius,
		[1.0,0.6,0.2,1.0]
	);
}

Lavafalls.prototype.render = function(g,c){
	var bottom = this.ends.y;
	if(this.ends.y > this.height){
		bottom = this.height + ((this.ends.y-this.height) % this.ystep);
	}
	
	for(var y=bottom; y >= this.ends.x; y-=this.ystep){
		var i = 0;
		for(var x=0; x < this.width; x+=16){
			blob = Lavafalls.bloboffset[i];
			g.renderSprite(
				this.sprite,
				this.position.add(new Point(x+blob.x, y+blob.y)).subtract(c).floor(),
				this.zIndex + blob.z - y,
				new Point(blob.f,0),
				this.flip, 
				{
					"u_intensity" : 1 + Math.abs(0.5*Math.sin(blob.g + game.timeScaled*0.125))
				}
			)
			i = (i+1) % 4;
		}
	}
}
Lavafalls.prototype.lightrender = function(g,c){
	/*
	g.color = COLOR_FIRE;
	g.scaleFillRect(
		this.position.x - c.x,
		this.position.y + this.ends.x - c.y,
		this.width,
		Math.min(this.height, this.ends.y - this.ends.x)
	);
	*/
}