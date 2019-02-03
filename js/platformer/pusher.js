class Pusher extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
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
			if(this.active && Pusher.ignoreList.indexOf(obj) < 0){
				if( obj.hasModule(mod_rigidbody) && obj.grounded ) {
					obj.position.x += this.force.x * 0.5 * this.delta;
					obj.position.y += this.force.y * 0.5 * this.delta;
					Pusher.ignoreList.push(obj);
				}
			}
		});
		
		this.active = ops.getBool("active", true);
		this._tid = ops.getString("trigger", "");
		this.force.x = ops.getFloat("forcex", 0.0) * UNITS_PER_METER;
		this.force.y = ops.getFloat("forcey", 0.0) * UNITS_PER_METER;
	}
	lateUpdate(){
		Pusher.ignoreList = new Array();
		return super.lateUpdate.apply(this, arguments);
	}
}
Pusher.ignoreList = [];

self["Pusher"] = Pusher;