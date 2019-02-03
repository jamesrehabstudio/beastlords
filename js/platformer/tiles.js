CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y,d,o){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.map.tileset;
	this.origin = new Point(0.0, 0.5);
	this.width = this.height = 16;
	this.frame.x = 6;
	this.frame.y = 11;
	this.visible = false;
	this.totalTime = Game.DELTASECOND * 0.6;
	
	this.center = new Point(this.position.x, this.position.y);
	
	//Set up
	o = o || {};
	if("timer" in o){
		this.totalTime = Game.DELTASECOND * o.timer;
	}
	this.resetonsleep = o.getBool("resetonsleep", true)
	
	var existingTile = game.getTile(this.position.x,this.position.y);
	if(existingTile > 0){
		this.frame.x = Math.floor((existingTile-1) % 32);
		this.frame.y = Math.floor((existingTile-1) / 32);
	}
	
	this.timer = this.totalTime;
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.4);
		}
	});
	this.on("added", function(){
		this.reset();
	});
	this.on("wakeup",function(){
		if(this.resetonsleep){
			this.reset();
		}
	});
}
CollapseTile.prototype.reset = function(){
	this.visible = true; 
	this.active = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 1024);
	this.timer = this.totalTime;
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

class BreakableTile extends GameObject {
	get center(){ return this.position.scale(1); }
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		
		this._tid = ops.getString("trigger", "");
		
		this.team = 0;
		this.broken = ops.getBool("broken", false);
		this.fixable = ops.getBool("fixable", false);
		this.chain = ops.getBool("chain", true);
		this.strikeable = ops.getBool("strikeable", true);
		this.chaintimeMax = ops.getFloat("delay", 0.15) * Game.DELTASECOND;
		this.repairTime = ops.getFloat("delay", 31104000.0) * Game.DELTASECOND;
		this.chainMargin = ops.getInt("chainmargin", 14);
		this.layer = ops.getInt("layer", game.tileCollideLayer);
		this.triggersave = ops.getString("triggersave", "");
		this.targets = ops.getList("target", []);
		
		if(this.triggersave){
			this.broken = NPC.get(this.triggersave) == 1;
		}
		
		this.on("struck", function(obj, pos){
			if(obj.team != this.team){
				if(!this.broken && this.strikeable){
					obj.trigger("break_tile", this);
					this.break();
				}
			}
		});
		this.on("activate", function(){
			if(this.broken){
				this.fix();
			} else {
				this.break();
			}
		});
		
		this._tiles = new Array();
		this._chaining = false;
		this._chainTime = 0.0;
		this._repair = 0.0;
		
		this.getTiles();
		this.setTiles(this.broken);
	}
	getTiles(){
		let c = this.corners();
		for(let x=c.left; x < c.right; x+=16) for(let y=c.top; y < c.bottom; y+=16) {
			this._tiles.push( game.getTile(x, y, this.layer) );
		}
	}
	setTiles(remove=true){
		let c = this.corners();
		let i = 0;
		for(let x=c.left; x < c.right; x+=16) for(let y=c.top; y < c.bottom; y+=16) {
			let tile = remove ? 0 : this._tiles[i];
			game.setTile(x, y, this.layer, tile);
			i++;
		}
		if(this.triggersave){
			NPC.set(this.triggersave, remove ? 1 : 0);
		}
	}
	break(){
		game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		this.broken = true;
		this.setTiles(this.broken);
		this._repair = 0.0;
		
		if(this.chain){
			this._chaining = true;
			this._chainTime = 0.0;
		}
		Trigger.activate(this.targets);
	}
	fix(){
		if(this.fixable){			
			this.broken = false;
			this.setTiles(this.broken);
			this._chainTime = 0.0;
		}
	}
	chainNext(){
		let c = this.corners();
		let hits = game.overlaps(new Line(
			c.left - this.chainMargin,
			c.top - this.chainMargin,
			c.right + this.chainMargin,
			c.bottom + this.chainMargin,
		));
		for(let i=0; i < hits.length; i++){
			if(hits[i] instanceof BreakableTile){
				if(this.broken && !hits[i].broken){
					hits[i].break();
				} else if(!this.broken && hits[i].broken){
					hits[i].fix();
				}
			}
		}
		this._chaining = false;
	}
	idle(){
		if(this._chaining){
			this._chainTime += game.delta;
			if(this._chainTime >= this.chaintimeMax){
				this.chainNext();
			}
		}
		if(this.broken && this.fixable){
			this._repair += game.delta;
			if(this._repair >= this.repairTime){
				this.fix();
			}
		}
		return super.idle();
	}
	update(){}
	render(){}
}
self["BreakableTile"] = BreakableTile;

/*
BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y, d, ops){	
	this.constructor();
	this.center = new Point(x,y);
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.broken = 0;
	this.spawn = false;
	this.death_time = Game.DELTASECOND * 0.15;
	this.strikeable = 1;
	this.chain = 1;
	this.life = 1;
	
	this.resetOnDeath = false;
	this.chaintype = "break";
	this.chaintime = Game.DELTASECOND * 0.15;
	this.chaintimer = this.chaintime;
	this.chainActive = false;
	this.chainSize = 10;
	this.canUnbreak = true;
	this.target = false;
	this.resetOnSleep = 0;
	this.tileLayer = game.tileCollideLayer;
	this.explode = 1;
	this.triggersave = false;
	
	this.breakable = true;
	this.fixable = true;
	
	this.startBroken = 0;
	
	ops = ops || {};
	if("tilelayer" in ops){
		this.tileLayer = ops["tilelayer"] * 1;
	}
	
	this.gatherTiles(false);
	
	this.strikeable = ops.getBool("strikeable", true);
	this.blastable = ops.getBool("blastable", true);
	
	if("spawn" in ops) {
		this.spawn = ops["spawn"].split(",");
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("target" in ops) {
		this.target = ops["target"].split(",");
	}
	if("chaintimer" in ops) {
		this.chaintime = Game.DELTASECOND * ops["chaintimer"];
		this.chaintimer = this.chaintime;
	}
	if("broken" in ops) {
		this.startBroken = ops["broken"] * 1;
	}
	if("breakable" in ops){
		this.breakable =  ops["breakable"] * 1;
	}
	if("fixable" in ops){
		this.fixable =  ops["fixable"] * 1;
	}
	if("chain" in ops){
		this.chain = ops["chain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"];
	}
	if("resetondeath" in ops){
		this.resetOnDeath = ops["resetondeath"] * 1;
	}
	if("explode" in ops){
		this.explode = ops["explode"] * 1;
	}
	
	this.on("activate", function(obj,pos,damage){
		if(this.broken){
			this.unbreak(this.explode);
		}else{
			this.break(this.explode);
		}
	});
	this.on("break", function(){
		this.break(this.explode);
	});
	this.on("unbreak", function(){
		this.unbreak(this.explode);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.strikeable && obj instanceof Player){
			if(this.triggersave){
				NPC.set(this.triggersave, 1);
			}
			if(!this.broken){
				obj.trigger("break_tile", this, damage);
				if(this.target instanceof Array){
					Trigger.activate(this.target);
				}
				this.break(this.explode);
			}
		}
	});
	this.on("blasted", function(obj){
		if( this.blastable ) {
			if(this.triggersave){
				NPC.set(this.triggersave, 1);
			}
			if(!this.broken){
				obj.trigger("break_tile", this, 0);
				if(this.target instanceof Array){
					Trigger.activate(this.target);
				}
				this.break(this.explode);
			}
		}
	});
	
	//Set first state
	if(this.startBroken){
		var tempChain = this.chain;
		this.chain = 0;
		this.break(false);
		this.chain = tempChain;
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
	if(this.resetOnDeath){
		this.on("player_death", function(){
			if(this.startBroken){
				this.break(false);
			}else{
				this.unbreak(false);
			}
		}); 
	}
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave) != undefined){
			var tempChain = this.chain;
			this.chain = 0;
			if(NPC.get(this.triggersave)){
				this.break(false);
			} else {
				this.unbreak(false);
			}
			this.chain = tempChain;
		}
	}
}
BreakableTile.prototype.gatherTiles = function(removeOriginal=false){
	let ts = 16;
	if(this.width > ts || this.height > ts){
		this.origin = new Point(0.0, 0.0);
		this.width = Math.round(this.width/ts)*ts;
		this.height = Math.round(this.height/ts)*ts;
		this.position.x -= this.width * 0.5;
		this.position.y -= this.height * 0.5;
		
		this.undertile = new Array();
		for(var x=0; x < this.width; x+= ts){
			for(var y=0; y < this.height; y+= ts){
				var tile = game.getTile(4+this.position.x+x, 4+this.position.y+y, this.tileLayer);
				this.undertile.push(tile);
			}
		}
	} else {
		this.width = this.height = ts;
		this.undertile = game.getTile(this.position.x, this.position.y, this.tileLayer);
	}
}

BreakableTile.prototype.unbreak = function(explode){
	if(this.broken && this.undertile != 0 && this.fixable){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "unbreak";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.triggersave){
			NPC.set(this.triggersave, 0);
		}
		if(this.undertile instanceof Array){
			var i = 0;
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						this.tileLayer, 
						this.undertile[i]
					);
					i++;
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				this.tileLayer, 
				this.undertile
			);
		}
		this.broken = 0;
	}
}
BreakableTile.prototype.break = function(explode){
	if(!this.broken && this.breakable && this.undertile != 0){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "break";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.triggersave){
			NPC.set(this.triggersave, 1);
		}
		if(this.undertile instanceof Array){
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						this.tileLayer, 
						0
					);
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				this.tileLayer, 
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
	var corners = this.corners()
	var hits = game.overlaps(new Line(
		corners.left - this.chainSize, 
		corners.top - this.chainSize,
		corners.right + this.chainSize, 
		corners.bottom + this.chainSize
	));
	for(var i=0; i< hits.length; i++) {
		if( hits[i] instanceof BreakableTile && hits[i] != this ) {
			if(hits[i].chain){
				hits[i].trigger(type, this);
			}
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
*/
BreakableTile.unbreakable = 1023;

SpeedTile.prototype = new GameObject();
SpeedTile.prototype.constructor = GameObject;
function SpeedTile(x, y, d, ops){	
	this.constructor();
	this.padding = 8;
	this.origin.x = this.origin.y = 0.0;
	this.width = Math.roundTo(d[0],16) + this.padding * 2;
	this.height = Math.roundTo(d[1],16);
	this.position.x = x - 0.5 * this.width;
	this.position.y = y - 0.5 * this.height;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			var dir = this.position.subtract(obj.position);
			if(obj.states.airdash > 0.0 && obj.dodgeFlash){
				if((obj.flip && dir.x < 0) || (!obj.flip && dir.x > 0)){
					this.break();
				}
			}
		}
	});
}
SpeedTile.prototype.break = function(){
	var right = (this.position.x + this.width) - this.padding * 2;
	var bottom = this.position.y + this.height;
	
	for(var x = this.position.x + this.padding; x < right; x+=16){
		for(var y = this.position.y; y < bottom; y+=16){
			game.setTile(x,y,game.tileCollideLayer,0);
		}
	}
	
	game.addObject(new EffectExplosion(this.position.x + this.width * 0.5, this.position.y + this.height * 0.5,"crash"));
	this.destroy();
}