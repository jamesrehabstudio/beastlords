Block.prototype = new GameObject();
Block.prototype.constructor = GameObject;
function Block(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.width = d[0];
	this.height = d[1];
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.gatherTiles();
}

Block.prototype.gatherTiles = function(eraseOriginalTiles=true){
	var ts = 16;
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / ts);
	this.tileHeight = Math.ceil(this.height / ts);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tilePos = new Point(
				Math.roundTo(this.position.x + x*ts,ts),
				Math.roundTo(this.position.y + y*ts,ts)
			);
			var tile = game.getTile(tilePos.x, tilePos.y);
			this.tiles.push(tile);
			
			if(eraseOriginalTiles){
				game.setTile(tilePos.x, tilePos.y, game.tileCollideLayer, 0);
			}
		}
	}
}

Block.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			var ts = 16;
			
				
			if(tile > 0){
				let tileData = getTileData(tile);
				let t = tileData.tile-1;
				let f = tileData.hflip;
				
				var pos = new Point(
					this.position.x + (x + (f?1:0)) * ts,
					this.position.y + y * ts
				);
				
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32),f);
			}
			i++;
		}
	}
}

EnemyBlock.prototype = new GameObject();
EnemyBlock.prototype.constructor = GameObject;
function EnemyBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.visible = false;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.blockCollideCriteria = function(obj){
		return (
			obj.hasModule(mod_rigidbody) &&
			obj.hasModule(mod_combat) &&
			obj.team == 0
		);
	}
}

SinkingBlock.prototype = new GameObject();
SinkingBlock.prototype.constructor = GameObject;
function SinkingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = this.maxy = ops.getFloat("maxy",Number.MAX_SAFE_INTEGER);
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25 * UNITS_PER_METER;
	this.force_y = 0.0;
	this.gravity = 0.0;
	this.sink = false;
	this.sinkOnLedge = ops.getBool("sinkonledge", true);;
	this.resetOnSleep = ops.getBool("resetonsleep", true);;
	this.resetOnDeath = ops.getBool("resetondeath", false);
	this.triggerType = ops.getInt("triggertype", 0);
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("gravity" in ops){
		this.speed = 0.0;
		this.gravity = ops["gravity"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * UNITS_PER_METER;
	}
	if("sleep" in ops){
		if(!(ops["sleep"] * 1)){
			this.idle = function(){}
		}
	}
	if("empty" in ops && ops["empty"]){
		this.height = 0;
	}
	this.on("player_death", function(){
		if(this.resetOnDeath){
			this.position.x = this.originalPosition.x;
			this.position.y = this.originalPosition.y;
			this.interactive = this.visible = true;
			this.sink = false;
		}
	});
	this.on(["collideLeft","collideRight"], function(obj){
		if(this.sinkOnLedge && obj instanceof Player){
			this.sink = true;
		}
	});
	this.on("activate", function(obj){
		if(this.triggerType == SinkingBlock.TRIGGERTYPE_DESTROY){
			this.destroy();
		} else if (this.triggerType == SinkingBlock.TRIGGERTYPE_SINK){
			this.sink = 1;
		}
		
	});
	this.on("blockLand", function(obj){
		if(obj instanceof Player){
			this.sink = true;
		}
	});
	if(this.resetOnSleep){
		this._sinkSleepTime = 0;
		this.on("wakeup", function(){
			if(this._sinkSleepTime <= game.time - 5){
				this.interactive = this.visible = true;
			}
			
		});
		this.on("sleep", function(){
			if(this.sink){
				this.position.x = this.originalPosition.x;
				this.position.y = this.originalPosition.y;
				this.sink = this.interactive = this.visible = false;
				this._sinkSleepTime = game.time;
			}
		});
	}
	
	this.gatherTiles();
}
SinkingBlock.prototype.update = function(){
	if(this.sink){
		this.force_y += this.gravity * this.delta;
		this.position.y += ( this.speed + this.force_y ) * this.delta;
		if(this.position.y >= this.maxy ){
			this.sink = 0;
			this.position.y = this.maxy;
		}
	} else {
		this.force_y = 0.0;
	}
}

SinkingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
SinkingBlock.prototype.render = Block.prototype.render;
SinkingBlock.TRIGGERTYPE_DESTROY = 0;
SinkingBlock.TRIGGERTYPE_SINK = 1;

FallingBlock.prototype = new GameObject();
FallingBlock.prototype.constructor = GameObject;
function FallingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.force = new Point(0,0);
	this.gravity = 1.0;
	this.maxFall = 10.0;
	this.resetOnDeath = false;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("resetondeath" in ops){
		this.resetOnDeath = ops["resetondeath"] * 1;
	}
	
	this.on("collideVertical", function(y){
		if(this.force.y >= this.maxFall){
			shakeCamera(Game.DELTASECOND*1.6,5);
			audio.play("explode1",this.position);
		}
		
		this.force.y = 0;
	});
	this.on("objectStuck", function(obj){
		if(obj.isStuck && obj.hasModule(mod_combat)){
			obj.invincible = -1;
			obj.hurt( this, Math.floor( 9999 ) );
		}
	});
	this.on("player_death", function(obj){
		if(this.resetOnDeath){
			this.force.x = this.force.y = 0;
			this.position.x = this.startPosition.x;
			this.position.y = this.startPosition.y;
		}
	});
	
	this.gatherTiles();
}

FallingBlock.prototype.idle = function(){}
FallingBlock.prototype.corners = function(){
	var b = GameObject.prototype.corners.apply(this);
	b.left += 1;
	b.right -= 1;
	return b;
}

FallingBlock.prototype.update = function(){
	this.force.y = Math.min(this.force.y + this.gravity * this.delta, this.maxFall);
	this.position.x = this.startPosition.x;
	game.t_move(this, this.force.x * this.delta, this.force.y * this.delta);
}
FallingBlock.prototype.shouldRender = function(){
	var c = this.corners();
	var l = new Line(c.left,c.top,c.right,c.bottom).transpose(game.camera.scale(-1));
	return l.overlaps(new Line(0,0,game.resolution.x,game.resolution.y));
}
FallingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
FallingBlock.prototype.render = Block.prototype.render;


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
	this.wait = 0.0;
	this.waitTime = 0.0;
	this.killStuck = 0;
	this.sync = 0;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.move = ops.getBool("autostart", false);
	this.loop = ops.getBool("loop", false);
	this.wait = ops.getFloat("wait", 0.0) * Game.DELTASECOND;
	this.sync = ops.getFloat("sync", 0,0);
	
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
		this.speed = ops["speed"] * 30;
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
			//if(obj.isStuck && obj instanceof Player && obj.states.ledgeObject == this){
			//	obj.trigger("dropLedge");
			//}
			
			/*
			if(obj instanceof Player && obj.states.ledgeObject != this){
				obj.trigger("dropLedge");
			}
			*/
		}
	});
	
	this.gatherTiles();
	
	this.time = this.startPosition.subtract(this.endPosition).magnitude() / this.speed;
	this.totalTime = this.time + this.wait;
	this._progress = 0.0;
}

MovingBlock.prototype.evaluate = function(f){
	let l = this.loop ? 2 : 1;
	let r = this.time / this.totalTime;
	
	if(f < 0.5 || !this.loop){
		return Math.clamp01(f * l) / r;
	} else {
		a = 1 + (1 / r);
		return Math.clamp01(a - (f * l) / r);
		//return a - Math.clamp01(f * l) / r;
	}
}
MovingBlock.prototype.idle = function(){
}

MovingBlock.prototype.update = function(){
	if(this.move){
		let a = 0;
		
		if(this.sync){
			a = (this.sync + game.timeScaled / this.totalTime) % 1.0;
		} else {
			this._progress = Math.clamp01( this._progress + this.delta / this.totalTime);
			a = this._progress;
		}
		
		let d = Math.clamp01(this.evaluate(a));
		this.position = Point.lerp(this.startPosition, this.endPosition, d);
	}
	return;
	
	if(this.waitTime > 0){
		this.waitTime -= this.delta;
	} else if(this.move){
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
	this.waitTime = this.wait;
	if(!this.loop){
		this.move = 0;
	}
}
MovingBlock.prototype.shouldRender = function(){
	var c = this.corners();
	var l = new Line(c.left,c.top,c.right,c.bottom).transpose(game.camera.scale(-1));
	return l.overlaps(new Line(0,0,game.resolution.x,game.resolution.y));
}
MovingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
MovingBlock.prototype.render = Block.prototype.render;

FloatBlock.prototype = new GameObject();
FloatBlock.prototype.constructor = GameObject;
function FloatBlock(x,y,d,ops){
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
	this.rubberband = 0;
	this.stopwait = 0;
	this.force = new Point();
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	
	this.gatherTiles();
}

FloatBlock.prototype.idle = function(){}

FloatBlock.prototype.update = function(){
	if(this.block_isOnboard(_player)){
		//Someone on board
		if(this.rubberband > 0){
			this.force.y *= 1 - (0.1 * this.delta);
			this.rubberband -= this.delta;
		} else {
			this.force.y = Math.min(this.force.y + this.speed * this.delta * 0.2, this.speed * 3);
		}
		var speed = this.force.y * this.delta;
		this.position.y += speed;
		this.stopwait = Game.DELTASECOND;
	} else if (this.stopwait > 0){
		this.stopwait -= this.delta;
	} else {
		//return to position
		this.rubberband = Game.DELTASECOND * 0.6;
		this.force.y = 2;
		if(this.position.y > this.startPosition.y){
			var speed = this.speed * this.delta;
			if(this.position.y - speed <= this.startPosition.y){
				this.position.y = this.startPosition.y;
			} else {
				this.position.y -= speed;
			}
		}
	}
}

FloatBlock.prototype.shouldRender = MovingBlock.prototype.shouldRender;
FloatBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
FloatBlock.prototype.render = Block.prototype.render;

LoopBlock.prototype = new GameObject();
LoopBlock.prototype.constructor = GameObject;
function LoopBlock(x,y,d,ops){
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
	
	this.force = new Point();
	this.friction = 0.001;
	this.appliedForceTop = 0.0125;
	this.appliedForceBot = 0.25;
	this.speedMax = 8;
	this.loopArea = new Line(
		this.position.x - 128, 
		this.position.y - 120, 
		this.position.x + 128, 
		this.position.y + 120
	);
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("looptop" in ops){
		this.loopArea.start.y += ops["looptop"] * 1;
	}
	if("loopbottom" in ops){
		this.loopArea.end.y += ops["loopbottom"] * 1;
	}
	
	this.on("collideTop", function(obj){
		this.force.y += Math.max(obj.force.y * this.appliedForceTop, 0);
	});
	this.on("collideBottom", function(obj){
		this.force.y += Math.min(obj.force.y * this.appliedForceBot, 0);
	});
	
	this.gatherTiles();
}

LoopBlock.prototype.idle = function(){}

LoopBlock.prototype.update = function(){
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	
	this.force.x = Math.min(Math.max(this.force.x,-this.speedMax),this.speedMax);
	this.force.y = Math.min(Math.max(this.force.y,-this.speedMax),this.speedMax);
	
	this.force.x *= 1 - (this.friction*this.delta);
	this.force.y *= 1 - (this.friction*this.delta);
	
	if(this.position.x < this.loopArea.start.x){
		this.position.x = this.loopArea.end.x// - (this.loopArea.start.x - this.position.x);
	}
	if(this.position.x > this.loopArea.end.x){
		this.position.x = this.loopArea.start.x// + (this.loopArea.end.x - this.position.x);
	}
	if(this.position.y < this.loopArea.start.y){
		this.position.y = this.loopArea.end.y// - (this.loopArea.start.y - this.position.y);
	}
	if(this.position.y > this.loopArea.end.y){
		this.position.y = this.loopArea.start.y// + (this.loopArea.end.y - this.position.y);
	}
}

LoopBlock.prototype.shouldRender = MovingBlock.prototype.shouldRender;
LoopBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
LoopBlock.prototype.render = Block.prototype.render;


Crusher.prototype = new GameObject();
Crusher.prototype.constructor = GameObject;
function Crusher(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.speed = 1.0;
	this.fallSpeed = 5.0;
	this.move = false;
	this.killStuck = 1;
	this.margin = 32;
	
	this.states = {
		"phase" : 0,
		"cooldown" : 0.0
	};
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.on("collideObject", function(obj){
		if(this.move && obj.hasModule(mod_block)){
			this.states.phase = 2;
			this.states.cooldown = Game.DELTASECOND;
		} else if(this.killStuck && this.move){
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
	
	this.gatherTiles();
}

Crusher.prototype.lowest = function(){
	var c = this.corners();
	var y = c.bottom + 8;
	var x1 = c.left;
	var x2 = c.right;
	
	for(var x = x1; x < x2; x+=16){
		var tile = game.getTile(x,y);
		if(tile != 0 ){
			return Math.floor(y/16)*16;
		}
	}
	return Number.MAX_SAFE_INTEGER;
}

Crusher.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.states.phase == 0){
		//Wait for player
		this.move = false;
		var c = this.corners();
		if(
			_player.position.y > this.position.y &&
			_player.position.x + this.margin > c.left &&
			_player.position.x - this.margin < c.right
		){
			this.states.phase = 1;
			this.states.cooldown = Game.DELTASECOND;
		}
	} else if(this.states.phase == 1){
		//falling
		this.move = true;
		this.position.y += this.delta * this.fallSpeed;
		var l = this.lowest();
		
		if(this.position.y + this.height >= l){
			this.states.phase = 2;
			this.position.y = l - this.height;
		}
	} else if(this.states.phase == 2){
		//Rest on floor
		this.move = false;
		this.states.cooldown -= this.delta;
		if(this.states.cooldown <= 0){
			this.states.phase = 3;
		}
	} else {
		//Move up
		this.move = true;
		this.position.y -= this.delta * this.speed;
		if(this.position.y <= this.startPosition.y){
			this.position.y = this.startPosition.y;
			this.states.phase = 0;
		}
	}
}
Crusher.prototype.getDirection = function(){
	if(this.states.phase == 1) return new Point(0,1);
	if(this.states.phase == 3) return new Point(0,-1);
	return new Point(0,0);
};
Crusher.prototype.shouldRender = MovingBlock.prototype.shouldRender;
Crusher.prototype.dotDirection = MovingBlock.prototype.dotDirection;
Crusher.prototype.gatherTiles = Block.prototype.gatherTiles;
Crusher.prototype.render = Block.prototype.render;

class CollapsingBlock extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - d[0]*0.5;
		this.position.y = y - d[1]*0.5;		
		this.startPosition = this.position.scale(1);
		this.origin.x = 0;
		this.origin.y = 0;
		this.width = d[0];
		this.height = d[1];
		
		this.addModule(mod_block);
		
		this.collapseTime = ops.getFloat("timer", 1) * Game.DELTASECOND;
		this.speed = ops.getFloat("speed", 2.0);
		this.playerOnly = ops.getBool("playeronly", true);
		this.autoCancel = ops.getBool("autocancel", true);
		this.blockTopOnly = ops.getBool("toponly", true);
		
		Block.prototype.gatherTiles.apply(this);
		
		this._cTime = this.collapseTime;
		this._fTime = 0.0;
		this._falling = false;
		
		this.on("ontop", function(obj){
			if(!this.playerOnly || obj instanceof Player){
				this._fTime = Game.DELTASECOND * 0.0625;
			}
		});
		
		this.on("sleep", function(){
			this.position.y = this.startPosition.y;
			this._fTime = 0.0;
			this._cTime = this.collapseTime;
			
			if(!game.insideScreen(this.position)){
				//If the respawn is on screen hide it
				this._falling = false;
			}
		});
		
		this.on("wakeup", function(){
			if(this._falling){
				this.visible = this.interactive = false;
			} else {
				this.visible = this.interactive = true;
			}
			this._falling = false;
		});
	}
	update(){
		if(this._falling){
			this.position.y += this.speed * this.delta * UNITS_PER_METER;
		} else {
			if(this._fTime > 0){
				this._fTime -= this.delta;
				this._cTime -= this.delta;
				if(this._cTime <= 0){
					this._falling = true;
				}
			} else {
				this._cTime = this.collapseTime;
			}
		}
	}
	render(g,c){
		if(this._fTime > 0 && !this._falling){
			c = c.add( new Point( (Math.random()-0.5) * 4, (Math.random()-0.5) * 4 ) );
		}
		Block.prototype.render.apply(this,[g,c]);
	}
}
self["CollapsingBlock"] = CollapsingBlock;