Shop.prototype = new GameObject();
Shop.prototype.constructor = GameObject;
function Shop(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "shops";
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	this.idleMargin = 72;
	
	this.keeperFrame = new Point(0,0);
	
	this.addModule(mod_talk);
	
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
}

Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( input.state("jump") == 1 || input.state("pause") == 1 || input.state("select") == 1){
			audio.playLock("unpause",0.3);
			this.close();
			game.pause = false;
		}
		
		if( input.state("right") == 1 ){
			this.cursor = Math.min(this.cursor+1, 2);
			audio.play("cursor"); 
		}
		if( input.state("left") == 1){
			this.cursor = Math.max(this.cursor-1, 0);
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1){
			this.purchase();
		}
	}
	
	/* animation */
	this.keeperFrame.x = (this.keeperFrame.x + this.delta * 0.2 ) % 3;
}
Shop.itemnames = ["seed_oriax", "seed_bear", "seed_malphas"];
Shop.itemposition = [new Point(-40,-80),new Point(-8,-80), new Point(24,-80)];
Shop.prototype.price = function(){
	var sales = NPC.get("shopsales");
	if(sales){
		return Math.round(Math.pow(sales * 20, 1.3)); 
	}
	return 20;
}
Shop.prototype.purchase = function(){
	var price = this.price();
	
	if( _player.money >= price ) {
		var itemname = Shop.itemnames[this.cursor];
		var itempos = Shop.itemposition[this.cursor].add(this.position);
		var item = new Item(itempos.x, itempos.y, false, {"name":itemname});
		item.addModule(mod_rigidbody);
		item.gravity = 1.0;
		item.interactive = true;
		_player.money -= price;
		audio.play("equip");
		
		game.addObject(item);
		
		var sales = NPC.get("shopsales") * 1;
		NPC.set("shopsales", sales + 1);
		
		return true;
	} else {
		audio.play("negative");
	}
	return false;
}

	
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite("retailers",this.position.subtract(c),this.zIndex+1,this.keeperFrame,false);
	
	for(var i=0; i < Shop.itemnames.length; i++){
		var itempos = Shop.itemposition[i].add(this.position);
		g.renderSprite("items", itempos.subtract(c), this.zIndex+1, new Point(i,4), false);
	}
}

Shop.prototype.postrender = function(g,c){	
	if( this.open > 0 ){		
		
		var p = Shop.itemposition[this.cursor].add(this.position).subtract(c);
		
		cursorArea(g, p.x-16,p.y-16,32,32);
		textArea(g, "$"+this.price(), p.x-16, p.y+24);
	}
}