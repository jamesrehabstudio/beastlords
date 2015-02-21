CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.active = false;
	this.progress = 0.0;
	this.on("struck",function(obj,pos,damage){
		if( ! this.active && obj instanceof Player ) {
			audio.stop("music");
			audio.play("crash");
			this.active = true;
		}
	});
	
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
		-32 + x + _x,
		-32 + y +_y,
		1,window.BLANK_TILE);
	}
	
	this.addModule(mod_combat);
}
CornerStone.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame = 1;
		
		if( this.progress > 33.333 ) {
			audio.playLock("fanfair",10.0);
			audio.playLock("explode1",10.0);
			this.frame = 2;
		}
		
		if( this.progress > 233.333 ) {
			//Load new level
			dataManager.randomLevel( game, dataManager.currentTemple + 1 );
			_player.life = 1;
			game.pause = false;
			_player.heal = Number.MAX_VALUE;
			_player.mana = _player.manaMax;
			_player.addXP(40);
			_player.keys = [];
			
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}