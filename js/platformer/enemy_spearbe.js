Spearbe.prototype = new GameObject();
Spearbe.prototype.constructor = GameObject;
function Spearbe(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 44;
	this.charged = false;
	
	this.start = new Point(x,y);
	this.range = 80;
	
	this.speed = 0.4;
	this.sprite = "spearbe";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("struck", function(obj,pos,damage){
		EnemyStruck.apply(this,arguments);
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("blockOther", function(obj){
		var dir = this.position.subtract(obj.position);
		this.force.x = (dir.x>0?1:-1) * 4;
	});
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.pushable = false;
	
	this.states = {
		"turn" : 0,
		"cooldown" : Game.DELTASECOND * 1.5,
		"charge" : 0,
		"chargewait" : 0
	};
	this.times = {
		"turn" : Game.DELTASECOND * 1.3,
		"cooldown" : Game.DELTASECOND * 3.0,
		"charge" : Game.DELTASECOND * 1.2,
		"chargewait" : Game.DELTASECOND * 0.5
	}
}
Spearbe.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	var startdir = this.position.subtract(this.start);
	
	if(this.life > 0){
		if(this.states.turn > 0){
			this.states.turn -= this.delta;
			if(Timer.isAt(this.states.turn,this.times.turn*0.5,this.delta)){
				this.flip = !this.flip;
			}
		} else if(this.states.charge > 0){
			//charge at player
			if(this.states.chargewait > 0){
				this.force.x = 0;
				this.states.chargewait -= this.delta;
			} else {
				this.force.x += this.forward() * this.speed * this.delta * 2;
				this.states.charge -= this.delta;
			}
			
			if(this.states.charge <= 0 || Math.abs(this.position.x-this.start.x) > this.range*2){
				this.states.cooldown = this.times.cooldown;
				this.states.charge = 0;
			}
			
			this.strike(Spearbe.strikerect);
		} else if(Math.abs(dir.x) < 128){
			//Approach player
			if(this.position.x < this.start.x + this.range && this.position.x > this.start.x - this.range){
				//Spearbe is inside his range, approach
				this.force.x += this.forward() * this.speed * this.delta;
			} else {
				//Spearbe is outside his range, move back toward his range
				
				this.force.x += (startdir.x>0?-1:1) * this.speed * this.delta * 0.6;
			}
			
			if((this.flip && dir.x < 0) || (!this.flip && dir.x > 0)){
				this.states.turn = this.times.turn;
			}
			
			this.states.cooldown -= this.delta
			if(this.states.cooldown <= 0){
				this.states.charge = this.times.charge;
				this.states.chargewait = this.times.chargewait;
			}
			
			this.strike(Spearbe.strikerect);
		} else {
			//return to start
			if(Math.abs(this.position.x - this.start.x) > 8){
				this.force.x += (this.start.x > this.position.x ? 1:-1) * this.speed * this.delta;
			}
			if((this.flip && dir.x < 0) || (!this.flip && dir.x > 0)){
				this.states.turn = this.times.turn;
			}
			
			this.strike(Spearbe.strikerect);
		}
	}
	
	if(this.states.turn > 0){
		var progress = 1 - this.states.turn / this.times.turn;
		this.frame.x = Math.sin(progress * Math.PI) * 3;
		this.frame.y = 2;
	} else if(Math.abs(this.force.x) > 0.1){
		this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 6;
		this.frame.y = 1;
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.2) % 5;
		this.frame.y = 0;
	}
}
Spearbe.strikerect = new Line(0,-2,66,2);