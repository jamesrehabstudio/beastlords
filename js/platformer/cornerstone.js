CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	this.gate = "gate" in options;
	this.gate_number = 0;
	this.gate_variable = "gate_0"
	this.broken = 0;
	
	this.play_fanfair = false;
	
	if("gate" in options){
		this.gate_number = options["gate"] * 1;
		this.gate_variable = "gate_" + this.gate_number;
	}
	
	if( this.gate_variable in NPC.variables ){
		this.broken = NPC.variables[this.gate_variable];
	}
	
	
	this.frame = this.broken ? 2 : 0;
	this.frame_row = this.gate_number;
	
	this.active = false;
	this.progress = 0.0;
	this.on("struck",function(obj,pos,damage){
		if( !this.gate && !this.active && obj instanceof Player ) {
			NPC.variables[this.gate_variable] = 1;
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
			//ga("send","event","cornerstone","completed temple:"+dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : 1024;
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
			-32 + x + _x,
			-48 + y +_y,
			game.tileCollideLayer, 
			tile
		);
	}
	
	this.addModule(mod_combat);
}
CornerStone.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame = 1;
		
		if( this.progress > 33.333 ) {
			if( !this.play_fanfair ){
				this.play_fanfair = true;
				audio.playAs("fanfair","music");
			}
			audio.playLock("explode1",10.0);
			this.frame = 2;
		}
		
		if( this.progress > 233.333 ) {
			game.pause = false;
			_player.addXP(40);
			
			//For fun only
			WorldLocale.loadMap("temple2.tmx");
			
			//WorldMap.open()
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}