Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y){
	this.constructor();
	this.start_x = x + 8;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	this.sprite = game.tileSprite;
	
	this.onboard = false;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = true;
			obj.position.y = this.position.y;
			obj.checkpoint = this.position;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
			obj.visible = false;
			obj.interactive = false;
		}
	});
	
	this.mass = 0;
	this.gravity = 0.0;
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 200 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard ) {
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		var speed = Math.min(Math.max(goto_y - this.position.y,-4.5),4.5);
		this.force.y = speed;
	}
	
	this.onboard = false;
}
Lift.prototype.render = function(g,c){
	for(var x=0; x < 2; x++ ) for(var y=0; y < 3; y++ ) {
		this.sprite.render(g,
			new Point( x*16 + -16 + this.position.x - c.x, y*16 + -24 + this.position.y - c.y ),
			x, y+13
		);
	}
	
}