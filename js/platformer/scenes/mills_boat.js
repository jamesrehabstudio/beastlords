class BoatMills extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.addModule(mod_block);
		
		this.blockTopOnly = true;
		this.initPos = this.position.scale(1);
		
		this.speed = 2.0 * ops.getFloat("speed", 1.0);
		this.flip = ops.getBool("flip", false);
		
		this._moving = false;
		
		this.on("blockLand", function(obj){
			if(obj instanceof Player){
				this._moving = true;
			}
		});
		this.on("player_death",function(){
			this.reset();
		});
	}
	idle(){}
	reset(){
		this._moving = false;
		this.position = this.initPos.scale(1);
	}
	update(){
		if(this._moving){
			
			let force_x = this.forward() * this.speed * this.delta * UNITS_PER_METER
			let origin_x = this.flip ? 0 : this.width;
			
			let hit = game.t_raytrace(new Line(
				this.position.x + origin_x,
				this.position.y,
				this.position.x + origin_x + force_x,
				this.position.y,
			));
			
			if(hit){
				this._moving = false;
			} else {
				this.position.x += force_x;
			}
			
			
		}
	}
	render(g,c){}
	postrender(g,c){
		let cn = this.corners();
		g.color = COLOR_WHITE;
		g.drawRect(cn.left - c.x, cn.top - c.y, this.width, this.height, this.zIndex);
	}
}

self["BoatMills"] = BoatMills;