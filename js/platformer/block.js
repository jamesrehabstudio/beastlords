SinkingBlock.prototype = new GameObject();
SinkingBlock.prototype.constructor = GameObject;
function SinkingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.sink = false;
	this.resetOnSleep = 1;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("empty" in ops && ops["empty"]){
		this.height = 0;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"] * 1;
	}
	
	this.on("activate", function(obj){
		this.destroy();
	});
	this.on("blockLand", function(obj){
		if(obj instanceof Player){
			this.sink = true;
		}
	});
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.position.x = this.originalPosition.x;
			this.position.y = this.originalPosition.y;
			this.sink = false;
		});
	}
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

SinkingBlock.prototype.update = function(){
	if(this.sink){
		this.position.y += this.speed * this.delta;
	}
}

SinkingBlock.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
			
			if(tile > 0){
				game.tileSprite.render(g,pos.subtract(c),tile-1);
			}
			i++;
		}
	}
}