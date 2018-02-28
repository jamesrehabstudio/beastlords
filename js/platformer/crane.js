class Crane extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.width = d[0];
		this.height = d[1];
		
		this.position.x = x - this.width * 0.5;
		this.position.y = y - this.height * 0.5;
		this.origin = new Point();
		
		this.on("ontop", function(obj){
			if(obj.hasModule(mod_rigidbody)){
				this.force.x += obj.force.x * obj.friction * this.forceTransfer * this.delta;
			}
		});
		
		this.on(["collideLeft","collideRight"], function(obj){
			if(obj.hasModule(mod_rigidbody)){
				this.force.x += obj.force.x * this.delta;
			}
		});
		
		this.addModule(mod_block);
		
		this.tension = 1.0;
		this.gravity = 1.0;
		this.forceTransfer = 0.375;
		this.friction = new Point(0.05, 0.01);
		this._progress = 0.0;
		
		this.force = new Point();
		
		this.move = ops.getBool("autostart", false);
		this.loop = ops.getBool("loop", true);
		this.wait = ops.getBool("wait", 0.0) * Game.DELTASECOND;
		this.radius = ops.getFloat("radius", 180.0);
		this.speed = ops.getFloat("speed", 1.0);
		this.sync = ops.getFloat("sync", 0.0);
		
		if("trigger" in ops){
			this._tid = ops.trigger;
		}
		this.on("activate", function(obj){
			this.move = 1;
		});
		
		
		this.start = this.position.add(new Point(0, -this.radius));
		this.finish = this.position.add(new Point(0, -this.radius));
		this.finish.x += ops.getFloat("movex", 0.0);
		this.finish.y += ops.getFloat("movey", 0.0);
		
		this.current = Point.lerp(this.start, this.finish, this.sync);
		this.distance = this.start.subtract(this.finish).magnitude();
		this.time = this.distance / this.speed;
		this.totalTime = this.time + this.wait;
	}
	idle(){}
	
	
	update(){
		if(this.move){
			let a = (this.sync + game.timeScaled / this.totalTime) % 1.0;
			let d = Math.clamp01(MovingBlock.prototype.evaluate.apply(this,[a]));
			//this.position = Point.lerp(this.startPosition, this.endPosition, d);
			this.current = Point.lerp(this.start, this.finish, d);
			
			//this._progress = Math.mod( (game.timeScaled * this.speed) / this.distance, 2);
			
		}
		
		//let p = this._progress < 1 ? this._progress : (2 - this._progress);
		//this.current = Point.lerp(this.start, this.finish, p);
		
		//Apply friction
		this.force = this.force.scale(new Point(1,1).subtract(this.friction.scale(this.delta)));
		//Apply gravity
		this.force.y += this.gravity * this.delta;
		
		this.position = this.position.add(this.force.scale(this.delta));
		
		let dif = this.position.subtract(this.current);
		
		if(dif.magnitude() > this.radius){
			this.force = this.force.add(dif.normalize(this.force.magnitude()).scale(this.tension * -this.delta));
			//this.force = this.force.add(new Point(dif.x * this.force.y, 0).scale(this.tension * -this.delta));
			this.position = this.current.add(dif.normalize(this.radius));
		}
	}
	render(g,c){
		g.color = [0.6,0,0,1];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		);
		g.renderLine(
			this.position.add(new Point(this.width * 0.1, 0)).subtract(c),
			this.current.add(new Point(this.width * 0.1, 0)).subtract(c),
			1,
			COLOR_WHITE
		);
		g.renderLine(
			this.position.add(new Point(this.width * 0.9, 0)).subtract(c),
			this.current.add(new Point(this.width * 0.9, 0)).subtract(c),
			1,
			COLOR_WHITE
		);
	}
}
self["Crane"] = Crane;