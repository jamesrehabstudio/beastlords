Drain.prototype = new GameObject();
Drain.prototype.constructor = GameObject;
function Drain(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 1;
	this.position.x = x - d[0]*0.5;
	this.position.y = y + d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.emptyOnStart = 0;
	this.resetOnSleep = 0;
	this.triggersave = false;
	
	this.fullheight = this.height;

	
	this.active = 0;
	this.filling = 0;
	this.noFill = 0;
	this.noDrain = 0;
	this._drainTileTest = 0;
	
	this.drainPos = this.width * 0.5;
	this.drainStr = 0.0;
	this.stepPos = 0.5;
	this.stepTime = 0.0;
	this.stepTimeTotal = Game.DELTASECOND * 0.5;
	this.stepStr = 5.0;
	
	this.on("collideObject", function(obj){
		if( obj.hasModule(mod_rigidbody) && obj.gravity > 0){
			let pos = obj.position.subtract(this.position);
			let force = Math.min(obj.force.y, 5);
			let p = this.stepTime / this.stepTimeTotal;
			
			if(force < 0.1){
				if(Math.abs(obj.force.x) > 0.3){
					force = 1;
				}
			}
			
			if(force > 0 && (force > this.stepStr * p)){
				this.stepPos = pos.x / this.width;
				this.stepTime = this.stepTimeTotal;
				this.stepStr = force;
			}
		}
	});
		
	this.addModule(mod_block);
	
	this.on("activate",function(obj){
		if(this.height < 1){
			if(!this.noFill){
				this.filling = 1;
				this.active = 1;
			}
		} else {
			if(!this.noDrain){
				this.filling = 0;
				this.active = 1;
			}
		}
		if(this.triggersave){
			NPC.set(this.triggersave,1);
		}
	});
	
	this.on("reset",function(obj){
		if(this.emptyOnStart){
			this.height = 0;
		} else {
			this.height = this.fullheight;
		}
		this.active = 0;
		this.updateTiles();
	});
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("empty" in ops){
		this.emptyOnStart = ops["empty"] * 1;
		if(this.emptyOnStart){
			this.height = 0;
			this.updateTiles();
		}
	}
	if("nofill" in ops){
		this.noFill = ops["nofill"] * 1;
	}
	if("nodrain" in ops){
		this.noDrain = ops["nodrain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"] * 1;
	}
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave)){
			if(this.emptyOnStart){
				//Instant fill
				this.height = this.fullheight;
			} else {
				//Instant empty
				this.height = 0;
			}
			this.updateTiles();
		}
	}
	
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.trigger("reset");
		});
	}
}

Drain.prototype.update = function(){
	/*
	this.stepTime -= this.delta;
	if(this.stepTime <= 0){
		this.stepPos = Math.random();
		this.stepTime = Game.DELTASECOND;
	}
	*/
	this.stepTime = Math.max(this.stepTime - this.delta,0.0);
	this.drainStr = 0.0;
	
	if(this.active){
		var movement = 0;
		if(this.filling){
			movement = this.delta * this.speed;
			this.height += movement;
			if(this.height > this.fullheight){
				this.filling = 0;
				this.height = this.fullheight;
				this.active = 0;
			}
		}else{
			movement = this.delta * -this.speed;
			this.height += movement;
			if(this.height < 0){
				this.height = 0;
				this.active = 0;
			}
			
			//Set drain position for bubbles
			if(game.getTile(this.position.x+this._drainTileTest, this.position.y + 8) == 0){
				this.drainPos = this._drainTileTest + 8;
			}
			this.drainStr = 1.0;
			this._drainTileTest = (this._drainTileTest + 16) % this.width;
		}
		/*
		for(var i=0; i < this.onboard.length; i++){
			this.onboard[i].position.y -= movement;
		}
		*/
		this.updateTiles();
	}
	//this.onboard = new Array();
}

Drain.prototype.render = function(g,c){
	
	
	g.renderSprite(
		"ooze", 
		this.position.subtract(new Point(0,this.height)).subtract(c),
		this.zIndex,
		new Point(),
		false,
		{
			"u_time" : game.timeScaled * 0.01,
			"u_size" : [this.width, this.height],
			"scalex" : this.width / 64.0,
			"scaley" : this.height / 64.0,
			"u_bubbles" : [this.drainPos / this.width, this.drainStr],
			"u_distortion" : [this.stepPos, this.stepTime / this.stepTimeTotal, this.stepStr ]
		}
	)
	return;
	
	if(this.active){
		for(var x=0; x < this.width; x+=16){
			var pos = new Point(
				x + Math.round(this.position.x/16)*16,
				this.position.y - this.height
			);
			var _t = 0;
			if(x>0) _t += 1;
			if(x+16>=this.width) _t += 1;
			var tile = Drain.TILES[_t]-1;
			var tilex = tile%32;
			var tiley = Math.floor(tile/32);
			g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(tilex,tiley));
			
			//Render bottom row of tiles to hide edge
			var tile = game.getTile(this.position.x+x,this.position.y+8,game.tileCollideLayer) - 1;
			g.renderSprite(game.map.tileset,this.position.add(new Point(x,0)).subtract(c),this.zIndex,new Point(tile%32,tile/32));
		}
	}
}

Drain.prototype.updateTiles = function(){
	/*
	for(var x=0; x < this.width; x+=16){
	for(var y=0; y < this.fullheight; y+=16){
		var pos = new Point(
			this.position.x + x,
			(this.position.y - this.fullheight) + y
		);
		if(y >= this.fullheight - this.height){
			var _t = 0;
			if(x>0) _t += 1;
			if(x+16>=this.width) _t += 1;
			if(y>0) {
				_t += 3;
				if(y+16>=this.fullheight) {
					_t += 3;
				}
			}
			var tile = Drain.TILES[_t];
			game.setTile(pos.x,pos.y,game.tileCollideLayer,tile);
		} else {
			game.setTile(pos.x,pos.y,game.tileCollideLayer,0);
		}
	}}
	*/
}
Drain.TILES = [321,322,322,353,354,355,385,386,387];

Drainage.prototype = new GameObject();
Drainage.prototype.constructor = GameObject;
function Drainage(x,y,d,o){
	this.constructor();
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	this.position.x = x - (this.width / 2);
	this.position.y = y - (this.height / 2);
	this.origin.x = 0;
	this.origin.y = 0;
	this.zIndex = -1;
	
	this.flowHeight = this.height;
	this.flowSpeed = 7.0;
	this.flowTime = Game.DELTAYEAR;
	this.flowTimeFull = Game.DELTAYEAR;
	this.active = true;
	
	o = o || {};
	if("start" in o){
		this.active = o.start * 1;
		this.flowHeight = this.active ? this.flowSpeed : 0;
	}
	if("trigger" in o){
		this._tid = o.trigger;
	}
	if("flowtime" in o){
		this.flowTimeFull = o.trigger * 1;
		this.flowTime = this.flowTimeFull;
	}
	
	this.on("activate", function(obj){
		this.active = !this.active;
	});
	this.on("collideObject", function(obj){
		if(this.active){
			if( obj.hasModule(mod_rigidbody) ) {
				var dir = obj.position.subtract(this.position);
				if(!obj.grounded && dir.y < this.flowHeight){
					obj.force.y = Math.max(obj.force.y, 1.0);
					obj.force.x *= 0.85 * this.delta;
				}
			}
			if( obj.hasModule(mod_block) ){
				var top = obj.corners().top;
				this.flowHeight = Math.min(this.flowHeight, top - this.position.y);
			}
		}
	});
}
Drainage.prototype.render = function(g,c){
	if(this.active){
		this.flowHeight = Math.min(this.height, this.flowHeight + this.flowSpeed * this.delta);
		this.flowTime -= this.delta;
		if(this.flowTime <= 0){
			this.active = false;
			this.flowTime = this.flowTimeFull;
		}
	
		g.color = [0.1,0.6,0.0,1.0];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.flowHeight
		);
	}
}