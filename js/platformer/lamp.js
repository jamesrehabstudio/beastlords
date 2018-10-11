class Lamp extends GameObject{
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 16;
		this.sprite = "lamps";
		this.zIndex = -21;
		this.size = 180;
		this.show = true;
		this.color = [1.0,0.85,0.75,1.0];
		
		this.frame = 0;
		this.frame_row = 0;
		
		o = o || {};
		if(d instanceof Array){
			this.size = Math.max(Math.max(d[0],d[1]) * 2, this.size);
		}
		this.size = o.getFloat("size", 180);
		this.show = o.getBool("show", 180);
		
		if("color" in o){
			var colorArray = o.color.split(",");
			if(colorArray.length >= 3){
				this.color[0] = colorArray[0] * 1;
				this.color[1] = colorArray[1] * 1;
				this.color[2] = colorArray[2] * 1;
			}
		}
		
		this.idleMargin = this.size * 0.5 + 32;
	}
	update(){
		this.frame = (this.frame + this.delta * 9.0) % 4;
	}
	render(g,c){
		if(this.show){
			GameObject.prototype.render.apply(this,[g,c]);
		}
		Background.pushLight( this.position, this.size, this.color );
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