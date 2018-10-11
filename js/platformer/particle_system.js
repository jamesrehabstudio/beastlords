class ParticleSystem extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.destroyOnSleep = ops.getBool("destroyOnSleep", true);
		this.loop = ops.getBool("loop", false);
		this.autodestroy = ops.getBool("autodestroy", true);
		this.allowIdle = ops.getBool("allowIdle", true);
		this.time = ops.getFloat("time", 5.0) * Game.DELTASECOND;
		this.gravity = ops.getFloat("gravity", 1.0);
		this.count = ops.getInt("count", 5);
		
		let _startForce = ops.getFloat("startForce", 1);
		this.startForce = ops.get("startForceRange", new Line(-_startForce,-_startForce,_startForce,_startForce));
		
		this.sizeStart = ops.getFloat("sizeStart", 1.0);
		this.sizeEnd = ops.getFloat("sizeEnd", 1.0);
		
		this.colorStart = this.colorEnd = ops.get("color", [1.0,1.0,1.0,1.0]);
		this.colorStart = ops.get("colorStart", this.colorStart);
		this.colorEnd = ops.get("colorEnd", this.colorEnd);
		
		this.width = d[0];
		this.height = d[1];
		
		let defaultSprite = {
			"sprite" : "bullets",
			"framex" : 0,
			"framey" : 0,
			"scalex" : 1.0,
			"scaley" : 1.0
		};
		
		this.sprites = ops.get("sprites", [ defaultSprite ] );
		this.sprites[0].sprite = ops.getString("sprite", this.sprites[0].sprite);
		this.sprites[0].framex = ops.getInt("frame_x", this.sprites[0].framex);
		this.sprites[0].framey = ops.getInt("frame_y", this.sprites[0].framey);
		this.sprites[0].scalex = this.sprites[0].scaley = ops.getFloat("scale", 1.0);
		this.sprites[0].scalex = ops.getFloat("scalex", this.sprites[0].scalex);
		this.sprites[0].scaley = ops.getFloat("scaley", this.sprites[0].scaley);
		this.sprites[0].scaley = ops.getFloat("scaley", this.sprites[0].scaley);
		this.sprites[0].color = ops.get("color", this.sprites[0].color);
		
		this.spawnArea = new Point(	
			ops.getFloat("width", this.width),
			ops.getFloat("height", this.height)
		);
		
		this.parts = new Array();
		this._time = this.time;
		
		this.setCount(this.count);
		
		this.on("sleep", function(){
			if(this.destroyOnSleep){
				this.destroy();
			}
		});
	}
	idle(){
		if( this.allowIdle ){
			super.idle();
		}
	}
	getRandomPosition(){
		let _a = Math.randomRange(0,Math.PI*2);
		return new Point( 
			Math.cos(_a) * this.spawnArea.x * Math.random(),
			Math.sin(_a) * this.spawnArea.y * Math.random()
		).add(this.position);
	}
	reset(){
		this.parts = new Array();
		this.setCount(this.count);
	}
	setCount(n){
		this.count = n;
		for(let i=0; i < this.count; i++){
			
			if( this.parts[i] == undefined ){
				//Create a new particle
				let _sprite = this.sprites[ Math.floor(Math.random() * this.sprites.length) ];
				let _force = new Point( Math.randomRange(this.startForce.start.x, this.startForce.end.x), Math.randomRange(this.startForce.start.y, this.startForce.start.y) );
				let _time = this.loop ? (i/this.count) * this.time : 0.0;
				
				this.parts[i] = {
					"position" : this.getRandomPosition(),
					"force" : _force,
					"frame" : new Point(_sprite.framex, _sprite.framey),
					"scale" : new Point(_sprite.scalex, _sprite.scaley),
					"sprite" : _sprite.sprite,
					"visible" : true,
					"time" : _time
				};
			}
		}
		this.parts = this.parts.slice(0, this.count);
	}
	update(){
		for(let i=0; i < this.parts.length; i++){
			let part = this.parts[i];
			part.position.x += part.force.x * UNITS_PER_METER * this.delta;
			part.position.y += part.force.y * UNITS_PER_METER * this.delta;
			part.force.y += this.gravity * UNITS_PER_METER * this.delta;
			part.time -= this.delta;
			
			if( part.time <= 0.0){
				if( this.loop){ 
					part.force = new Point( Math.randomRange(this.startForce.start.x, this.startForce.end.x), Math.randomRange(this.startForce.start.y, this.startForce.start.y) );
					part.position = this.getRandomPosition();
					part.time += this.time;		
					part.visible = true;
				} else {
					part.visible = false;
					part.time = 0.0;
				}
			}
		}
		
		if( !this.loop && this.autodestroy ){
			this._time -= this.delta; 
			if( this._time <= 0){
				this.destroy();
			}
		}
	}
	render(g,c){
		for(let i=0; i < this.parts.length; i++){
			let part = this.parts[i];
			if( part.visible ){
				let p = 1 - part.time / this.time;
				let s = Math.lerp(this.sizeStart, this.sizeEnd, p);
				let cl = [
					Math.lerp(this.colorStart[0], this.colorEnd[0], p),
					Math.lerp(this.colorStart[1], this.colorEnd[1], p),
					Math.lerp(this.colorStart[2], this.colorEnd[2], p),
					Math.lerp(this.colorStart[3], this.colorEnd[3], p),
				];
				g.renderSprite(
					part.sprite,
					part.position.subtract(c),
					this.zIndex,
					part.frame, 
					this.flip,
					{
						"u_color" : cl,
						"scalex" : part.scale.x * s,
						"scaley" : part.scale.y * s
					}
				);
			}
		}
	}
}

ParticleSystem.rocks = function(x, y, count=5, force=1){
	return game.addObject( new ParticleSystem(x,y,[6,6],Options.convert({
		"frame_x" : 1,
		"frame_y" : 2,
		"gravity" : 0.5,
		"count" : count,
		"startForce" : force
	})) );
}
ParticleSystem.fire = function(x, y, size=8){
	return game.addObject( new ParticleSystem(x,y,[6,6],Options.convert({
		"width" : size,
		"height" : size,
		"sprite" : "circle256",
		"scalex" : 6.0/256,
		"scaley" : 6.0/256,
		"gravity" : 0.02,
		"count" : Math.floor(16 + size),
		"loop" : true,
		"time" : 0.75,
		"sizeStart" : 1.0 * (size/6.0),
		"sizeEnd" : 0.0,
		"colorStart" : [1.0,0.8,0.1,1.0],
		"colorEnd" : [1.0,0.2,0.0,1.0]
	})) );
}