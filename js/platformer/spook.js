Spook.prototype = new GameObject();
Spook.prototype.constructor = GameObject;
function Spook(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.spookCount = 8;
	this.spookTime = 8 * Game.DELTASECOND
	this.spooks = new Array();
	for(var i=0; i < 8; i++){
		this.spooks.push({
			"position" : new Point(x + Math.random()* 128, y + Math.random()* 120),
			"frame" : Math.random() * this.spookTime
		})
	}
}

Spook.prototype.update = function(){
}

Spook.prototype.render = function(g,c){
}

Spook.prototype.lightrender = function(g,c){
	for(var i=0; i < this.spooks.length; i++){
		var s = this.spooks[i];
		
		s.frame = (s.frame + this.delta) % this.spookTime;
		var sf = 9 * Math.min(s.frame / (Game.DELTASECOND * 1), 1);
		
		var f = new Point(sf%3,sf/3);
		
		
		g.renderSprite(
			"spook1",
			s.position.subtract(c),
			this.zIndex,
			f,
			false
		);
	}
}