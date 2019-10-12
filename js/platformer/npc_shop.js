class Shop extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 32;
		this.zIndex = -1;
		this.sprite = "shops";
		
		this.loadSprites = ["shops","retailers"];
		this.loadAudio = [];
		
		this.keeperFrame = new Point();
		
		this.addModule(mod_talk);
		
		this.on("open", function(){
			this.buildItemList();
			game.pause = true;
			this.cursor = 0;
		});
		this.on("close", function(){
			game.pause = false;
		});
		
		this.cursor = 0;
		
		//Add items to shop
		this.items = [];
	}
	update(){
		if( this.open ){
			//Show player's money
			_player.hud_moneyPos = 1;
			
			if(input.state("pause") == 1 || input.state("jump") == 1){
				//Close shop window
				this.close();
			} else if(this.items.length > 0){
				//Browse shop
				let cItem = this.items[this.cursor];
				
				if(input.state("down") == 1){ 
					this.cursor = Math.clamp(this.cursor+1, 0, this.items.length-1);
					audio.play("cursor");
				} else if(input.state("up") == 1){
					this.cursor = Math.clamp(this.cursor-1, 0, this.items.length-1);
					audio.play("cursor");
				} else if(input.state("fire") == 1){
					this.buy();
				} 
				
			} else {
				if(input.state("fire") == 1 && !DialogManager.show){
					//When shop is empty, the action button will close it too.
					this.close();
				} 
			}
			
		}
		
		this.keeperFrame.x = (this.keeperFrame.x + this.delta * 6.0 ) % 3;
	}
	buildItemList(){
		this.items = [];
		
		if(!NPC.get("baseball_bat")){
			this.items.push({
				"name" : "Baseball bat",
				"price" : 100,
				"frame" : new Point(1,2),
				"item" : "baseball_bat",
			});
		}
		if(!NPC.get("wedding_dress")){
			this.items.push({
				"name" : "Wedding dress",
				"price" : 500,
				"frame" : new Point(12,4),
				"variable" : "wedding_dress",
			});
		}
		
		this.cursor = Math.clamp(this.cursor, 0, this.items.length-1);
		DialogManager.set("Sorry buddy. You've bought everything we have.");
	}
	buy(){
		let item = this.items[this.cursor];
		
		if(item.price <= _player.money){
			audio.play("equip");
			_player.money -= item.price;
			if("item" in item){
				let newitem = new Item(_player.position.x, _player.position.y, false, {"name":item.item});
				newitem.showItemDescription = false;
				newitem.trigger("collideObject", _player);
			}
			if("variable" in item){
				NPC.set(item.variable, 1);
			}
		} else {
			//Cannot afford item
			audio.play("negative");
		}
		
		this.buildItemList();
	}
	render(g,c){
		super.render(g,c);
		g.renderSprite("retailers",this.position.subtract(c),this.zIndex+1,this.keeperFrame,false);
	}
	hudrender(g,c){
		if(this.open){
			if(this.items.length > 0){
				//Shop has items, browse
				let xoff = game.resolution.x - 204;
				boxArea(g,xoff, 12, 192, 216);
				let yoff = 36;
				for(let i=0; i < this.items.length; i++){
					let item = this.items[i];
					if(this.cursor == i ){ 
						textArea(g, "@", xoff+12, yoff, 999,999);
					}
					textArea(g, "$"+item.price, xoff+24, yoff, 999,999);
					textArea(g, item.name, xoff+68, yoff, 999,999);
					yoff += 12;
				}
			} else {
				//No sale
				DialogManager.render(g);
			}
		}
	}
	
}

self["Shop"] = Shop;

/*
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
		//audio.playLock("pause",0.3);
		DialogManager.set(this.message);
	});
	this.on("close", function(){
		game.pause = false;
	});
	this.message = "We'er currently closed for business in this demo.";
	this.cursor = 0;	
}

Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		
		//if(!DialogManager.show){
		//	this.close();
		//}
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
	
	//animation
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

Shop.prototype.hudrender = function(g,c){	
	let statname = "Attack";
	if(this.cursor == 1) {
		statname = "Defence";
	} else if(this.cursor == 2){
		statname = "Magic";
	}
	
	if( this.open > 0 ){		
		//DialogManager.render(g);
		
		var p = Shop.itemposition[this.cursor].add(this.position).subtract(c);
		
		cursorArea(g, p.x-16,p.y-16,32,32);
		textArea(g, "+1 "+statname, p.x-16, p.y+24);
		textArea(g, "$"+this.price(), p.x-16, p.y+36);
	}
}*/