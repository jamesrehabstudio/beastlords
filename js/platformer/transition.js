Tranistion.prototype = new GameObject();
Tranistion.prototype.constructor = GameObject;
function Tranistion(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.zIndex = 99;
	this.frame = new Point(0,3);
	this.sprite = "doors"
	
	this.active = 0;
	this.time = 0.0;
	
	if("map" in ops){
		this.map = ops["map"];
	}
	if("start" in ops) {
		this.start = ops["start"];
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(!this.active){
				audio.play("open", this.position);
				Background.setTint([0,0,0,1],Game.DELTASECOND);
			}
			this.active = 1;
		}
	});
}

Tranistion.prototype.update = function(){
	if(this.active){
		game.pause = true;
		this.time += game.deltaUnscaled;
		this.frame.x = Math.min(this.frame.x + game.deltaUnscaled * 0.5, 3);
		
		if(this.time > Game.DELTASECOND){
			WorldLocale.loadMap(this.map, this.start, function(){
				Background.setTint([1.0,1.0,1.0,1.0],Game.DELTASECOND * 0.2);
				game.pause = false;
			});
		}
		
	}
}