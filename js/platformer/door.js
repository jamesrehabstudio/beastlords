Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, window.BLANK_TILE);
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			var dir = this.position.subtract(obj.position);
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					this.trigger("death");
					return;
				}
			}
		}
	});
	this.on("death", function(obj){
		for(var i=0; i < this.door_blocks.length; i++){
			game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
		}
		audio.playLock("open",1.0);
		this.destroy();
	});
	
	ops = ops || {};
	if("name" in ops) this.name = ops.name;
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 8;
	this.frame_row = Math.floor( r / 8 );
}