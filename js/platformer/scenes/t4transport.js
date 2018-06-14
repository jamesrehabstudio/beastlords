class TransportT4 extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 128;
		this.height = 32;
		this.origin = new Point();
		
		this.addModule(mod_block);
		
		this.initPos = this.position.scale(1);
		this.path = d;
		this.speed = ops.getFloat("speed", 1.0) * 64.0;
		
		this._pathIndex = 0;
		this._isMoving = false;
		
		this.pathBounds = new Line(x,y,x,y);
		
		for(let i=0; i < this.path.length; i++){
			this.pathBounds.start.x = Math.min(this.pathBounds.start.x, x + this.path[i].x);
			this.pathBounds.start.y = Math.min(this.pathBounds.start.y, y + this.path[i].y);
			this.pathBounds.end.x = Math.max(this.pathBounds.end.x, x + this.path[i].x + this.width);
			this.pathBounds.end.y = Math.max(this.pathBounds.end.y, y + this.path[i].y + this.height);
		}
		
		
		this.on("blockLand", function(obj){
			if(obj instanceof Player){
				this._isMoving = true;
			}
		});
		this.on("sleep",function(){
			this.reset();
		});
	}
	reset(){
		this._isMoving = false;
		this._pathIndex = 0;
		this.position = this.initPos.scale(1);
	}
	isOnscreen(){
		let sc = new Line(game.camera, game.camera.add(game.resolution));
		return this.pathBounds.overlaps(sc);
		
	}
	update(){
		if(this._isMoving){
			if(this._pathIndex < this.path.length){
				let next = this.path[this._pathIndex].add(this.initPos);
				let dif = next.subtract(this.position);
				
				if(dif.magnitude() > this.speed * this.delta){
					this.position = this.position.add(dif.normalize(this.speed * this.delta));
				} else {
					this.position = next;
					this._pathIndex++;
				}
			} else {
				this._isMoving = false;
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

self["TransportT4"] = TransportT4;
