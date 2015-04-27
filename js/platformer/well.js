Well.prototype = new GameObject();
Well.prototype.constructor = GameObject;
function Well(x,y,t){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 72;
	this.height = 72;
	
	this.addModule(mod_talk);
	this.unlocked = false;
	this.total = 0;
	
	this.on("collideObject", function(obj){
		var dir = this.position.y - obj.position.y;
		if( dir < -24 && obj instanceof Player && !this.unlocked ) {
			obj.invincible = -999;
			obj.position.x = obj.checkpoint.x;
			obj.position.y = obj.checkpoint.y;
			obj.hurt( this, Math.floor( obj.lifeMax * .2) );
		}
	});
	
}
Well.prototype.update = function(){
	if( this.open ){
		if( _player.money > 0 ) {
			_player.money--;
			this.total++;
			audio.play("coin");
			if(!this.unlocked && this.total >= 100) {
				this.unlocked = true;
			} else if(Math.random() < 0.03){
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
Well.prototype.idle = function(){}