class Door extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 20;
		this.height = 64;
		this.sprite = "doors";
		this.id = "door_" + game.map.filename + Math.floor(x) + "_" + Math.floor(y);
		this.zIndex = -1;
		
		this._tid = ops.getString("trigger", "");
		this.isOpen = ops.getBool("open", false);
		this.key = ops.getInt("key", -1);
		
		if(NPC.get(this.id)){
			this.isOpen = true;
		}
		
		this.on("activate", function(){
			this.open();
		});
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(this.key >= 0 && !this.isOpen){
					if(NPC.get("key_" + this.key)){
						this.open();
					}
				}
			}
		});
		
		this._time = this.isOpen ? 1.0 : 0.0;
		this.setTiles(this.isOpen);
	}
	setTiles(open = false){
		let c = this.corners();
		let tile = open ? 0 : 1023;
		for(let y = c.top; y < c.bottom; y++){
			game.setTile(this.position.x, y, game.tileCollideLayer, tile);
		}
	}
	open(){
		audio.play("open", this.position);
		this._time = 0.0;
		this.isOpen = true;
		this.setTiles(true);
		NPC.set(this.id, 1);
	}
	update(){
		if(this.isOpen){
			this._time = Math.clamp01(this._time += this.delta * 5);
		} else {
			this._time = Math.clamp01(this._time -= this.delta * 5);
		}
		this.frame.x = this._time * 4;
		this.frame.y = 3;
	}
	render(g,c){
		super.render(g,c);
		if(this.key >= 0 && !this.isOpen){
			g.renderSprite( this.sprite, this.position.add(new Point(10,28)).subtract(c), this.zIndex+1, new Point(this.key, 0), this.flip );
		}
	}
}
self["Door"] = Door;

/*
function Door(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.name = "";
	this.sprite = "doors";
	this.keepopen = false;
	
	this.lock = -1;
	this.isOpen = false;
	this.openAnimation = 0;
	this._tid = false;
	this.triggersave = false;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	this.close();
	
	this.on("activate", function(obj){
		if(this.isOpen){
			audio.play("open", this.position);
			this.close();
		}else {
			audio.play("open", this.position);
			this.keepopen = true;
			this.open();
		}
	});
	
	this.on("collideObject", function(obj){
		if( this.lock >= 0 && !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					audio.play("open", this.position);
					this.open();
				}
			}
		}
	});
	
	this.on("added", function(){
		if(this.lock >= 0){
			PauseMenu.pushIcon(this.mapIcon);
		}
	});
	
	
	ops = ops || {};
	
	if("name" in ops) {
		this.name = ops.name;
		this.lock = this.name.match(/\d+/) - 0;
		this.frame.x = this.lock % 4;
		this.frame.y = Math.floor( this.lock / 4 );
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("open" in ops && ops["open"] > 0) {
		this.open();
	}
	if("triggersave" in ops){
		this.triggersave = "door_" + ops["triggersave"];
		if(NPC.get(this.triggersave) != undefined){
			if(NPC.get(this.triggersave)){
				this.open();
			} else {
				this.close();
			}
		}
	}
	
	this.mapIcon = new MapIcon(x,y);
	this.mapIcon.frame = new Point(1,this.lock);
}
Door.prototype.close = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 1024);
	}
	this.zIndex = 0;
	this.isOpen = false;
	
	if(this.triggersave){
		NPC.set(this.triggersave, 0);
	}
}
Door.prototype.open = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -1;
	this.isOpen = true;
	
	if(this.triggersave){
		NPC.set(this.triggersave, 1);
	}
}
Door.prototype.update = function(){
	
	if( this.isOpen ) {
		this.openAnimation = Math.min(this.openAnimation + this.delta * 15.0, 3);
	} else {
		this.openAnimation = Math.max(this.openAnimation - this.delta * 15.0, 0);
	}
}
Door.prototype.render = function(g,c){
	g.renderSprite(
		this.sprite, 
		this.position.subtract(c), 
		this.zIndex,
		new Point(this.openAnimation, 3)
	);
	
	if( !this.isOpen && this.lock >= 0) {
		//Render lock
		g.renderSprite(
			this.sprite,
			this.position.subtract(c).add(new Point(10,36)), 
			this.zIndex+1,
			this.frame
		);
	}
}
*/

class BossDoor extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 64;
		this.sprite = "doors";
		this.frame = new Point(0,2);
		this.speed = 1.0;
		this._tid = "boss_door";
		
		this.condition = ops.getString("condition", false);
		
		this._open = false;
		this._fight = false;
		this._pos = 0.0;
		
		this.setBackTiles(1024);
		
		this.on("activate", function(){
			this._fight = !this._fight;
		});
	}
	open(){
		if(!this._open){
			this.setBackTiles(0);
			this._open = true;
			this.trigger("open");
		}
	}
	close(){
		if(this._open){
			this.setBackTiles(1024);
			this._open = false;
			this.trigger("close");
		}
	}
	setBackTiles(tile=0){
		let c = this.corners();
		let ts = 16;
		let ms = ts * 0.5;
		
		for(let x = c.left; x < c.right; x += ts){
			for(let y = c.top; y < c.bottom; y += ts){
				game.setTile(x+ms, y+ms, game.tileCollideLayer, tile);
			}
		}
	}
	update(){
		let difx = _player.position.x - this.position.x;
		
		if(this.condition && NPC.get(this.condition)){
			//Boss is dead
			this.open();
		} else if(this._fight){
			//Currently in boss fight
			this.close();
		} else if( Math.abs(difx) < 88 ){
			//Near door
			this.open();
		} else {
			//Closed
			this.close();
		}
		
		
		if(this._open){
			this._pos = Math.clamp( this._pos + this.speed, 0, 56 );
		} else {
			this._pos = Math.clamp( this._pos - this.speed, 0, 56 );
		}
	}
	render(g,c){
		g.renderSprite(this.sprite, this.position.add(new Point(-16,-this._pos)).subtract(c),this.zIndex,this.frame,this.flip);
	}
}

self["BossDoor"] = BossDoor;