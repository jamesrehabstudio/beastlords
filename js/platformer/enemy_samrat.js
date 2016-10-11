Samrat.prototype = new GameObject();
Samrat.prototype.constructor = GameObject;
function Samrat(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 48;
	this.charged = false;
	
	this.start = new Point(x,y);
	this.range = 80;
	
	this.speed = 0.8;
	this.sprite = "samrat";
	
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
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(9,this.difficulty);
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0,
		"jump" : false,
		"jumpBehind" : Game.DELTASECOND,
		"dash" : 0
	};
	this.times = {
		"jumpBehind" : Game.DELTASECOND * 0.3333
	}
}
Samrat.prototype.update = function(){
	dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		if(this.states.attack > 0){
			var progress = 1 - Math.min(this.states.attack / (Game.DELTASECOND * 1.0),1);
			this.frame = Samrat.attackanim.frame(progress);
			this.states.attack -= this.delta;
			
			if(this.frame.x == 2 || this.frame.x == 3){
				this.strike(Samrat.attackrange);
			}
			
		} else if(this.states.jump){
			this.force.y -= this.delta * 0.2;
			if((this.flip && dir.x > 0) || (!this.flip && dir.x < 0)){
				this.force.x += (this.flip?-1:1) * this.speed * 2.0 * this.delta;
			}
			
			if(this.grounded){
				this.states.cooldown = 0.0;
				this.states.jumpBehind = this.times.jumpBehind;
				this.states.jump = false;
			}
		} else if(this.states.dash > 0){
			this.force.x += (this.flip?-1:1) * this.speed * this.delta * 2;
			this.states.dash -= this.delta;
			if((this.flip && this.position.x < this.start.x - this.range) || (!this.flip && this.position.x > this.start.x + this.range)){
				this.states.dash = 0.0;
				this.force.x = 0.0;
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 0;
			
			this.flip = dir.x > 0;
			
			if(Math.abs(dir.x) < 80){
				if(this.flip){
					if(this.position.x < this.start.x + this.range){
						this.states.jumpBehind = Math.min(this.states.jumpBehind+this.delta,this.times.jumpBehind);
						this.force.x += this.speed * this.delta;
					} else {
						this.states.jumpBehind -= this.delta;
						this.force.x = 0;
					}
				} else {
					if(this.position.x > this.start.x - this.range){
						this.states.jumpBehind = Math.min(this.states.jumpBehind+this.delta,this.times.jumpBehind);
						this.force.x -= this.speed * this.delta;
					} else {
						this.states.jumpBehind -= this.delta;
						this.force.x = 0;
					}
				}
				
				if(dir.y > 40){
					this.flip = Math.abs((this.start.x - this.range)-this.position.x) > Math.abs((this.start.x + this.range)-this.position.x);
					this.states.dash = Game.DELTASECOND * 0.8;
				}
				
				if(this.states.jumpBehind <= 0){
					this.force.y = -10;
					this.states.jump = true;
					this.grounded = false;
				}
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = Game.DELTASECOND;
					this.states.attack = Game.DELTASECOND * 1;
					this.force.x = (this.flip?-1:1) * this.speed * 5;
				}
				
				this.states.cooldown -= this.delta;
				
			} else {
				if(this.states.cooldown <= 0){
					if(this.flip){
						this.force.x -= this.speed * this.delta;
					} else {
						this.force.x += this.speed * this.delta;
					}
				}
				
				this.states.cooldown -= this.delta * 0.2;
			}
		}
	}
}
Samrat.attackrange = new Line(16,-32,58,6);
Samrat.attackanim = new Sequence([
	[0,1,.2],
	[1,1,.1],
	[2,1,.1],
	[3,1,.1],
	[4,1,.1],
	[5,1,.5],
]);