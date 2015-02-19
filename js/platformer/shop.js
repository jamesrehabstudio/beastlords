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
	
	window._shop = this;
	
	this.items = [];
	this.prices = [];
	
	this.on("struck",function(obj){
		if( this.open==0 && obj instanceof Player ){
			game.pause = true;
			obj.states.attack = 0;
			this.open = 1;
			audio.playLock("pause",0.3);
		}
	});
	this.message = [
		//                       ||                        ||                        ||
		"What are you looking \nfor? Whatever it is, we \nno doubt sell it!",
		"I sold my entire stock. \nNice doing business with \nyou."
	];
	this.open = 0;
	this.cursor = 0;	
	
	this.restock(window.dataManager);
}
Shop.prototype.update = function(g,c){
	if( this.open == 2 ) {
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
	if( this.open > 0 ) this.open = 2 //This is to prevent same frame button purchases
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
		var tresure = data.randomTresure(Math.random());
		tresure.remaining--;
		var x = this.position.x + (i*32) + -40;
		
		this.items[i] = new Item(x, this.position.y-80, tresure.name);
		this.prices[i] = tresure.price;
	
		if( !this.items[i].hasModule(mod_rigidbody) ) this.items[i].addModule(mod_rigidbody);
		this.items[i].gravity = 0;
		this.items[i].interactive = false;
		game.addObject(this.items[i]);
	}
}
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	sprites.characters.render(g,this.position.subtract(c),0,0,false);
	
	if( this.open == 2 ){		
		this.soldout = true;
		for(var i=0; i < this.items.length; i++ ){
			if( this.items[i] instanceof Item ) {
				this.soldout = false;
				var p = this.items[i].position.subtract(c);
				if( i == this.cursor ) boxArea(g, p.x-16,p.y-16,32,32);
				textArea(g, ""+this.prices[i], p.x-8, p.y+12);
			}
		}
		
		boxArea(g,16,16,224,64);
		if( this.soldout ) {
			textArea(g,this.message[1],32,32);
		} else {
			textArea(g,this.message[0],32,32);
		}
	}
}