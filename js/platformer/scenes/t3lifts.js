class LiftT3 extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.addModule(mod_block);
		
		this.initPos = this.position.scale(1);
		this.gotoPos = this.position.scale(1);
		this.gotoPos.x += ops.getFloat("movex", 0.0);
		this.gotoPos.y += ops.getFloat("movey", 0.0);
		
		this.speed = ops.getFloat("speed", 64.0) / this.gotoPos.subtract(this.position).magnitude();
		
		this._pos = 0.0;
		this._isClimbing = false;
		this._doors = new Array();
		
		this.on("blockLand", function(obj){
			if(obj instanceof Player){
				this._doors = game.getObjects(LiftT3Door);
				this._isClimbing = true;
			}
		});
		this.on("sleep",function(){
			this.reset();
		});
	}
	reset(){
		this._isClimbing = false;
		this._pos = 0.0;
	}
	isOnscreen(){
		let sc = new Line(game.camera, game.camera.add(game.resolution));
		let cn = new Line(
			Math.min( this.initPos.x, this.gotoPos.x),
			Math.min( this.initPos.y, this.gotoPos.y),
			
			this.width + Math.max( this.initPos.x, this.gotoPos.x),
			this.height + Math.max( this.initPos.y, this.gotoPos.y)
		);
		return cn.overlaps(sc);
		
	}
	update(){
		if(this._isClimbing){
			this._pos = Math.clamp01( this._pos + this.delta * this.speed );
		} else {
			this._pos = Math.clamp01( this._pos - this.delta * this.speed );
		}
		
		this.position = Point.lerp(this.initPos, this.gotoPos, this._pos);
		
		let openDoors = this._pos > 0.75;
		for(let i=0; i < this._doors.length; i++){
			this._doors[i]._open = openDoors;
		}
	}
	render(g,c){}
	postrender(g,c){
		let cn = this.corners();
		g.color = COLOR_WHITE;
		g.drawRect(cn.left - c.x, cn.top - c.y, this.width, this.height, this.zIndex);
	}
}

class LiftT3Door extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.addModule(mod_block);
		
		this.initPos = this.position.scale(1);
		this.gotoPos = this.position.scale(1);
		this.gotoPos.x += ops.getFloat("movex", 0.0);
		this.gotoPos.y += ops.getFloat("movey", 0.0);
		
		this.speed = ops.getFloat("speed", 64.0) / this.gotoPos.subtract(this.position).magnitude();
		
		this._open = false;
		this._pos = 0.0;
		
		Block.prototype.gatherTiles.apply(this);
	}
	update(){
		if(this._open){
			this._pos = Math.clamp01( this._pos + this.delta * this.speed );
		} else {
			this._pos = Math.clamp01( this._pos - this.delta * this.speed );
		}
		
		this.position = Point.lerp(this.initPos, this.gotoPos, this._pos);
	}
	render(g,c){
		Block.prototype.render.apply(this,[g,c]);
	}
}

self["LiftT3"] = LiftT3;
self["LiftT3Door"] = LiftT3Door;