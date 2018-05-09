class Temple4Transport extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - (d[0] * 0.5);
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.startPosition = this.position.scale(1);
		this.stopPosition = this.position.scale(1);
		
		this.addModule(mod_block);
		
		this.moving = false;
		this.speed = ops.getFloat("speed", 0.5);
		this.launchTime = ops.getFloat("launchtime", 2.0) * Game.DELTASECOND;
		this.stopPosition.x = ops.getFloat("stopx", this.stopPosition.x);
		this.stopPosition.y = ops.getFloat("stopy", this.stopPosition.y);
		
		this.distance = this.position.subtract(this.stopPosition).magnitude();
		this.movementSpeed = this.speed / this.distance;
		
		this._waitTime = 0.0;
		this._progress = 0.0;
		
		this.on("collideTop", function(obj){
			if(obj instanceof Player){
				this.moving = true;
			} else {
				
			}
		});
	}
	update(){
		if(this.moving){
			if(this._waitTime < this.launchTime){
				this._waitTime += this.delta;
			} else {
				this._progress = Math.clamp01(this._progress + this.movementSpeed * this.delta * UNITS_PER_METER);
				this.position = Point.lerp(this.startPosition, this.stopPosition, this._progress);
			}
			
		}
	}
	
	render(g,c){
		g.color = [1.0,0.8,0.8,1.0];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		);
	}
}
self["Temple4Transport"] = Temple4Transport;