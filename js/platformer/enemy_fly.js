class Fly extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPos = new Point(x, y);
		this.sprite = "fly";
		this.width = 24;
		this.height = 24;
		this.frame = new Point(0,0);
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		
		this.diffculty = ops.getInt("diffculty", Spawn.diffculty);
		
		this.life = this.lifeMax = 1;
		this.xpDrop = 0;
		this.gravity = 0.0;
		this.bounce = 0.5;
		this.collisionReduction = - 0.5;
		this.pushable = false;
		
		this.friction = 0.05;
		
		this._direction = new Point(1,0);
		this._directionChangeTime = 0.0;
		
		this.on("pre_death", function(){
			game.addObject( new ParticleSystem(this.position.x, this.position.y, [1,1], new Options({
				"frame_x" : 1,
				"frame_y" : 2,
				"color" : [.95,1,.5,1],
				"startForceRange" : new Line(-2,-8,2,-2),
				"count" : 16,
				"time" : 1,
				
			})) );
			this.destroy();
		});
	}
	update(){
		if(this.life){
			this.force = this.force.add( this._direction.scale(this.delta * UNITS_PER_METER * Fly.speed ) );
			this._directionChangeTime -= this.delta;
			
			this.flip = this.target().position.x < this.position.x;
			this.frame.x = (this.frame.x + this.delta * 3 * Fly.animationSpeed) % 3;
			this.frame.y = (this.frame.y + this.delta * 1 * Fly.animationSpeed) % 2;
			
			if(this._directionChangeTime <= 0){
				let angle = this.target().position.subtract(this.position).toAngle() + Math.randomRange(-Fly.randomDir, Fly.randomDir);
				this._direction = Point.fromAngle(angle).scale(1,-1);
				this._directionChangeTime = Math.randomRange(1.5,2.5);
			}
		}
	}
	
}
Fly.speed = 0.0625;
Fly.randomDir = 0.4;
Fly.animationSpeed = 4.0;

self["Fly"] = Fly;