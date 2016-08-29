Smith.prototype = new GameObject();
Smith.prototype.constructor = GameObject;
function Smith(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "characters2";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("smith_intro");
	
	
	this.slackCooldown = Game.DELTASECOND * 3;
	
	this.weapons = new Array();
	this.cursor = new Point();
	this.columns = 8;
	this.rows = 0;
	
	this.on("open", function(){
		this.cursor = new Point();
		this.weapons = this.gatherWeapons();
		DialogManger.set(this.text);
		
		game.pause = true;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}

Smith.prototype.gatherWeapons = function(){
	var out = new Array();
	
	for(var i=0; i < Smith.weapons.length; i++){
		var name = Smith.weapons[i];
		var hasWeapon = NPC.get(name);
		if(hasWeapon){
			out.push( new Item(0,0,0,{"name" : name}));
		}
	}
	this.rows = Math.ceil(out.length / this.columns);
	return out;
}
Smith.prototype.cursorIndex = function(){
	return this.cursor.x+this.cursor.y*this.columns;
}
	
Smith.prototype.update = function(){
	if( this.open ) {
		//Move player into position
		this.talkMovePlayer();
		
		if( Smith.introduction ) {
			if(!DialogManger.show){
				Smith.introduction = false;
				this.close();
			}
		} else {
			if(input.state("left") == 1){
				this.cursor.x = Math.max(this.cursor.x-1,0);
				audio.play("cursor");
			}
			if(input.state("right") == 1){
				this.cursor.x = Math.min(this.cursor.x+1,this.columns-1);
				audio.play("cursor");
			}
			if(input.state("up") == 1){
				this.cursor.y = Math.max(this.cursor.y-1,0);
				audio.play("cursor");
			}
			if(input.state("down") == 1){
				this.cursor.y = Math.min(this.cursor.y+1,this.rows-1);
				audio.play("cursor");
			}
			
			if(this.cursorIndex() > this.weapons.length-1){
				//Out of range, set to last item
				this.cursor.x = (this.weapons.length-1) % this.columns;
				this.cursor.y = this.rows-1;
			}
			
			if(input.state("fire") == 1){
				var index = this.cursorIndex();
				var weapon = this.weapons[index];
				if(weapon.isWeapon){
					_player.equip(weapon, _player.equip_shield);
				} else if (weapon.isShield) {
					_player.equip(_player.equip_sword, weapon);
				}
				audio.play("equip");
			}
			
			if(input.state("jump") == 1 || PauseMenu.open){
				this.close();
			}
		}
	}
	
	//Animation
	if(this.slackCooldown <= 0){
		this.frame.x = this.frame.x + this.delta * 0.2;
		this.frame.y = 4;
		
		if(this.frame.x >= 3){
			this.slackCooldown = Game.DELTASECOND * 3;
			this.frame.x = 0;
			this.frame.y = 3;
		}
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.1) % 3;
		this.frame.y = 3;
		
		this.slackCooldown -= this.delta;
		if(this.slackCooldown <= 0){
			this.frame.x = 0;
			this.frame.y = 4;
		}
	}
}

Smith.prototype.hudrender = function(g,c){
	if( this.open ) {
		if( Smith.introduction ) {
			DialogManger.render(g);
		} else {
			var width = 224;
			var left = game.resolution.x / 2 - width * 0.5;
			var top = 24;
			
			boxArea(g,left,top,width,120);
			
			for(var i=0; i < this.weapons.length; i++){
				var item = this.weapons[i];
				var x = i % this.columns;
				var y = Math.floor(i / this.columns);
				
				g.renderSprite("items", new Point(24+left+x*24, 24+top+y*24), this.zIndex, item.frame, false);
			}
			
			cursorArea(g, 12+left+this.cursor.x*24, 12+top+this.cursor.y*24,24,24);
		}
	}
}
Smith.weapons = [
	"short_sword", "long_sword", "broad_sword", "spear", "warhammer",
	"small_shield", "large_shield", "kite_shield", "broad_shield", "knight_shield", "spiked_shield", "heavy_shield", "tower_shield"
];
Smith.introduction = true;