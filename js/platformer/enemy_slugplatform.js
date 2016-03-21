SlugPlatform.prototype = new GameObject();
SlugPlatform.prototype.constructor = GameObject;
function SlugPlatform(x,y,d,o){
	this.constructor();
	
	var bottom = y + d[1] * 0.5;
	
	this.position.x = x;
	this.position.y = bottom - 40;
	this.startPosition = new Point(this.position.x,this.position.y);
	this.width = 48;
	this.height = 16;
	this.origin = new Point(0.5,0.0);
	this.active = true;
	this.loop = true;
	this.leftStart = false;
	
	this.speed = 1.5;
	this.sprite = sprites.slugplatform;
	this.waitforplayer = 0;
	
	this.addModule( mod_block );

	o = o || {};
	if("speed" in o){
		this.speed = o["speed"] * 1;
	}
	if("waitforplayer" in o){
		this.waitforplayer = o["waitforplayer"] * 1;
	}
	if("loop" in o){
		this.loop = o["loop"] * 1;
	}
	
	if(this.waitforplayer){
		this.active = false;
		this.on("blockLand",function(obj){
			if(obj instanceof Player){
				this.active = true;
			}
		});
	}
}
SlugPlatform.prototype.update = function(){
	
	if(this.active){
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
		
		if(!this.loop){
			if(!this.leftStart){
				if(Math.abs(this.position.x-this.startPosition.x) > 16){
					this.leftStart = true;
				}
			} else {
				if(Math.abs(this.position.x-this.startPosition.x) < 8){
					this.position.x = this.startPosition.x;
					this.active = false;
					this.flip = false;
					this.leftStart = false;
				}
			}
		}
	}
	game.collideObject(this);
}

SlugPlatform.prototype.idle = function(){}