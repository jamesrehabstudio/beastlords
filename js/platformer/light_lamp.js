class Lamp extends Light {
	constructor(x,y,d,o){
		super(x,y,d,o);
		
		this.sprite = "lamps";
		this.size = o.getFloat("size", 180);
		this.show = o.getBool("show", true);
		
		this.idleMargin = this.size * 0.5 + 32;
	}
	update(){
		super.update();
		this.frame = (this.frame + this.delta * 9.0) % 4;
		
	}
	render(g,c){
		if(this.show){
			GameObject.prototype.render.apply(this,[g,c]);
		}
		Background.pushLight( this.position, this.size, this._color );
	}
}

class LightArea extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.color = [
			ops.getFloat("red", 1.0),
			ops.getFloat("green", 1.0),
			ops.getFloat("blue", 1.0),
			1.0
		];
		this.idleMargin = this.radius = ops.getFloat("radius", 16);
		
	}
	update(){
		let halfSize = new Point(this.width, this.height).scale(0.5);
		Background.pushLightArea(
			new Line(
				this.position.subtract( halfSize ), 
				this.position.add( halfSize )
			),
			this.radius,
			this.color
		);
	}
}

self["Lamp"] = Lamp;
self["LightArea"] = LightArea;