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
	this.frame = 0;
	this.frame_row = 1;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16)
	];
	
	this.on("added",function(){
		if(this.door){
			this.frame_row = this.frame = 0;
			for(var i=0; i < this.door_blocks.length; i++){
				game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, window.BLANK_TILE);
			}
		}
	});
}
WaystoneChest.prototype.update = function(g,c){
	if( !this.interactive ) {
		this.frame = Math.min( this.frame + this.delta * 0.4, 3);
	}
	
	if( this.open > 0 ) {
		if( _player.waystones > 0 ) {
			_player.waystones -= 1;
			if(this.door){
				for(var i=0; i < this.door_blocks.length; i++){
					game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
				}
				Item.drop(this,15,Game.DELTASECOND);
			} else {
				if( Math.random() > 0.2 ) {
					treasure = dataManager.randomTreasure(Math.random(), ["chest"]);
					treasure.remaining--;
					var item = new Item(this.position.x, this.position.y, treasure.name);
					item.sleep = Game.DELTASECOND;
					game.addObject(item);
				} else {
					Item.drop(this,15,Game.DELTASECOND);
				}
			}
			audio.play("open");
			this.close();
			this.interactive = false;
		} else {
			audio.play("negative");
			this.close();
		}
	}
}