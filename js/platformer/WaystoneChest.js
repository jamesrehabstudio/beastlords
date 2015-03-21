WaystoneChest.prototype = new GameObject();
WaystoneChest.prototype.constructor = GameObject;
function WaystoneChest(x,y,d,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.waystones;
	this.width = 32;
	this.height = 48;
	options = options || {};
	
	this.addModule(mod_talk);
	this.door = "door" in options;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16)
	];
	
	if(this.door){
		this.frame = 1;
		for(var i=0; i < this.door_blocks.length; i++){
			game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, window.BLANK_TILE);
		}
	}
}
WaystoneChest.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( _player.waystones > 0 ) {
			_player.waystones -= 1;
			if(this.door){
				for(var i=0; i < this.door_blocks.length; i++){
					game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, 0);
				}
				Item.drop(this);
			} else {
				if( Math.random() > 0.2 ) {
					treasure = dataManager.randomTreasure(Math.random(), ["chest"]);
					treasure.remaining--;
					var item = new Item(this.position.x, this.position.y, treasure.name);
					item.sleep = Game.DELTASECOND;
					game.addObject(item);
				} else {
					Item.drop(this);
				}
			}
			audio.play("open");
			this.destroy();
		} else {
			audio.play("negative");
			this.open = 0;
		}
	}
}