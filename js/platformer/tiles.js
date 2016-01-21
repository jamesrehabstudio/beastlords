window.BLANK_TILE = 16;

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
		game.setTile(this.position.x, this.position.y, game.tileCollideLayer, window.BLANK_TILE);
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
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.broken = 0;
	this.item = false;
	this.death_time = Game.DELTASECOND * 0.15;
	this.strikeable = 1;
	this.undertile = game.getTile(this.position.x, this.position.y);
	this.chain = 1;
	this.life = 1;
	
	this.chaintype = "break";
	this.chaintime = Game.DELTASECOND * 0.15;
	this.chaintimer = this.chaintime;
	this.chainActive = false;
	this.chainSize = 10;
	
	var startBroken = 0;
	
	ops = ops || {};
	if( "strikeable" in ops ) {
		this.strikeable = ops["strikeable"] * 1;
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("broken" in ops) {
		startBroken = ops["broken"] * 1;
	}
	if("chain" in ops){
		this.chain = ops["chain"] * 1;
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
				this.break(true);
			}
		}
	});
	
	//Set first state
	if(startBroken){
		this.break(false);
	}
}
BreakableTile.prototype.unbreak = function(explode){
	if(this.broken && this.undertile != 0){
		if(explode){
			game.addObject(new EffectExplosion(this.position.x, this.position.y,"crash"));
			if(this.chain) {
				this.chainActive = true;
				this.chaintype = "unbreak";
			}
		}
		game.setTile(
			this.position.x, 
			this.position.y, 
			game.tileCollideLayer, 
			this.undertile
		);
		this.broken = 0;
	}
}
BreakableTile.prototype.break = function(explode){
	if(!this.broken && this.undertile != BreakableTile.unbreakable && this.undertile != 0){
		if(explode){
			game.addObject(new EffectExplosion(this.position.x, this.position.y,"crash"));
			if(this.chain) {
				this.chainActive = true;
				this.chaintype = "break";
			}
		}
		game.setTile(
			this.position.x, 
			this.position.y, 
			game.tileCollideLayer, 
			0
		);
		this.broken = 1;
	}
}

BreakableTile.prototype.neighbours = function(type){
	
	var hits = game.overlaps(new Line(
		this.position.x - this.chainSize, this.position.y - this.chainSize,
		this.position.x + this.chainSize, this.position.y + this.chainSize
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

BreakableTile.unbreakable = 232;