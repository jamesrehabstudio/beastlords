Detritus.prototype = new GameObject();
Detritus.prototype.constructor = GameObject;
function Detritus(x, y, d, ops){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.zIndex = -2;
	
	ops = ops || {};
	
	switch( game.tileSprite.name ) {
		case "tiles0": this.sprite = sprites.detritus0; break;
		case "tiles1": this.sprite = sprites.detritus1; break;
		case "tiles2": this.sprite = sprites.detritus2; break;
		case "tiles3": this.sprite = sprites.detritus3; break;
		case "tiles4": this.sprite = sprites.detritus4; break;
		case "tiles5": this.sprite = sprites.detritus5; break;
		case "tiles6": this.sprite = sprites.detritus6; break;
		case "tiles7": this.sprite = sprites.detritus7; break;
		case "tiles8": this.sprite = sprites.detritus8; break;
		case "tiles9": this.sprite = sprites.detritus9; break;
		default: this.sprite = sprites.detritus0; break;
	}
	this.interactive = false;
	
	this.frame = 1 + Math.floor( Math.random() * 6 );
	this.frame_row = 0;
	
	if( "side" in ops ) {
		if( ops.side == "r" ) {
			this.frame = 7;
			this.position.x -= 8;
		} else { 
			this.frame = 0;
			this.position.x += 8;
		}
	}
}

Statue.prototype = new GameObject();
Statue.prototype.constructor = GameObject;
function Statue(x, y, d, ops){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.zIndex = -3;
	
	ops = ops || {};
	var tilesetNumber = game.tileSprite.name.match(/\d+/)-0;
	
	this.sprite = sprites.statues;
	this.frame = Math.floor( Math.random() * 2 );
	this.frame_row = tilesetNumber-1;
	
	this.interactive = false;
}