class Light extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.mesh = ops.getString("mesh","light");
		
		//this.rot = ops.getBool("flip", false) ? new Vector(Math.PI,0,0) : new Vector();
		this.rot = new Vector(
			ops.getFloat("rotx", 180) * Math.deg2rad,
			ops.getFloat("roty", 0) * Math.deg2rad,
			ops.getFloat("rotz", 0) * Math.deg2rad,
		);
		this.color = ops.getList("color", [1,1,1,1]);
		this.color2 = ops.getList("color2", [0,0,0,1]);
		this.transition = ops.getFloat("transition",1.0);
		this.retrigger = ops.getBool("retrigger",true);
		
		this._tid = ops.get("trigger",null);
		
		let area = new Line(0,0,0,0);
		if(d.length > 2){
			for(let i=0; i < d.length; i++){
				area.start.x = Math.min(area.start.x, d[i].x);
				area.start.y = Math.min(area.start.y, d[i].y);
				area.end.x = Math.max(area.end.x, d[i].x);
				area.end.y = Math.max(area.end.y, d[i].y);
			}
			this.width = area.width() * 2;
			this.height = area.height() * 2;
		} else {
			this.width = d[0];
			this.height = d[1];
		}
		
		this._change = false;
		this._time = 0.0;
		this._pick = 0;
		this._color = [1,1,1,1];
		
		this.on("activate", function(){
			if(this.retrigger || this._pick < 1){
				this._pick = this._pick >= 1 ? 0 : 1;
				this._change = true;
			}
		});
		
		//Fix colors
		for(let i=0; i < 4; i++){
			if(this.color[i] == undefined) { this.color[i] = 1; }
			if(this.color2[i] == undefined) { this.color2[i] = 1; }
			this.color[i] *= 1;
			this.color2[i] *= 1;
			this._color[i] = this.color[i];
		}
	}
	turnOn(){ 
		if(this._pick > 0) {
			this._pick = 0;
			this._change = true;
		}
	}
	turnOff(){ 
		if(this._pick < 1) {
			this._pick = 1;
			this._change = true;
		}
	}
	update(){
		if( this._change ){
			let s = this.delta / Math.max(this.transition, Number.MIN_VALUE);
			let d = this._time > this._pick ? -1 : 1;
			this._time = Math.clamp01( this._time + d * s );
			
			for(let i=0; i < 4; i++){
				this._color[i] = Math.lerp( this.color[i], this.color2[i], this._time );
			}
			
			if(this._time == this._pick){ this._change = false; }
		}
	}
	render(){}
	renderDebug(){}
	lightrender(g,c){
		g.renderMesh(this.mesh, this.position.subtract(c), this.zIndex,
			{
				"rotate" : [this.rot.x, this.rot.y, this.rot.z],
				"u_color" : this._color
			}
		);
	}
}
self["Light"] = Light;

class LightStrobe extends Light{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
	}
	update(){
		let s = Math.max(this.transition, Number.MIN_VALUE);
		let d = (game.timeScaled / s) % 1;
		for(let i=0; i < 4; i++){
			this._color[i] = Math.lerp( this.color[i], this.color2[i], d );
		}
	}
}
self["LightStrobe"] = LightStrobe;