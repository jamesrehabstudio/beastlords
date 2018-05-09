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
	this.speed = 0.25 * self.UNITS_PER_METER;
	this.emptyOnStart = 0;
	this.resetOnSleep = 0;
	this.triggersave = false;
	
	this.fullheight = this.height;

	
	this.active = 0;
	this.filling = 0;
	this.noFill = 0;
	this.noDrain = 0;
	this._drainTileTest = 0;
	
	this._stepTime = this.stepTimeTotal = 0.25;
	this.drainPos = this.width * 0.5;
	this.drainStr = 0.0;
	
	this.buldges = [
		{x:0,speed:0,width:0,height:0,time:0},
		{x:0,speed:0,width:0,height:0,time:0},
		{x:0,speed:0,width:0,height:0,time:0},
		{x:0,speed:0,width:0,height:0,time:0},
		{x:0,speed:0,width:0,height:0,time:0},
		{x:0,speed:0,width:0,height:0,time:0},
	];
	
	
	this.on("ontop", function(obj){
		//Apply walking force
		let xpos = obj.position.x - this.position.x;
		
		if(this._stepTime <= 0 && Math.abs(obj.force.x) > 1){
			this.addBuldge(xpos, obj.force.x * obj.mass);
		}
	});
	
	this.on("collideObject", function(obj){
		if( obj.hasModule(mod_rigidbody) && obj.gravity > 0){
			let xpos = obj.position.x - this.position.x;
			if(obj.force.y > 2){
				this.addBuldge(xpos, obj.force.y * obj.mass);
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
		this.speed = ops["speed"] * self.UNITS_PER_METER;
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
	
	if(this._stepTime <= 0) {this._stepTime = this.stepTimeTotal; }
	this._stepTime -= this.delta;
	
	for(let j=0; j < this.buldges.length; j++){
		if(this.buldges[j].height > 0){
			this.buldges[j].time += this.delta;
			this.buldges[j].height -= this.delta * 4;
			this.buldges[j].x += this.buldges[j].speed * this.delta * UNITS_PER_METER;
			
			if(this.buldges[j].x < 0) {
				this.buldges[j].x = 0;
				this.buldges[j].speed *= -0.8
			}
			if(this.buldges[j].x > this.width) {
				this.buldges[j].x = this.width;
				this.buldges[j].speed *= -0.8
			}
		}
	}
	//this.onboard = new Array();
}

Drain.prototype.addBuldge = function(xpos, force){
	force = Math.abs(force);
	
	let w = Math.min(force, 16) * 2;
	let h = w * 0.5;
	let s = 4 * force * 0.06125;
	let a = [ 
		{x:xpos-8,speed:s,width:w,height:h,time:0},
		{x:xpos+8,speed:-s,width:w,height:h,time:0},
	];
	
	for(let i=0; i < a.length; i++){
		
		let lowest = a[i].height;
		let lowestIndex = -1;
		
		for(let j=0; j < this.buldges.length; j++){
			if(this.buldges[j].height < lowest ){
				lowest = this.buldges[j].height;
				lowestIndex = j;
			}
		}
		
		if(lowestIndex >= 0){
			this.buldges[lowestIndex] = a[i];
		}
	}
}

Drain.prototype.buldgeToArray = function(i){
	return [
		this.buldges[i].x,
		this.buldges[i].width,
		this.buldges[i].height * Math.clamp01(this.buldges[i].time * 5),
	]
}
Drain.prototype.render = function(g,c){
	let margin = 32;
	
	g.renderSprite(
		"ooze", 
		this.position.subtract(new Point(0,this.height+margin)).subtract(c),
		this.zIndex,
		new Point(),
		false,
		{
			"u_time" : game.timeScaled,
			"u_size" : [this.width, this.height+margin],
			"scalex" : this.width / 256.0,
			"scaley" : (this.height+margin) / 256.0,
			"u_color" : [0.08,0.17,0.2,1.0],
			"u_highlight" : [0.16,0.66,0.58,1.0],
			"u_buldge1" : this.buldgeToArray(0),
			"u_buldge2" : this.buldgeToArray(1),
			"u_buldge3" : this.buldgeToArray(2),
			"u_buldge4" : this.buldgeToArray(3),
			"u_buldge5" : this.buldgeToArray(4),
			"u_buldge6" : this.buldgeToArray(5),
		}
	)
	
	/*
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
	*/
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