Shop.prototype = new GameObject();
Shop.prototype.constructor = GameObject;
function Shop(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.shops;
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	
	this.anim_character = 0;
	
	this.addModule(mod_talk);
	window._shop = this;
	
	this.items = [];
	this.prices = [];
	
	this.on("open",function(obj){
		game.pause = true;
		audio.playLock("pause",0.3);
	});
	this.message = [
		"This is all we got. Don't like go some place else!",
		"I sold my entire stock. Nice doing business with you."
	];
	this.cursor = 0;	
	
	this.restock(window.dataManager);
}
Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			audio.playLock("unpause",0.3);
			this.open = 0;
			game.pause = false;
		}
		
		if( input.state("left") == 1 ){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = ( this.cursor == 0 ? this.cursor = this.items.length : this.cursor )-1;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("right") == 1){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1){
			this.purchase();
		}
	}
	
	/* animation */
	this.anim_character = (this.anim_character + this.delta * 0.2 ) % 3;
}
Shop.prototype.purchase = function(){
	if( this.items[ this.cursor ] instanceof Item ){
		if( _player.money >= this.prices[ this.cursor ] ) {
			var item = this.items[ this.cursor ];
			item.gravity = 1.0;
			item.interactive = true;
			this.items[ this.cursor ] = null;
			_player.money -= this.prices[ this.cursor ];
			audio.play("equip");
			
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			
			return true;
		} else {
			audio.play("negative");
		}
	}
	return false;
}
Shop.prototype.restock = function(data){
	this.items = new Array(3);
	this.prices = new Array(3);
	
	for(var i=0; i < this.items.length; i++) {
		var treasure = data.randomTreasure(Math.random(),["shop"]);
		treasure.remaining--;
		var x = this.position.x + (i*32) + -40;
		
		this.items[i] = new Item(x, this.position.y-80, treasure.name);
		this.prices[i] = treasure.price;
	
		if( !this.items[i].hasModule(mod_rigidbody) ) this.items[i].addModule(mod_rigidbody);
		this.items[i].gravity = 0;
		this.items[i].interactive = false;
		game.addObject(this.items[i]);
	}
}
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	sprites.characters.render(g,this.position.subtract(c),this.anim_character,0,false);
	
	if( this.open > 0 ){		
		this.soldout = true;
		for(var i=0; i < this.items.length; i++ ){
			if( this.items[i] instanceof Item ) {
				this.soldout = false;
				var p = this.items[i].position.subtract(c);
				if( i == this.cursor ) boxArea(g, p.x-16,p.y-16,32,32);
				textArea(g, "$"+this.prices[i], p.x-16, p.y+12);
			}
		}
		
		boxArea(g,16,16,224,64);
		if( this.soldout ) {
			textArea(g,this.message[1],32,32,192);
		} else {
			textArea(g,this.message[0],32,32,192);
		}
	}
}