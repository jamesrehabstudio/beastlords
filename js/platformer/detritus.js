Detritus.prototype = new GameObject();
Detritus.prototype.constructor = GameObject;
function Detritus(x, y, d, ops){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.zIndex = -2;
	
	ops = ops || {};
	
	switch( game.tileSprite.name ) {
		case "tiles0": this.sprite = "detritus0"; break;
		case "tiles1": this.sprite = "detritus1"; break;
		case "tiles2": this.sprite = "detritus2"; break;
		case "tiles3": this.sprite = "detritus3"; break;
		case "tiles4": this.sprite = "detritus4"; break;
		case "tiles5": this.sprite = "detritus5"; break;
		case "tiles6": this.sprite = "detritus6"; break;
		case "tiles7": this.sprite = "detritus7"; break;
		case "tiles8": this.sprite = "detritus8"; break;
		case "tiles9": this.sprite = "detritus9"; break;
		default: this.sprite = "detritus0"; break;
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