SinkingBlock.prototype = new GameObject();
SinkingBlock.prototype.constructor = GameObject;
function SinkingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = Number.MAX_SAFE_INTEGER;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.sink = false;
	this.resetOnSleep = 1;
	this.triggerType = 0;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("triggertype" in ops){
		this.triggerType = ops["triggertype"] * 1;
	}
	if("maxy" in ops){
		this.maxy = ops["maxy"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("sleep" in ops){
		if(!(ops["sleep"] * 1)){
			this.idle = function(){}
		}
	}
	if("empty" in ops && ops["empty"]){
		this.height = 0;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"] * 1;
	}
	
	this.on("activate", function(obj){
		if(this.triggerType == 0){
			this.destroy();
		} else if (this.triggerType == 1){
			this.sink = 1;
		}
		
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
		if(this.position.y >= this.maxy ){
			this.sink = 0;
			this.position.y = this.maxy;
		}
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
				var t = tile-1;
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32));
			}
			i++;
		}
	}
}

MovingBlock.prototype = new GameObject();
MovingBlock.prototype.constructor = GameObject;
function MovingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.endPosition = new Point(this.position.x, this.position.y);
	this.direction = 0;
	this.width = d[0];
	this.height = d[1];
	this.speed = 1.0;
	this.move = false;
	this.loop = 0;
	this.killStuck = 0;
	this.sync = 0;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("autostart" in ops){
		this.move = ops["autostart"] * 1;
	}
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("movex" in ops){
		this.endPosition.x += ops["movex"] * 1;
	}
	if("movey" in ops){
		this.endPosition.y += ops["movey"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("loop" in ops){
		this.loop = ops["loop"] * 1;
	}
	if("killstuck" in ops){
		this.killStuck = ops["killstuck"] * 1;
	}
	
	this.on("activate", function(obj){
		this.move = 1;
	});
	
	this.on("collideObject", function(obj){
		if(this.killStuck && this.move){
			if(obj.hasModule(mod_rigidbody) && obj.hasModule(mod_combat)){
				if(obj.isStuck){
					if(obj instanceof Player && obj.states.ledgeObject == this){
						obj.trigger("dropLedge");
					} else {
						if(this.dotDirection(obj.position) > 0.1){
							obj.invincible = -1;
							obj.hurt( this, Math.floor( 9999 ) );
						} else {
							console.log("Spare crushing object");
						}
					}
				}
			}
		} else {
			//fall off platform if obj hits a tile
			if(obj.isStuck && obj instanceof Player && obj.states.ledgeObject == this){
				obj.trigger("dropLedge");
			}
		}
	});
	
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
	
	if("sync" in ops){
		this.sync = true;
		this.position = Point.lerp(this.startPosition, this.endPosition, ops["sync"] * 1);
	}
}

MovingBlock.prototype.idle = function(){
	if(!this.sync){
		GameObject.prototype.idle.apply(this);
	}
}

MovingBlock.prototype.update = function(){
	if(this.move){
		var s = this.speed * this.delta;
		var des = this.direction == 0 ? this.endPosition : this.startPosition;
		var dif = des.subtract(this.position);
		var dir = dif.normalize(s);
		if(dif.length() <= s ){
			this.destinationReached();
		} else {
			this.position = this.position.add(dir);
		}
	}
}
MovingBlock.prototype.dotDirection = function(p){
	var pos = p.subtract(this.position);
	return pos.dot(this.getDirection());
}
MovingBlock.prototype.getDirection = function(){
	var des = this.direction == 0 ? this.endPosition : this.startPosition;
	var dif = des.subtract(this.position);
	return dif.normalize();
}
MovingBlock.prototype.destinationReached = function(){
	var des = this.direction == 0 ? this.endPosition : this.startPosition;
	this.position.x = des.x;
	this.position.y = des.y;
	this.direction = this.direction == 0 ? 1 : 0;
	if(!this.loop){
		this.move = 0;
	}
}

MovingBlock.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
				
			if(tile > 0){
				var t = tile-1;
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32));
			}
			i++;
		}
	}
}