SlugPlatform.prototype = new GameObject();
SlugPlatform.prototype.constructor = GameObject;
function SlugPlatform(x,y,d,o){
	this.constructor();
	
	var bottom = y + d[1] * 0.5;
	
	this.position.x = x;
	this.position.y = bottom - 40;
	this.width = 48;
	this.height = 16;
	this.origin = new Point(0.5,0.0);
	
	this.speed = 1.5;
	this.sprite = sprites.slugplatform;
	
	this.addModule( mod_block );

	o = o || {};
	if("speed" in o){
		this.speed = o["speed"] * 1;
	}
}
SlugPlatform.prototype.update = function(){
	this.frame = this.frame_row = 0;
	
	
	var forwardTile = 0;
	if(this.flip){
		var checkPos = this.position.add(new Point(-32, 32));
		forwardTile = game.getTile(checkPos);
		this.position.x -= this.speed * this.delta;
	} else {
		var checkPos = this.position.add(new Point(32, 32));
		forwardTile = game.getTile(checkPos);
		this.position.x += this.speed * this.delta;
	}
	
	if(forwardTile > 0){
		//Turn
		this.flip = !this.flip;
	}
	
	game.collideObject(this);
}

SlugPlatform.prototype.idle = function(){}