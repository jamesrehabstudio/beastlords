Airjet.prototype = new GameObject();
Airjet.prototype.constructor = GameObject;
function Airjet(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.frame = new Point(0,31);
	
	this.active = true;
	this.power = 1.25;
	this.maxFallMultiplier = 0.75;
	this.minHeight = 128;
	this.inside = new Array();
	this.sync = 0;
	
	this.sleepTime = 0.0;
	this.wakeTime = 2.0 * Game.DELTASECOND;
	this.timer = 0.0;
	
	this.particles = new Array();
	for(var i=0; i < Math.min(this.width * this.height * 0.25 * Airjet.SQUR16X16, 24); i++){
		this.particles.push([
			this.position.x + Math.random() * this.width,
			this.position.y + Math.random() * this.height,
			Math.random() * 360
		])
	}
	
	if("power" in ops){
		this.power = ops["power"] * 1;
	}
	if("maxfall" in ops){
		this.maxFallMultiplier = ops["maxfall"] * 1;
	}
	if("minheight" in ops){
		this.minHeight = ops["minheight"] * 1;
	}
	if("sleeptime" in ops){
		this.sleepTime = ops["sleeptime"] * Game.DELTASECOND;
	}
	if("waketime" in ops){
		this.wakeTime = ops["waketime"] * Game.DELTASECOND;
	}
	if("sync" in ops){
		this.sync = 1;
		var synctime = Math.abs(ops["sync"] * Game.DELTASECOND) % (this.wakeTime+this.sleepTime);
		if(synctime > this.wakeTime){
			this.active = false;
			this.timer = this.sleepTime - (synctime - this.wakeTime);
		} else {
			this.active = true;
			this.timer = this.wakeTime - synctime;
		}
	}
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_rigidbody) && this.inside.indexOf(obj) < 0){
			this.inside.push(obj);
		}
	});
	
	//this.hoverLevel = this.position.y + (this.height - this.minHeight);
	this.hoverLevel = this.position.y;
}

Airjet.prototype.idle = function(){
	if(!this.sync){
		GameObject.prototype.idle.apply(this);
	}
}

Airjet.prototype.update = function(){
	if(this.sleepTime > 0){
		this.timer -= this.delta;
		if(this.timer <= 0){
			if(this.active){
				this.active = false;
				this.timer = this.sleepTime;
			} else {
				audio.play("gasstart", this.position.add(new Point(this.width*0.5,this.height)));
				this.active = true;
				this.timer = this.wakeTime;
			}
		}
	}
	
	if(this.active){
		for(var i=0; i < this.inside.length; i++){
			var obj = this.inside[i];
			var power = this.power;
			//obj.force.y = Math.min(obj.force.y - this.power * this.delta, this.maxFallMultiplier/this.power);
			
			if(obj instanceof Player && obj.states.downStab){
				power = power * 0.5;
			}
			
			if(obj.force.y < this.power * -5){
				//do nothing
			} else if(obj.position.y > this.hoverLevel){
				obj.force.y -= power * this.delta;
			} else if (obj.force.y > 0 ) { 
				obj.force.y -= power * this.delta * 0.75;
			} else {
				//obj.force.y -= power * this.delta * 0.75;
			}
			
			
		}
	}
	this.inside = new Array();
}

Airjet.prototype.render = function(g,c){
	if(this.active){
		for(var i=0; i < this.particles.length; i++){
			var p = this.particles[i];
			p[1] -= this.power * this.delta * 5;
			if(p[1] < this.position.y) {
				p[1] = this.position.y + this.height;
			}
			var opacity = Math.min(Math.pow((p[1]-this.position.y) / this.height, 0.25),1);
			var pos = new Point(p[0], p[1]);
			
			if(game.insideScreen(pos, 4)){
				g.renderSprite(
					game.map.tileset, 
					pos.subtract(c),
					this.zIndex,
					this.frame,
					false,
					{
						"u_color" : [1,1,1,opacity],
						"rotate":p[2]
					}
				);
			}
		}
	}
}
Airjet.SQUR16X16 = 0.00390625;