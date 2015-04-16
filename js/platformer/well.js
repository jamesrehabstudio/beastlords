Well.prototype = new GameObject();
Well.prototype.constructor = GameObject;
function Well(x,y,t){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 48;
	
	this.addModule(mod_talk);
}
Well.prototype.update = function(){
	if( this.open ){
		if( _player.money > 0 ) {
			_player.money--;
			audio.play("coin");
			if(Math.random() < 0.02){
				var name = "life";
				
				if(Math.random() < 0.2) name = "xp_big";
				else if(Math.random() < 0.1) name = "waystone";
				else if(Math.random() < 0.01) name = "life_up";
				
				var item = new Item(this.position.x, this.position.y - 48, name);
				item.sleep = Game.DELTASECOND;
				item.gravity = 0;
				item.pushable = false;
				item.force = new Point();
				game.addObject(item);
			}
		} else {
			audio.play("negative");
		}
		this.close();
	}
}
Well.prototype.render = function(g,c){}