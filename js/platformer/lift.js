Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y,d,ops){
	this.constructor();
	this.start_x = x;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	this.sprite = "elevator";
	
	this.onboard = 0.0;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = Game.DELTASECOND * 0.2;
			obj.position.y = this.position.y;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
			obj.visible = false;
			obj.interactive = false;
		}
	});
	
	this.pushable = false;
	this.gravity = 0.0;
	
	ops = ops || {};
	this.trackPlayer = !("rest" in ops);
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	this.grounded = false;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 200 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard > 0) {
		this.trackPlayer = true;
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		if( this.trackPlayer ) {
			var speed = Math.min(Math.max(goto_y - this.position.y,-4.5),4.5);
			this.force.y = speed;
		}
	}
	
	this.frame.x = (this.frame.x+this.delta*Math.abs(this.force.y))%3;
	if(Math.abs(this.force.y) < 0.2) this.frame.x = 0;
	this.frame_row = 0;
	
	this.onboard -= this.delta;
}