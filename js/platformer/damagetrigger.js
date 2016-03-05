DamageTrigger.prototype = new GameObject();
DamageTrigger.prototype.constructor = GameObject;
function DamageTrigger(x,y,d,o){
	this.constructor();
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	this.position.x = x - (this.width / 2);
	this.position.y = y - (this.height / 2);
	this.origin.x = 0;
	this.origin.y = 0;
	
	this.restTimer = 0.0;
	this.damage = 25;
	this.alwaysHurt = 0;
	
	o = o || {};
	if("damage" in o){
		this.damage = o.damage * 1;
	}
	if("alwayshurt" in o){
		this.alwaysHurt = o["alwayshurt"] * 1;
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( this.restTimer <= 0 || this.alwaysHurt ){
				if(this.alwaysHurt){
					obj.invincible = -1;
				}
				obj.hurt( this, Math.floor( this.damage ) );
				this.restTimer = Game.DELTASECOND * 2;
			}
		}
	});
}
DamageTrigger.prototype.update = function(){
	this.restTimer -= this.delta;
}