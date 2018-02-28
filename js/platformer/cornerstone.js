CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 96;
	this.gateNumber = 0;
	this.broken = 0;
	
	this.play_fanfair = false;
	this.current_music = false;
	
	if("gate" in options){
		this.gateNumber = options["gate"] * 1;
	}
	
	this.npcvarname = "templegate_" + this.gateNumber;
	this.broken = NPC.get(this.npcvarname);
	this.interactive = !this.broken;
	
	
	this.frame.x = this.broken ? 2 : 0;
	this.frame.y = this.gateNumber - 1;
	
	this.active = false;
	this.progress = 0.0;
	
	this.on("struck",function(obj,pos,damage){
		if( !this.broken && !this.active && obj instanceof Player ) {
			this.current_music = audio.get("music");
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
			//ga("send","event","cornerstone","completed temple:"+dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : 1024;
	this.fillTiles(tile);
	
	this.addModule(mod_combat);
}
CornerStone.prototype.fillTiles = function(tile){
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
			-32 + this.position.x + _x,
			-48 + this.position.y + _y,
			game.tileCollideLayer, 
			tile
		);
	}
}

CornerStone.prototype.update = function(){
	if( this.active && !this.broken ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame.x = 1;
		
		if( this.progress > Game.DELTASECOND ) {
			if( !this.play_fanfair ){
				this.play_fanfair = true;
				audio.playAs("fanfair","music");
			}
			audio.playLock("explode1",10.0);
			this.frame.x = 2;
		}
		
		if( this.progress > Game.DELTASECOND * 7.0 ) {
			game.pause = false;
			
			
			//For demo only
			if(this.gateNumber >= 4){
				game.clearAll();
				game.addObject(new DemoThanks(0,0));
				
			} else {
				NPC.set(this.npcvarname, 1);
				//WorldLocale.loadMap("townhub.tmx");
				this.fillTiles(0);
				this.broken = 1;
				this.interactive = 0;
				
				if(this.current_music){
					audio.playAs(this.current_music, "music");
				}
			}
			
			//WorldMap.open()
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}