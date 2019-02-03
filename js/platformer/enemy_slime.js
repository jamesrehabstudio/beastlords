class Slime extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 16;
		this.sprite = "slime";
		this.swrap = spriteWrap["slime"];
		
		this.speed = 6.0;
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_creep);
		
		this.width = this.height = 16;
		this.team = 0;
		
		ops = Options.convert(ops);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(0, this.difficulty);
		this.xpDrop = Spawn.xp(3,this.difficulty);
		this.moneyDrop = Spawn.money(2,this.difficulty);
		this.damage = 0;
		this.damageSlime = Spawn.damage(3,this.difficulty);
		this.damageContact = 0;
		this.pushable = false;
		
		this._state = 0;
		this._timer = 0;
		this._timerMax = 0.5;
		this.setState(Slime.STATE_MOVING);
		
		this.on("land", function(){
			if(Math.random() > 0.5 ){
				//Chance of disappearing
				if( this._state == Slime.STATE_HIDDEN){
					this.setState(Slime.STATE_MOVING);
				} else if( this._state == Slime.STATE_MOVING ){
					this.setState(Slime.STATE_HIDDEN);
				}
			}
		});
		this.on("collideHorizontal",function(obj,damage){
			this.force.x = 0;
			this.flip = !this.flip;
		});
		this.on("hurt",function(obj,damage){
			
			this.setState(Slime.STATE_HIDDEN);
		});
		this.on("combat_bouncedon", function(obj){
			if(obj instanceof Player){
				audio.play("splat1", this.position);
				this.life = 0;
				this.creep_hide();
			}
		});
		this.on("hurt_other",function(obj,damage){
			if(this._state == Slime.STATE_HIDDEN || this._state == Slime.STATE_MOVING){
				this.setState(Slime.STATE_HIDDEN);
			} else {
				this.life = 0;
				this.isDead();
			}
		});
		this.on("blocked",function(obj,damage){
			this.setState(Slime.STATE_HIDDEN);
		});
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			
			audio.play("kill",this.position);
			createExplosion(this.position, 40 );
			this.creep_hide();
		});
	}
	setState(s){
		this._state = s;
		this._timer = 0;
		this.interactive = true;
		this.damageContact = 0;
		if(this._state == Slime.STATE_HIDDEN){
			this.flip = Math.random() > 0.5;
			this._timerMax = Math.randomRange(1,3);
			this.interactive = false;
		} else if( this._state == Slime.STATE_MOVING) {
			this.flip = this.position.x > this.target().position.x;
			this._timerMax = Math.randomRange(3,4);
		}  else if( this._state == Slime.STATE_SINGING ) {
			this._timerMax = 2.4;
		}  else if( this._state == Slime.STATE_EXPLODING) {
			this._timerMax = 2.4;
		}
	}
	update(){
		if(this.life > 0){
			this._timer += this.delta;
			
			if(this._state == Slime.STATE_HIDDEN){
				//Move hidden
				if(this._timer < 0.5) {
					this.frame = this.swrap.frame("melt",this._timer * 2);
				} else if( this._timerMax - this._timer < 0.5){
					this.frame = this.swrap.frame("melt",(this._timerMax - this._timer) * 2);
				} else {
					this.frame.x = 4;
					this.frame.y = 3;
				}
				
				this.addHorizontalForce(this.forward() * this.speed);
				if( this._timer >= this._timerMax ){
					this.setState(Slime.STATE_MOVING);
				}
			} else if( this._state == Slime.STATE_MOVING) {
				//Move show
				
				if( this.grounded ){
					this.frame = this.swrap.frame("move",Math.mod(game.time,1.0));
					this.addHorizontalForce(this.forward() * this.speed);
				} else {
					this.flip = this.force < 0;
					this.frame.x = 2;
					this.frame.y = 3;
				}
				if( this._timer >= this._timerMax ){
					this.setState(Slime.STATE_HIDDEN);
				}
			}  else if( this._state == Slime.STATE_SINGING ) {
				//Sing
				if(this._timer < 0.5) {
					let d = Math.clamp01( 1.0 - this._timer * 2.0);
					this.frame = this.swrap.frame("melt",d);
				} else {
					this.damageContact = 1.0;
					this.frame = this.swrap.frame("sing",Math.mod(game.time*1.25,1.0));
					if( this._timer >= this._timerMax ){
						this.setState(Slime.STATE_EXPLODING);
					}
				}
			}  else if( this._state == Slime.STATE_EXPLODING) {
				//Explode
				this.frame = this.swrap.frame("explode", Math.mod(game.time*5,1.0));
				if( this._timer >= this._timerMax ){
					this.life = 0;
					this.isDead();
				}
			}
		} else {
			this.frame.x = 2;
			this.frame.y = 3;
		}
	}
	render(g,c){
		super.render(g,c);
		
		if( this._state == Slime.STATE_SINGING ){
			let t = this.position.x + game.timeScaled;
			let heart = new Point(Math.sin(t)*16, Math.mod(t*1.2345,1)*-24);
			g.renderSprite(this.sprite, this.position.add(heart).subtract(c), this.zIndex+1, Slime.HEART, false);
		}
	}
}
Slime.STATE_HIDDEN = 0;
Slime.STATE_MOVING = 1;
Slime.STATE_SINGING = 2;
Slime.STATE_EXPLODING = 3;
Slime.HEART = new Point(3,3);

self["Slime"] = Slime;

/*
Slime.prototype = new GameObject();
Slime.prototype.constructor = GameObject;
function Slime(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.paletteSwaps = ["t0","t0","t2","t3","t4"];
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = "slime";
	this.speed = 6.0;
	this.visible = false;
	this.interactive = false;
	this.pushable = false;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.times = {
		"cooldown" : Game.DELTASECOND * 0.25 + Game.DELTASECOND * Math.random(),
		"cooldownTime" : Game.DELTASECOND * 2.0,
		"transition" : 0.0,
		"melt" : 0,
		"move" : 0
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		this.times.cooldown = 0.0;
		
	});
	this.on("hurtOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("blockOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	//Set opening state
	if(Math.random() > 0.5){
		this.visible = true;
		this.interactive = true;
		this.pushable = true;
		this.times.move = 1;
	}
	
	this.flip = Math.random() > 0.5;
	this.life = Spawn.life(0, this.difficulty);
	this.xpDrop = Spawn.xp(3,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.damage = 0;
	this.damageSlime = Spawn.damage(1,this.difficulty);
	
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.calculateXP();
}
Slime.prototype.update = function(){
	if(this.life > 0){
		if(!this.grounded){
			this.frame.x = 0;
			this.frame.y = 2;
		} else if(this.times.move){
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 3.0) % 5;
			this.frame.y = 0;
			
			this.addHorizontalForce(this.speed * this.forward());
			
			if(this.interactive){
				this.strike(new Line(new Point(0,0), new Point(12,4)));
			}
			
			
			var forwardTile = game.getTileRule(this.position.add(new Point(this.flip?-16:16,0)));
			//var underTile = game.getTile(this.position.add(new Point(0,16)));
			if(forwardTile != tilerules.ignore){
				this.flip = !this.flip;
			}
			this.times.cooldown -= this.delta;
			if(this.times.cooldown <= 0){
				//Stop moving and reappear
				this.times.move = 0;
				this.force.x = 0;
				this.times.transition = 0.0;
				//If it's interactive, it means it's currently alive
				this.times.melt = this.interactive;
				this.interactive = false;
			}
		} else {
			if(this.times.melt){
				//
				this.times.transition += this.delta * 3.0;
				this.frame.x = Math.floor(this.times.transition * 5);
				this.frame.y = 1;
				if(this.times.transition >= 1){
					this.visible = false;
					this.times.move = 1;
					this.times.cooldown = this.times.cooldownTime * 0.5;
					this.flip = Math.random() > 0.5;
				}
			} else {
				//reform
				this.visible = true;
				this.times.transition += this.delta * 3.0;
				this.frame.x = 5 - Math.floor(this.times.transition * 5);
				this.frame.y = 1;
				if(this.times.transition >= 1){
					this.interactive = true;
					this.times.move = 1;
					this.times.cooldown = this.times.cooldownTime;
				}
			}
		}
	} else {
		this.frame.x = 0;
		this.frame.y = 2;
	}
}
Slime.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.flip = dir.x < 0;
}
*/