SceneCaveRock.prototype = new GameObject();
SceneCaveRock.prototype.constructor = GameObject;
function SceneCaveRock(x,y,dim,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.start = new Point(x,y);
	this.end = new Point(x,y+16*5);
	
	this.sprite = "cornerstones";
	
	this._tid = "caverock";
	this.active = false;
	this.isOpen = false;
	this.progress = 0.0;
	this.speed = 1 / (Game.DELTASECOND * 4);
	
	this.tiles = new Array();
	for(var i=0; i < dim[0]; i+=16) for(var j=0; j < dim[1]; j+=16) {
		this.tiles.push(new Point(
			(x + 8 + i) - (dim[0]*0.5),
			(y + 8 + j) - (dim[1]*0.5)
		));
	}
	
	if(Quests.q0 == Quests.COMPLETED){
		this.open();
	}else{
		this.close();
	}
	
	this.on("activate", function(){
		if(!this.isOpen){
			this.active = true;
		}
	});
	
	this.frame = 0;
	this.frame_row = 0;
}

SceneCaveRock.prototype.update = function(){
	if(this.active){
		this.position = Point.lerp(this.start,this.end,this.progress);
		
		if(this.progress < 1){
			window.shakeCamera(10,4);
			audio.playLock("cracking",0.2);
		} else {
			this.active = false;
			this.open();
			Quests.set("q0",Quests.COMPLETED);
		}
		
		this.progress = Math.min(this.progress + this.delta * this.speed, 1.0);
	}
}
SceneCaveRock.prototype.open = function(){
	this.isOpen = true;
	this.position.x = this.end.x;
	this.position.y = this.end.y;
	for(var i=0; i < this.tiles.length; i++){
		game.setTile(
			this.tiles[i].x,
			this.tiles[i].y,
			game.tileCollideLayer,
			0
		);
	}
}
SceneCaveRock.prototype.close = function(){
	this.isOpen = false;
	this.position.x = this.start.x;
	this.position.y = this.start.y;
	for(var i=0; i < this.tiles.length; i++){
		game.setTile(
			this.tiles[i].x,
			this.tiles[i].y,
			game.tileCollideLayer,
			1024
		);
	}
}