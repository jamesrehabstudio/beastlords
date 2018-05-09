class MechanicalDoor extends GameObject{
	constructor(x, y, d, o){
		super(x,y,d,o);
		this.origin = new Point();
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		this.startPos = new Point(this.position.x,this.position.y);
		
		this.direction = o.getInt("direction", 1);
		this.notches = o.getInt("notches", Math.floor(this.height/16));
		this.speed = o.getFloat("speed", 2.0);
		this.restoreSpeed = o.getFloat("restorespeed", 0.5);
		this._tid = o.getString("trigger", null);
		
		this.addModule(mod_block);
		
		this.notchCount = 0;
		
		Block.prototype.gatherTiles.apply(this,[true]);
		
		this.on("activate", function(){
			this.notchCount = Math.min(this.notchCount+1, this.notches);
		});
	}
	update(){
		let ypos = this.startPos.y + this.notchCount * (this.height / this.notches) * this.direction;
		let dif = Math.abs(ypos - this.position.y);
		
		if(dif > 0.01){
			let dir = ypos > this.position.y ? 1 : -1;
			let dspeed = this.delta * this.speed * UNITS_PER_METER;
			
			if(dspeed >= dif){
				this.position.y = ypos;
			} else {
				this.position.y += dspeed * dir;
			}
		} else {
			this.position.y = ypos;
		}
	}
	render(g,c){
		Block.prototype.render.apply(this,[g,c]);
	}
}

self["MechanicalDoor"] = MechanicalDoor;