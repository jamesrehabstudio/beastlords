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
	this.damageFixed = 12;
	this.alwaysKill = 0;
	this.alwaysHurt = 1;
	
	o = o || {};
	if("damage" in o){
		this.damageFixed = Math.floor(o.damage * 1);
	}
	if("kill" in o){
		this.alwaysKill = o.kill * 1;
	}
	if("alwayshurt" in o){
		this.alwaysHurt = o["alwayshurt"] * 1;
	}
	
	this.on("collideObject", function(obj){
		if( obj.hurtByDamageTriggers ) {
			if(this.alwaysKill){
				obj.invincible = -1;
				obj.life = 0;
				obj.stun = Game.DELTASECOND * 1;
				obj.trigger("hurt",this,0);
				obj.isDead();
			} else {
				if(this.alwaysHurt && game.timeScaled > DamageTrigger.rest){
					obj.invincible = -1;
				}
				obj.hurt( this, Combat.getDamage.apply(this) );
				if(obj instanceof Player){
					DamageTrigger.rest = game.timeScaled + Game.DELTASECOND * 2;
				}
			}
		}
	});
}
DamageTrigger.rest = 0;