Chest.prototype = new GameObject();
Chest.prototype.constructor = GameObject;
function Chest(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "chests";
	
	this.isOpen = 0;
	this.empty = 0;
	
	this.startFrame = new Point(0,0);
	this.openTime = Game.DELTASECOND * 1.1;
	this.spawnTime = 0.0;
	
	this.money = 50;
	this.items = new Array();
	
	
	if("id" in ops) {
		this.chest_id = "chest_" + ops["id"];
		if(NPC.get(this.chest_id)){
			this.isOpen = true;
			this.empty = true;
		}
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("money" in ops){
		this.money = ops["money"] * 1;
	}
	if("items" in ops){
		this.items = ops["items"].split(",");
	}
	
	this.on("struck", function(obj){
		if(obj instanceof Player){
			this.open();
		}
	});
	
	this.on("activate", function(){
		this.open();
	});
}

Chest.prototype.open = function(){
	if(this.chest_id){
		NPC.set(this.chest_id, 1);
	}
	if(!this.isOpen){
		audio.play("open", this.position);
	}
	this.isOpen = true;
}
Chest.prototype.update = function(){
	if(this.isOpen){
		if(!this.empty){
			if(this.openTime > 0){
				var progress = 1 - (this.openTime / (Game.DELTASECOND * 1.1));
				this.frame.x = this.startFrame.x + Chest.anim_open.frame(progress).x;
				this.frame.y = this.startFrame.y;
				this.openTime -= this.delta;
			} else {
				this.frame.x = this.startFrame.x + 3;
				this.frame.y = this.startFrame.y;
				
				if(this.spawnTime <= 0){
					if(this.money > 0){
						var coin;
						if(this.money >= 10 && Math.random() > 0.4){
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_3"} );
							this.money -= 10;
						} else if (this.money >= 5 && Math.random() > 0.4){
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_2"} );
							this.money -= 5;
						} else {
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_1"} );
							this.money -= 1;
						}
						coin.force.y = -5.0; coin.force.x = -3 + Math.random() * 6;
						game.addObject(coin);
					} else if(this.items.length > 0){
						var itemName = this.items.pop();
						var item = new Item( this.position.x, this.position.y, false, {"name":itemName} );
						item.gravity = 1.0;
						item.force.y = -5.0; item.force.x = -3 + Math.random() * 6;
						game.addObject(item);
					} else {
						this.empty = true;
					}
					this.spawnTime = Game.DELTAFRAME30 * 2;
				} else {
					this.spawnTime -= this.delta;
				}
			}
		} else {
			this.frame.x = this.startFrame.x + 3;
			this.frame.y = this.startFrame.y;
			//Do nothing
		}
	}
}
Chest.anim_open = new Sequence([
	[0,0,0.1],
	[1,0,0.1],
	[2,0,0.1],
	[3,0,0.6],
]);