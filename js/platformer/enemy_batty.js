class Batty extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.width = 16;
		this.height = 16;
		this.sprite = "batty";
		this.speed = 9.5;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		this.addModule( mod_creep );
		
		this.states = {
			"cooldown" : Game.DELTASECOND * 1,
			"lockon": false,
			"attack" : 0,
			"friendBat" : false,
		}
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.life = this.lifeMax = Spawn.life(0,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		this.mass = 0.8;
		this.pushable = false;
		this.damageContact = 0.0;
		this.xpDrop = Spawn.xp(2,this.difficulty);
		this.inviciple_tile = this.stun_time;
		this.gravity = 0.6;
		this.fuse = this.difficulty >= 2;
		
		this.checkAttackArea = function(ops){
			if(this.life > 0 && this.states.attack > 0){
				let strike = new Line(0, -4, 10, 4).scale(this.forward(),1).correct().transpose(this.position);
				Combat.attackCheck.apply(this,[ strike ]);
			}
		}
		
		this.on("respawn", function(){
			this.states.cooldown = 2.0;
			this.states.attack = 0.0;
			this.force.x = this.force.y = 0.0;
			this.fuse = this.difficulty >= 2;
		});
		
		this.on("blocked", function(obj){
			this.states.attack = 0.0;
			this.states.cooldown = 2.0;
		});
		
		this.on("collideObject", function(obj){
			if( this.fuse && obj instanceof Batty ) {
				this.fuseWithBat(obj);
			}
		});
		
		this.on("death", function(){
			Item.drop(this);
			audio.play("kill",this.position); 
			createExplosion(this.position, 32 );
			this.creep_hide();
		});
		
		this.on("collideVertical", function(v){
			if(this.states.friendBat){
				
			} else if(v > 0 && this.states.attack > 0){
				this.states.lockon = true;
				this.force.y = 0;
			}
			if(v < 0 && this.states.cooldown > 0){
				this.force.x = 0;
			}
		});
	}
	fuseWithBat(otherBat){
		this.creep_hide();
		otherBat.creep_hide();
		
		this.fuse = otherBat.fuse = false;
		this.states.attack = otherBat.states.attack = 0.0;
		this.states.cooldown = otherBat.states.cooldown = 3.0;
		
		this.force.x = -8;
		otherBat.force.x = 8;
		
		var deckard = new Deckard( 
			this.position.x, 
			this.position.y, 
			false,
			new Options({"difficulty" : this.difficulty})
		);
		deckard.batty1 = this;
		deckard.batty2 = otherBat;
		
		game.addObject(deckard);
	}
	update(){
		if(this.life > 0){
			this.grounded = false;
			
			if(this.states.attack > 0){
				if(this.fuse){
						if(Math.random() > 0.9){
						//Roughly every 10 frames look for a friend
						var self = this;
						this.states.friendBat = game.overlaps(new Line(0,0,game.resolution.x, game.resolution.y).transpose(game.camera)).find(function(a){
							return (a !== self && a instanceof Batty && a.fuse);
						});
					}
				} else {
					this.states.friendBat = undefined;
				}
				
				//Attack
				if(this.states.friendBat){
					//Hunt down friend
					this.flip = this.states.friendBat.position.x < this.position.x;
					this.addHorizontalForce(this.forward() * this.speed);
					if(this.states.attack > 2.75){
						//Fall a little
					} else if(this.states.friendBat.position.y < this.position.y){
						this.force.y -= this.gravity * 2 * UNITS_PER_METER * this.delta;
					}
				} else if(this.states.lockon){
					//Move across screen
					this.addHorizontalForce(this.forward() * this.speed);
					this.force.y -= this.gravity * UNITS_PER_METER * this.delta;
				} else {
					//fall
					if(this.position.y + 8 > this.target().position.y){
						this.flip = this.position.x > this.target().position.x;
						this.states.lockon = true;
						this.force.y = 0;
					}
				}
				this.states.attack -= this.delta;
			} else {
				this.force.y -= this.gravity * 2 * UNITS_PER_METER * this.delta;
				if(Math.abs(this.position.x - this.target().position.x) < 160){
					this.states.cooldown -= this.delta;
				}
				if(this.states.cooldown <= 0){
					this.flip = this.position.x > this.target().position.x;
					this.states.lockon = false;
					this.states.attack = 3;
					this.states.cooldown = 2;
				}
			}
			if(this.force.y > 1){
				this.frame.x = 0;
			} else if(Math.abs(this.force.x) < 1) {
				this.frame.x = 1;
			} else {
				this.frame.x = 2 + Math.mod(game.timeScaled * 8, 3);
			}
		} else {
			this.frame.x = 0;
		}
	}
}
self["Batty"] = Batty;

/*
Batty.prototype = new GameObject();
Batty.prototype.constructor = GameObject;
function Batty(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "batty";
	this.speed = 9.5;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 1,
		"lockon": false,
		"attack" : 0,
		"direction" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.lifeMax = Spawn.life(0,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.mass = 0.8;
	this.pushable = false;
	this.damageContact = 0.0;
	this.xpDrop = Spawn.xp(2,this.difficulty);
	this.inviciple_tile = this.stun_time;
	this.gravity = -0.6;
	this.fuse = this.difficulty >= 2;
	
	this.on("collideObject", function(obj){
		if( this.fuse && obj instanceof Batty ) {
			//Fuse with other batty
			this.destroy();
			obj.destroy();
			this.fuse = obj.fuse = false;
			var deckard = new Deckard( 
				this.position.x, 
				this.position.y, 
				false, 
				{
					"difficulty":this.difficulty
				} 
			);
			game.addObject(deckard);
			
			obj.trigger("swap", deckard);
			this.trigger("swap", deckard);
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.attack = 0;
		
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
		else this.states.lockon = true;
		
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		
	});
	this.on("wakeup", function(){
		//this.visible = true;
		//this.interactive = true;
		this.states.cooldown = Game.DELTASECOND * 1;
		this.states.lockon = false;
		this.states.attack = 0;
		//this.life = this.lifeMax;
		this.gravity = -0.6;
		
	});
	this.on("death", function(){
		//this.visible = false;
		//this.interactive = false;
		this.destroy();
		Item.drop(this);
		audio.play("kill",this.position); 
		createExplosion(this.position, 32 );
	});
}
Batty.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( this.target().position );
		
		if( this.states.cooldown <= 0 ) {
			
			var batty = null;
			
			if( this.fuse ){
				var batties = game.getObjects(Batty);
				for(var i=0; i < batties.length; i++ ) if( batties[i] != this && batties[i].awake ) 
					batty = batties[i];
			}
			
			if( batty != null ){
				//near by bat, move to it and fuse.
				var batty_dir = this.position.subtract(batty.position);
				this.gravity = batty_dir.y > 0 ? -0.5 : 0.5;
				this.addHorizontalForce(this.speed * (batty_dir.x > 0 ? -1 : 1));
			} else {
				if( this.states.lockon ) {
					//Fly horizontal toward target
					this.gravity = 0;
					this.force.y = 0;
					this.addHorizontalForce(this.speed * this.forward());
					this.flip = this.force.x < 0; 
				} else {
					//Fall down seeking target
					this.gravity = 0.6;
					this.criticalChance = 1.0;
					if( dir.y + 16.0 > 0 ) {
						this.states.lockon = true;
						this.criticalChance = 0.0;
						this.flip = dir.x > 0;
					}
				}
				
				if( this.states.attack <= 0 ){
					this.gravity = -0.6;
					this.states.cooldown = Game.DELTASECOND * 2;
					this.states.lockon = false;
				} else {
					this.states.attack -= this.delta
				}
				
				this.strike( new Line(-8,-4,8,4) );
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) this.states.attack = Game.DELTASECOND * 2.5;
			this.flip = dir.x > 0;
		}
	} 
	
	// Animation 
	if( Math.abs(this.force.y) < 0.2 && Math.abs(this.force.x) < 0.2  ) {
		this.frame.x = 1;
	} else {
		if( this.force.y > 1.0 ) {
			this.frame.x = 0;
		} else {
			this.frame.x = Math.max( (this.frame.x + this.delta * 9.0) % 5, 2);
		}
	}
}
*/