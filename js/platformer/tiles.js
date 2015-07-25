window.BLANK_TILE = 16;

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 0.5);
	this.width = this.height = 16;
	this.frame = 6;
	this.frame_row = 11;
	this.visible = false;
	
	this.center = new Point(this.position.x, this.position.y);
	
	this.timer = 20
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.4);
		}
	});
	this.on("wakeup",function(){
		this.visible = true; 
		this.active = false;
		this.position.x = this.center.x;
		this.position.y = this.center.y;
		game.setTile(this.position.x, this.position.y, game.tileCollideLayer, window.BLANK_TILE);
		this.timer = 20;
	});
}
CollapseTile.prototype.update = function(){
	if( this.active ) {
		//wobble
		this.position.x = this.center.x + ( -1 + Math.random() * 2 );
		this.position.y = this.center.y + ( -1 + Math.random() * 2 );
		this.timer -= this.delta;
		
		if(this.timer < 0) this.hide();
	}
}
CollapseTile.prototype.hide = function(){
	this.active = false;
	this.visible = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
}
CollapseTile.prototype.destroy = function(){
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
	GameObject.prototype.destroy.apply(this);
}

BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y, d, ops){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	this.death_time = Game.DELTASECOND * 0.15;
	
	ops = ops || {};
	if( "item" in ops ) {
		this.item = new Item(x,y,ops.item);
	}
	
	this.on("struck", function(obj,pos,damage){
		if( obj instanceof Player){
			//break tile
			this.life = 0;
		}
	});
}
BreakableTile.prototype.update = function(){
	if( this.life <= 0 ) this.death_time -= this.delta;
	
	if( this.death_time <= 0 ) {
		var tile = game.getTile(this.position.x, this.position.y );
		if( tile != 0 && tile != BreakableTile.unbreakable ) {
			game.addObject(new EffectExplosion(this.position.x, this.position.y,"crash"));
			game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0 );
			if( this.item instanceof Item){
				this.item.position.x = this.position.x;
				this.item.position.y = this.position.y;
				game.addObject( this.item );
			}
			//Set off neighbours
			var hits = game.overlaps(new Line(
				this.position.x - 8, this.position.y - 8,
				this.position.x + 24, this.position.y + 24
			));
			for(var i=0; i<hits.length; i++) if( hits[i] instanceof BreakableTile && hits[i].life > 0 ) {
				hits[i].trigger("struck", _player, this.position, 1);
			}
		}
		this.destroy();
	}
}

BreakableTile.unbreakable = 232;