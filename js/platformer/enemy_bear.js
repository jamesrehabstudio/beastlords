Bear.prototype = new GameObject();
Bear.prototype.constructor = GameObject;
function Bear(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "bear";
	this.speed = 0.2;
	this.active = false;
	this.start = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.guard.y = -15;
	this.guard.h = 32;
	
	this.states = {
		"attackTotal" : Game.DELTASECOND * 1.5,
		"attack" : 0,
		"cooldown" : 100.0,
		"block" : 0.0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
		
		this.states.block = Game.DELTASECOND * 0.5;
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		this.states.attack = 0.0;
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
}
Bear.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	var dis = this.position.subtract(this.start);
	
	if(this.life > 0){
		if(this.stun <= 0){
			if(this.states.attack > 0){
				this.guard.active = false;
				this.states.attack -= this.delta;
				this.frame.x = Math.min(this.frame.x + this.delta * 0.4, 2);
				this.frame.y = 1;
				
				if(this.frame.x < 2){
					this.strike(new Line(0,-12,32,0));
				}
			} else {
				this.guard.active = true;
				
				if(this.states.block > 0){
					this.frame.x = 0;
					this.frame.y = 2;
					this.states.block -= this.delta;
				} else {
					this.flip = dir.x > 0;
					if(Math.abs(dir.x) < 128){
						this.states.cooldown -= this.delta;
						if(Math.abs(dis.x) < 180 && Math.abs(dir.x) > 48){
							this.force.x += this.forward() * this.speed * this.delta;
						} 
					} else {
						this.force.x += (dis.x>0?-1:1) * this.speed * this.delta;
					}
					
					this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4;
					this.frame.y = 0;
				}
				
				if(this.states.cooldown <= 0){
					this.states.attack = this.states.attackTotal;
					this.states.cooldown = Game.DELTASECOND * 2.5;
					this.force.x = this.forward() * 5;
					this.frame.y = this.frame.x = 0;
				}
			}
		} else {
			this.stun = Math.min(this.stun, Game.DELTASECOND * 0.1);
			this.frame.x = 1;
			this.frame.y = 2;
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}