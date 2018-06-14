Pusher.prototype = new GameObject();
Pusher.prototype.constructor = GameObject;
function Pusher(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 1;
	this.position.x = x - d[0]*0.5;
	this.position.y = y + d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.force = new Point();
	
	this.active = 1;
	
	this.on("activate",function(obj){
		this.active = !this.active;
	});
	
	this.on("collideObject", function(obj){
		if(this.active){
			if( obj.hasModule(mod_rigidbody) && obj.grounded ) {
				obj.position.x += this.force.x * 0.5 * this.delta;
				obj.position.y += this.force.y * 0.5 * this.delta;
			}
		}
	});
	
	ops = ops || {};
	
	if("active" in ops){
		this.active = ops["active"] * 1;
	}
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("forcex" in ops){
		this.force.x = ops["forcex"] * UNITS_PER_METER;
	}
	if("forcey" in ops){
		this.force.y = ops["forcey"] * UNITS_PER_METER;
	}
}