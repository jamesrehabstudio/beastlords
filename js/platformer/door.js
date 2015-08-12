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
	
	this.isOpen = false;
	this.openAnimation = 0;
	
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
		if( !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					this.open();
				}
			}
		}
	});
	
	ops = ops || {};
	if("name" in ops) this.name = ops.name;
}
Door.prototype.open = function(){
	audio.play("open");
	
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -20;
	this.isOpen = true;
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 4;
	this.frame_row = Math.floor( r / 4 );
	
	if( this.isOpen ) {
		this.openAnimation = Math.min(this.openAnimation + this.delta * 0.5, 3);
	}
}
Door.prototype.render = function(g,c){
	this.sprite.render(g, this.position.subtract(c), this.openAnimation, 3);
	
	if( !this.isOpen ) {
		this.sprite.render(g, this.position.subtract(c).add(new Point(10,36)), this.frame, this.frame_row);
	}
}