Well.prototype = new GameObject();
Well.prototype.constructor = GameObject;
function Well(x,y,t){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 72;
	this.height = 72;
	
	this.addModule(mod_talk);
	this.unlocked = true;
	this.total = 0;
	
	this.progress = 0;
	this.coin = new Point();
	
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
			this.progress = 1.0;
			this.coin = new Point(_player.position.x, _player.position.y);
			
			if(!this.unlocked && this.total >= 100) {
				this.unlocked = true;
			} else if(Math.random() < 0.03){
				var name = "life";
				
				if(Math.random() < 0.5) name = "waystone";
				else if(Math.random() < 0.2) name = dataManager.randomTreasure(Math.random(), ["chest"]).name;
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
	
	this.progress -= this.delta / Game.DELTASECOND;
}
Well.prototype.render = function(g,c){
	if(this.progress > 0 ){
		var fall = (0.66 - this.progress)*20;
		var frame = (this.progress*10) % 3;
		this.coin.x = Math.lerp(this.position.x, this.coin.x, this.progress);
		this.coin.y += fall;
		
		"items".render(g,this.coin.subtract(c),7+frame,1);
	}
}
Well.prototype.idle = function(){}