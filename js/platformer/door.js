Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.name = "";
	this.sprite = "doors";
	
	this.lock = -1;
	this.isOpen = false;
	this.openAnimation = 0;
	this._tid = false;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	this.close();
	
	this.on("activate", function(obj){
		if(this.isOpen){
			audio.play("open");
			this.close();
		}else {
			audio.play("open");
			this.open();
		}
	});
	
	this.on("collideObject", function(obj){
		if( this.lock >= 0 && !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					audio.play("open");
					this.open();
				}
			}
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
}
Door.prototype.close = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 1024);
	}
	this.zIndex = 0;
	this.isOpen = false;
}
Door.prototype.open = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -20;
	this.isOpen = true;
}
Door.prototype.update = function(){
	
	if( this.isOpen ) {
		this.openAnimation = Math.min(this.openAnimation + this.delta * 0.5, 3);
	} else {
		this.openAnimation = Math.max(this.openAnimation - this.delta * 0.5, 0);
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
			this.zIndex,
			this.frame
		);
	}
}