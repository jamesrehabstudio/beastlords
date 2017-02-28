Checkpoint.prototype = new GameObject();
Checkpoint.prototype.constructor = GameObject;
function Checkpoint(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.sprite = "checkpoint";
	this.activated = false;
	
	this.on("collideObject",function(obj){
		if(!this.activated && obj instanceof Player){
			this.activate(obj);
		}
	});
}

Checkpoint.prototype.activate = function(obj){
	//Deativate all other points
	var allpoints = game.getObjects(Checkpoint);
	for(var i=0; i < allpoints.length; i++){
		allpoints[i].activated = false;
	}
	
	this.activated = true;
	obj.heal = obj.lifeMax;
	obj.manaHeal = obj.manaMax;
	audio.play("item1");
	game.slow(0,Game.DELTASECOND*0.3333);
	
	Checkpoint.saveState(obj);
}

Checkpoint.saveState = function(obj){
	obj.checkpoint.x = obj.position.x;
	obj.checkpoint.y = obj.position.y;
	
	Checkpoint.state.money = obj.money;
}
Checkpoint.loadState = function(obj){
	obj.position.x = obj.checkpoint.x ;
	obj.position.y = obj.checkpoint.y ;
	obj.money = Checkpoint.state.money;
}

Checkpoint.state = {
	"money" : 0
}

Checkpoint.prototype.render = function(g,c){
	if(this.activated){
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		this.frame.y = 1;
		Background.pushLight(
			this.position,
			Math.random()*5+120,
			[1.0,0.8,0.6,1.0]
		);
	}else {
		this.frame.x = 0;
		this.frame.y = 0;
	}
	GameObject.prototype.render.apply(this,[g,c]);
}