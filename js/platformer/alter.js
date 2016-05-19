Alter.prototype = new GameObject();
Alter.prototype.constructor = GameObject;
function Alter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "alter";
	this.width = 64;
	this.height = 128;
	this.zIndex = -1;
	this.life = 1;
	this.origin.y = 1.0;
	
	this.addModule(mod_talk);
	
	var tresure = dataManager.randomTreasure(Math.random(),["treasure","alter"]);
	tresure.remaining--;
	
	this.item = new Item(this.position.x, this.position.y-104, tresure.name);
	this.item.addModule(mod_rigidbody);
	this.item.gravity = 0;
	this.item.interactive = false;
	game.addObject(this.item);
	
	this.on("open",function(obj){
		game.pause = true;
		audio.playLock("pause",0.3);
		this.cursor = 0;	
	});
	this.message = [
		"Sacrifice permanent life for an item?"
	];
	this.cursor = 0;
}
Alter.prototype.update = function(g,c){
	if( this.open > 0 && this.item instanceof Item ) {
		if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 ) {
				_player.lifeMax = Math.max(_player.lifeMax-25, 1);
				_player.life = Math.min( _player.life, _player.lifeMax );
				audio.play("equip");
				this.item.gravity = 1.0;
				this.item.interactive = true;
				this.item = false;
				this.interactive = false;
			}
			this.close();
			game.pause = false;
			
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.close();
			game.pause = false;
		}
	}
	this.canOpen = this.item instanceof Item;
}
Alter.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		renderDialog(g,this.message[0]);
		
		
		boxArea(g,16,120,64,56);
		textArea(g," Yes",32,136);
		textArea(g," No",32,152);
		
		"text".render(g, new Point(28,136+this.cursor*16), 95);
	}
}