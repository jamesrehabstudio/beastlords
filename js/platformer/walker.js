Walker.prototype = new GameObject();
Walker.prototype.constructor = GameObject;
function Walker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "walker";
	this.speed = 9.0;
	this.speedBoost = 30.0;
	this.zIndex = 13;
	this.start = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.seatObj = new GameObject(x,y);
	this.seatObj.width = 32;
	this.seatObj.height = 16;
	this.seatObj.addModule( mod_block );
	//this.seatObj.visible = false;
	
	this.life = 256;
	
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	this.stepAnim = 0.0;
	this.standTime = 0.0;
	this.walkerID = false;
	this._wasOnboard = false;
	this.isCharging = false;
	
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			this.seatObj.trigger("collideObject", obj);
			obj.trigger("collideObject", this.seatObj);
		} else if(obj instanceof PressureSwitch){
			obj.press();
		} else if(obj.hasModule(mod_combat)){
			if(this.isCharging){
				var d = Combat.getDamage();
				d.fixed = Math.min(obj.life, this.life);
				obj.hurt(this, d);
			}
		}
	});
	this.on("hurt_other", function(obj, damage){
		this.life -= damage;
	});
	this.on("sleep", function(){
		if(this.walkerID){
			this.destroy();
		} else {
			this.position.x = this.start.x;
			this.position.y = this.start.y;
		}
	})
	this.on("getOff", function(obj){
		obj.force.x = this.force.x;
	});
	this.on("destroy", function(){
		this.seatObj.destroy();
	});
}
Walker.prototype.update = function(){
	var progress = this.standTime / Walker.STAND_TIME;
	this.isCharging = false;
	
	if(this.seatObj.block_isOnboard(_player)){
		this._wasOnboard = _player;
		if(this.standTime < Walker.STAND_TIME){
			//standing up
			this.frame = Walker.anim_stand.frame(progress);
			this.standTime = Math.min(this.standTime+this.delta, Walker.STAND_TIME);
			_player.position.x = Math.lerp(_player.position.x, this.position.x, progress);
		} else {
			//Player on board
			if(input.state("dodge") > 0 && false){
				this.force.x = this.forward() * this.speedBoost;
				this.isCharging = true;
				game.slow(0.35,3);
				
				this.frame.x = 0;
				this.frame.y = 3;
				
			} else {				
				if(input.state("left") > 0){
					this.addHorizontalForce(-this.speed);
					this.flip = true;
				}
				if(input.state("right") > 0){
					this.addHorizontalForce(this.speed);
					this.flip = false;
				}
				
				this.stepAnim = (this.stepAnim + this.delta * Math.abs(this.force.x) * 6.0) % 6;
				this.frame.x = this.stepAnim % 3;
				this.frame.y = this.stepAnim / 3;
			}
			
			
			
			_player.position.x = this.position.x;
			_player.force.x = 0;
			
			if(Math.abs(this.force.x) < 0.1){
				this.stepAnim = 0.0;
			}
		}
	} else {
		//Sitting down
		this.frame = Walker.anim_stand.frame(progress);
		this.standTime = Math.max(this.standTime - this.delta, 0);
		
		if(this._wasOnboard){
			this.trigger("getOff", this._wasOnboard);
			this._wasOnboard = false;
		}
	}
	
	//Change seat position
	this.seatObj.fullUpdate();
	this.seatObj.position.x = this.position.x;
	this.seatObj.position.y = this.position.y - (progress*8.0);
}

Walker.STAND_TIME = Game.DELTASECOND * 0.5;
Walker.anim_stand = new Sequence([
	[2,2,0.333],
	[1,2,0.333],
	[0,2,0.333]
]);

class Cart extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.start = new Point(x,y);
		this.sprite = "walker";
		
		this.width = 24;
		this.height = 24;
		this.frame = new Point(3,0);
		this.speed = 3;
		this.damage = 10;
		this.stunTime = Game.DELTASECOND * 0.125;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_block);
		
		this.pushable = false;
		this.friction = 0.2;
		this.moving = false;
		
		this.on("spellFlash", function(spell){
			this.moving = true;
		});
		this.on("collideHorizontal", function(v){
			this.moving = false;
		});
		this.on("sleep", function(){
			this.position.x = this.start.x;
			this.position.y = this.start.y;
			this.force = new Point();
			this.moving = false;
		})
		this.on("collideObject", function(obj){
			if(this.moving && obj.hasModule(mod_combat)){
				
				if(obj.life > 0){
					var topY = this.position.y - this.height * 0.5 + 1;
					var botY = obj.position.y + this.origin.y * this.height;
					
					if(topY < botY && this.delta > 0){
						obj.invincible = 0;
						obj.hurt(this, this.damage);
					}
				}
			}
		});
		this.on("hurt_other", function(obj, damage){
			game.slow(0,this.stunTime);
		});
		
		this.flip = ops.getBool("flip", false);
	}
	update(){
		if(this.moving){
			this.force.x += this.forward() * this.speed * this.delta;
		}
	}
}
self["Cart"] = Cart;