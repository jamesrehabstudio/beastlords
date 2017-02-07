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
	this.blockOnboard = new Array();
	
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
	this.on("collideTop", function(obj){
		if(this.blockOnboard.indexOf(obj) < 0){
			this.blockOnboard.push(obj);
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
}

Treads.prototype.update = function(){
	if(this.block_isOnboard(_player)){
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
	this.blockOnboard = new Array();
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

Gears.prototype = new GameObject();
Gears.prototype.constructor = GameObject;
function Gears(x,y,d,ops){
	this.constructor();
	this.position.x = x - d[0] * 0.5;
	this.position.y = y - d[1] * 0.5;
	this.origin = new Point();
	this.zIndex = 1;
	this.width = d[0];
	this.height = 64;
	this.frame = new Point(0,0);
	this.sprite = "gear1"
	
	this.speed = 0.4;
	this.startX = this.position.x;
	this.moveStart = 0;
	this.moveEnd = 0;
	
	this.duckForce = 1.5;
	this.turnTransfer = 0.7;
	this.turnForce = 0.0;
	this.turnForceMax = 4.0;
	this.turnForceDrag = 0.05;
	this.turnObjectMove = 0.3;
	
	if("start" in ops){
		this.moveStart = ops["start"] * 1;
	}
	if("end" in ops){
		this.moveEnd = ops["end"] * 1;
	}
	
	this.forwardDirection = this.moveEnd > 0 ? 1 : -1;
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_rigidbody)){
			if(obj.force.y > 0){
				var fallThreshold = obj.states.duck ? 8 : 14;
				if(obj.position.y + fallThreshold < this.position.y + this.height){
					obj.position.y -= this.turnForce * this.delta * this.turnObjectMove;
					obj.trigger( "collideVertical", 1);
				}
			}
		
			if(obj instanceof Player){
				this.turnForce += obj.force.x * this.delta * this.turnTransfer;
				this.turnForce = Math.max(Math.min(this.turnForce, this.turnForceMax),-this.turnForceMax);
				
				if(obj.states.duck){
					obj.position.y += this.delta * this.duckForce;
				}
			}
		}
	});
	
	this.on("player_death", function(){
		this.position.x = this.startX;
	});
}

Gears.prototype.update = function(){
	
	if(this.turnForce == 0){
		
	} else {
		var f = (this.turnForce > 0 && this.forwardDirection > 0) || (this.turnForce < 0 && this.forwardDirection < 0);
		if(f){
			//Going towards end
			this.position.x += this.forwardDirection * Math.abs(this.turnForce) * this.speed * this.delta;
			var dif = this.position.x - this.startX;
			if((this.forwardDirection < 0 && dif < this.moveEnd) || (this.forwardDirection > 0 && dif > this.moveEnd)){
				this.position.x = this.startX + this.moveEnd;
				this.turnForce = 0;
			}
		} else {
			//Going towards start
			this.position.x -= this.forwardDirection * Math.abs(this.turnForce) * this.speed * this.delta;
			var dif = this.position.x - this.startX;
			if((this.forwardDirection > 0 && dif < this.moveStart) || (this.forwardDirection < 0 && dif > this.moveStart)){
				this.position.x = this.startX + this.moveStart;
				this.turnForce = 0;
			}
		}
	}
	
	this.frame.x = Math.mod(this.frame.x - this.turnForce * 0.1 * this.delta,5);
	this.turnForce *= 1 - (this.turnForceDrag * this.delta);
}

Gears.prototype.render = function(g,c){
	for(var i=0; i < this.width; i+= 16) {
		var f = new Point((this.frame.x+i) % 5, 0);
		g.renderSprite(this.sprite,this.position.add(new Point(i,0)).subtract(c), this.zIndex, f, false);
	}
}