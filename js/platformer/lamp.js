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

self["Lamp"] = Lamp;