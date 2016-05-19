CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y,n,o){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 0.5);
	this.width = this.height = 16;
	this.frame = 6;
	this.frame_row = 11;
	this.visible = false;
	this.totalTime = 20;
	
	this.center = new Point(this.position.x, this.position.y);
	
	//Set up
	o = o || {};
	if("timer" in o){
		this.totalTime = Game.DELTASECOND * o.timer;
	}
	if("broken" in o){
		
	}
	
	var existingTile = game.getTile(this.position.x,this.position.y);
	if(existingTile > 0){
		this.frame = Math.floor((existingTile-1) % 16);
		this.frame_row = Math.floor((existingTile-1) / 16);
	}
	
	this.timer = this.totalTime;
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.4);
		}
	});
	this.on("wakeup",function(){
		this.visible = true; 
		this.active = false;
		this.position.x = this.center.x;
		this.position.y = this.center.y;
		game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 1024);
		this.timer = this.totalTime;
	});
}
CollapseTile.prototype.update = function(){
	if( this.active ) {
		//wobble
		this.position.x = this.center.x + ( -1 + Math.random() * 2 );
		this.position.y = this.center.y + ( -1 + Math.random() * 2 );
		this.timer -= this.delta;
		
		if(this.timer < 0) this.hide();
	}
}
CollapseTile.prototype.hide = function(){
	this.active = false;
	this.visible = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
}
CollapseTile.prototype.destroy = function(){
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
	GameObject.prototype.destroy.apply(this);
}

BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y, d, ops){	
	this.constructor();
	this.center = new Point(x,y);
	this.position.x = x;
	this.position.y = y;
	this.broken = 0;
	this.spawn = false;
	this.death_time = Game.DELTASECOND * 0.15;
	this.strikeable = 1;
	this.chain = 1;
	this.life = 1;
	
	this.chaintype = "break";
	this.chaintime = Game.DELTASECOND * 0.15;
	this.chaintimer = this.chaintime;
	this.chainActive = false;
	this.chainSize = 10;
	this.target = false;
	this.resetOnSleep = 0;
	
	this.startBroken = 0;
	
	if(d[0] > 16 || d[1] > 16){
		this.origin = new Point(0.0, 0.0);
		this.width = Math.round(d[0]/16)*16;
		this.height = Math.round(d[1]/16)*16;
		this.position.x -= this.width * 0.5;
		this.position.y -= this.height * 0.5;
		
		this.undertile = new Array();
		for(var x=0; x < this.width; x+= 16){
			for(var y=0; y < this.height; y+= 16){
				var tile = game.getTile(4+this.position.x+x, 4+this.position.y+y);
				this.undertile.push(tile);
			}
		}
	} else {
		this.width = this.height = 16;
		this.undertile = game.getTile(this.position.x, this.position.y);
	}
	
	ops = ops || {};
	if( "strikeable" in ops ) {
		this.strikeable = ops["strikeable"] * 1;
	}
	if("spawn" in ops) {
		this.spawn = ops["spawn"].split(",");
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("target" in ops) {
		this.target = ops["target"].split(",");
	}
	if("broken" in ops) {
		this.startBroken = ops["broken"] * 1;
	}
	if("chain" in ops){
		this.chain = ops["chain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"];
	}
	
	this.on("activate", function(obj,pos,damage){
		if(this.broken){
			this.unbreak(true);
		}else{
			this.break(true);
		}
	});
	this.on("break", function(){
		this.break(true);
	});
	this.on("unbreak", function(){
		this.unbreak(true);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.strikeable && obj instanceof Player){
			if(!this.broken){
				if(obj.states.downStab){
					obj.force.y = -2;
					obj.jump();
				}
				if(this.target instanceof Array){
					Trigger.activate(this.target);
				}
				this.break(true);
			}
		}
	});
	
	//Set first state
	if(this.startBroken){
		this.break(false);
	}
	if(this.resetOnSleep){
		this.on("sleep", function(){
			if(this.startBroken){
				this.break(false);
			}else{
				this.unbreak(false);
			}
		});
	}
}
BreakableTile.prototype.unbreak = function(explode){
	if(this.broken && this.undertile != 0){
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
			if(this.chain) {
				this.chainActive = true;
				this.chaintype = "unbreak";
			}
		}
		if(this.undertile instanceof Array){
			var i = 0;
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						game.tileCollideLayer, 
						this.undertile[i]
					);
					i++;
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				game.tileCollideLayer, 
				this.undertile
			);
		}
		this.broken = 0;
	}
}
BreakableTile.prototype.break = function(explode){
	if(!this.broken && this.undertile != BreakableTile.unbreakable && this.undertile != 0){
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
			if(this.chain) {
				this.chainActive = true;
				this.chaintype = "break";
			}
		}
		if(this.undertile instanceof Array){
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						game.tileCollideLayer, 
						0
					);
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				game.tileCollideLayer, 
				0
			);
		}
		this.spawnObject();
		this.broken = 1;
	}
}

BreakableTile.prototype.spawnObject = function(){
	if(this.spawn instanceof Array){
		for(var i=0; i < this.spawn.length; i++){
			try{
				var item = this.spawn[i].match(/^item_(.*)$/);
				if(item){
					game.addObject(new Item(this.center.x, this.center.y,0,{"name":item[1]}));
				} else {
					game.addObject(new window[this.spawn[i]](this.center.x, this.center.y,[this.width,this.height],{}));
				}
			} catch(err){
				console.error("Cannot spawn: "+this.spawn[i]);
			}
		}
	}
}
BreakableTile.prototype.neighbours = function(type){
	
	var hits = game.overlaps(new Line(
		this.center.x - (this.width*0.5 + this.chainSize), 
		this.center.y - (this.height*0.5 + this.chainSize),
		this.center.x + (this.width*0.5 + this.chainSize), 
		this.center.y + (this.height*0.5 + this.chainSize)
	));
	for(var i=0; i< hits.length; i++) {
		if( hits[i] instanceof BreakableTile && hits[i] != this ) {
			hits[i].trigger(type, this);
		}
	}
}
BreakableTile.prototype.update = function(){
	if(this.chainActive){
		if(this.chaintimer <= 0){
			this.chainActive = false;
			this.chaintimer = this.chaintime;
			this.neighbours(this.chaintype);
		}
		this.chaintimer -= this.delta;
	}
}

BreakableTile.unbreakable = 1023;