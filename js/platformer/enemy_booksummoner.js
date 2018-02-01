class BookSummoner extends GameObject{
	constructor(x,y,d,o) {
		super(x,y,d,o);
		
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.speed = 3.0;
		this.jumpSpeed = 6.0;
		this.bulletSpeed = 5.0;
		this.gotoForce = new Point(1,1);
		this.sprite = "booksummoner";
		
		this.enemies = new Array();
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.times = {
			"rest" : Game.DELTASECOND * 0.75,
			"attack" : Game.DELTASECOND * 0.75,
			"cooldown" : Game.DELTASECOND * 2.0,
			"jump" : Game.DELTASECOND * 3,
			"walljump" : Game.DELTASECOND * 0.333
		};
		this.states = {
			"rest" : this.times.rest,
			"attack" : 9999.0,
			"cooldown" : this.times.cooldown,
			"jump" : 0.0,
			"walljump"  : 0.0,
			"canWalljump" : true,
			"runaway" : Math.random() > 0.5
		};
		
		this.on("collideHorizontal", function(h){
			if(!this.grounded){
				if(this.states.canWalljump){
					this.states.canWalljump = false;
					this.states.walljump = this.times.walljump;
					this.force.x = 0;
					this.force.y = 0;
				}
			} else {
				this.states.runaway = !this.states.runaway;
				this.force.x = 0;
			}
		});
		this.on("hurt", function(obj,damage){
			this.states.retreat = this.times.retreat;
			audio.play("hurt",this.position);
		});
		
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			audio.play("kill",this.position);
			this.destroy();
		});
		
		o = o || {};
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in o){
			this.difficulty = o["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		
		this.pushable = false;
		this.hurtByDamageTriggers = true;
		
		this.mass = 1.0;
		this.friction = 0.2;
		this.gravity = 0.0;
	}
	
	fire(){
		var ops = {"difficulty" : this.difficulty};
		
		for(let i=0; i < 3; i++){
			var emptySlot = true;
			if(this.enemies[i] != null && this.enemies[i]._isAdded){
				emptySlot = false;
			}
			
			if(emptySlot){
				var enm = new BookReptile(this.position.x, this.position.y, false, ops);
				enm.on("sleep", function(){this.destroy();});
				enm.states.missile = true;
				enm.mForce = new Point(this.forward()*i, 1);
				enm.mForce = enm.mForce.normalize(this.bulletSpeed);
				
				game.addObject(enm);
				this.enemies[i] = enm;
			}
			
		}
	}
	
	update(){
		if(this.life > 0){
			var dir = this.position.subtract(_player.position);
			
			if(this.states.walljump > 0){
				//Hit wall, get ready to jump off
				this.gravity = 0;
				this.force.x = this.force.y = 0;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				this.states.walljump -= this.delta;
				if(this.states.walljump <= 0){
					this.flip = !this.flip;
					this.force.x = this.forward() * this.jumpSpeed;
					this.force.y = -6;
					this.grounded = false;
					this.states.attack = this.times.attack;
				}
			} else if(!this.grounded){
				//Jump
				this.gravity = 0.3;
				this.friction = 0.06;
				this.states.rest = this.times.rest;
				
				this.states.attack -= this.delta;
				
				this.frame.x = (this.states.attack <= this.times.attack) ? 0 : 1;
				this.frame.y = 1;
				
				if(this.states.attack <= 0){
					this.states.attack = 9999;
					this.fire();
				}
				
			} else if(this.states.rest <= 0){
				//Run in a direction
				this.friction = 0.1;
				this.gravity = 1.0;
				this.force.x = this.forward() * this.speed;
				this.flip = dir.x > 0 != this.states.runaway;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				this.states.cooldown -= this.delta;
				
				if(!this.states.runaway && Math.abs(dir.x) < 64){
					this.states.cooldown = 0;
				}
				
				if(this.states.cooldown <= 0){
					this.states.attack = this.times.attack;
					this.states.cooldown = this.times.cooldown;
					this.states.jump = this.times.jump;
					this.grounded = false;
					this.force.x = this.forward() * this.jumpSpeed;
					this.force.y = -8;
				}
			} else {
				//Rest a moment
				this.states.canWalljump = true;
				this.gravity = 1.0;
				this.friction = 0.7;
				this.states.rest -= this.delta;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				if(this.states.rest <= 0){
					this.states.runaway = Math.random() > 0.5;
				}
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
			this.friction = 0.5;
		}
	}
}

self["BookSummoner"] = BookSummoner;

