//transform

Gate.prototype = new GameObject();
Gate.prototype.constructor = GameObject;
function Gate(x,y,d,ops){
	x -= 8;
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = sprites.gate;
	this.open = false;
	this.progress = 0;
	
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if(this.team == obj.team) return;
		if( damage >= this.minDamage ) {
			this.unlock();
		} else {
			var dir = this.position.subtract(obj.position);
			audio.playLock("block",0.25);
		}
	});
	
	this.lock = function(){
		this.open = false;
		for(var i=0; i<this.tiles.length; i++){
			game.setTile(this.tiles[i], game.tileCollideLayer, BLANK_TILE);
		}
	};
	this.unlock = function(){
		if( !this.open ) {
			this.open = true;
			audio.play("open");
			for(var i=0; i<this.tiles.length; i++){
				game.setTile(this.tiles[i], game.tileCollideLayer, 0);
			}
		}
	};
	
	this.tiles = [
		new Point(x-8, y-24),
		new Point(x-8, y-8),
		new Point(x-8, y+8),
		new Point(x+8, y-24),
		new Point(x+8, y-8),
		new Point(x+8, y+8)
	];
	
	this.minDamage = 0;
	this.lock();
	
	ops = ops || {};
	if( "min_damage" in ops ) this.minDamage = ops.min_damage;
}
Gate.prototype.update = function(){
	var increment = this.delta / (Game.DELTASECOND*0.5);
	if( this.open ) {
		this.progress = Math.min( this.progress + increment, 1.0 );
	} else { 
		this.progress = Math.max( this.progress - increment, 0.0 );
	}
	this.frame = Math.floor(Math.min(this.progress*5,4));
}