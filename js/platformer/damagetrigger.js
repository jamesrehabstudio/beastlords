DamageTrigger.prototype = new GameObject();
DamageTrigger.prototype.constructor = GameObject;
function DamageTrigger(x,y,p,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 18;
	
	this.damage = 25;
	
	o = o || {};
	this.width = o.width || this.width;
	this.height = o.height || this.height;
	this.damage = o.damage || this.damage;
	this.restTimer = 0.0;
	
	this.position.x += this.width * 0.5;
	
	this.on("collideObject", function(obj){
		if( this.restTimer <= 0 && obj instanceof Player ) {
			obj.hurt( this, Math.floor( this.damage ) );
			this.restTimer = Game.DELTASECOND * 3;
		}
	});
}
DamageTrigger.prototype.update = function(){
	this.restTimer -= this.delta;
}