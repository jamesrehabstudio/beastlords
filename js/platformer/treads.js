Treads.prototype = new GameObject();
Treads.prototype.constructor = GameObject;
function Treads(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = Number.MAX_SAFE_INTEGER;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.06;
	this.maxSpeed = 3.0;
	this.sprite = "treads";
	
	this.addModule(mod_block);
	
	this.force = 0.0;
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops["trigger"];
	}
	if("maxy" in ops){
		this.maxy = ops["maxy"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("maxspeed" in ops && ops["maxspeed"]){
		this.maxSpeed = ops["maxspeed"] * 1;
	}
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

Treads.prototype.update = function(){
	if(this.blockOnboard.indexOf(_player) >= 0){
		if(_player.grounded) {
			this.force += _player.force.x * this.delta * this.speed;
			_player.position.x -= this.force * this.delta;
			
			if(_player.isStuck){
				this.force = -this.force;
			}
		}
	}
	
	this.position.y -= this.force * this.delta;
	
	if(this.position.y < this.originalPosition.y - this.maxy){
		this.position.y = this.originalPosition.y - this.maxy;
		this.force = 0;
	}
	if(this.position.y > this.originalPosition.y){
		this.position.y = this.originalPosition.y;
		this.force = 0;
	}
	
	
	this.force -= this.delta * this.speed * 0.5;
	this.force = Math.min(Math.max(this.force, -this.maxSpeed), this.maxSpeed);
	
	this.frame.y = ((this.originalPosition.y-this.position.y) * 0.2 ) % 4;
}

Treads.prototype.render = function(g,c){
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = 0;
			
			if(x>0) tile += 1;
			if(x+1>=this.tileWidth) tile += 1;
			if(y+1>=this.tileHeight) tile += 3;
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
				
			g.renderSprite(this.sprite,pos.subtract(c),this.zIndex,new Point(tile,this.frame.y));
		}
	}
}
Treads.prototype.shouldRender = MovingBlock.prototype.shouldRender;
Treads.prototype.idle = function(){}