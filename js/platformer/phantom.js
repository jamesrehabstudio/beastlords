Phantom.prototype = new GameObject();
Phantom.prototype.constructor = GameObject;
function Phantom(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "phantom";
	this.speed = 2.1;
	this.resetPosition = new Point(x,y);
	
	this.frame = 0;
	this.frame_row = 0;
	this.force = new Point(0,0);
	this.friction = 0.2;
	this.active = false;
	
	this.warmup = Game.DELTASECOND * 1.5;
	this.warmupTotal = Game.DELTASECOND * 0.7;
	
	o = o || {};
	
	this.on("player_death", function(){
		this.position.x = this.resetPosition.x;
		this.position.y = this.resetPosition.y;
		this.force = new Point();
		this.warmup = Game.DELTASECOND * 1.5;
		this.active = false;
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.invincible = -1;
			obj.hurt( this, 9999 );
		}
	});
	this.on("prayer", function(){
		var b = game.getObject(Background);
		if(b instanceof Background){
			b.darknessFunction = function(c){return 1;}
			b.ambience = [0.3,0.0,0.4];
		}
		
		Trigger.activate("ghost");
		Background.flash = [1,1,1,1];
		this.destroy();
	});
}
Phantom.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(!this.active){
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 2;
		if(Math.abs(dir.x) < 128 ){
			this.active = true;
		}
	} else if( this.warmup > 0 ){
		var progress = this.warmup / this.warmupTotal;
		if(progress > 1){
			this.frame = (this.frame + this.delta * 0.2) % 4;
			this.frame_row = 2;
		} else {
			shakeCamera(0.1,9);
			this.frame = (1-progress) * 4;
			this.frame_row = 3;
		}
		this.warmup -= this.delta;
	} else {
		shakeCamera(0.1,4);
		this.force = this.force.add(dir.normalize(-this.speed * this.delta));
		this.frame = Math.max((this.frame+this.delta)%4,2);
		this.frame_row = 1;
	}
	
	this.force.x *= 1 - (this.friction * this.delta);
	this.force.y *= 1 - (this.friction * this.delta);
	
	this.position = new Point(
		this.position.x + this.force.x * this.delta,
		this.position.y + this.force.y * this.delta
	);
	this.flip = dir.x > 0;
}

PhantomGrave.prototype = new GameObject();
PhantomGrave.prototype.constructor = GameObject;
function PhantomGrave(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.sprite = "phantomgraves";
	this.zIndex = -21;
	this.size = 180;
	this.show = true;
	
	this.frame = 0;
	this.frame_row = 0;
	
	o = o || {};
	if("index" in o){
		this.index = o.index * 1;
		this.frame = this.index % 3;
		this.frame_row = Math.floor(this.index / 3);
	}
	
	this.on("prayer", function(){
		Background.flash = [1,1,1,1];
		this.destroy();
	});
}
PhantomGrave.prototype.update = function(){
}
PhantomGrave.prototype.render = function(g,c){	
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), this.width * 2 );
}