Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 30;
	this.zIndex = 10;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	this.spellCursor = 0;
	this.uniqueItems = [];
	this.charm = false;
	this.knockedout = false;
	this.pause = false;
	
	this.equip_sword = new Item(0,0,0,{"name":"short_sword","enchantChance":0});
	this.equip_shield = new Item(0,0,0,{"name":"small_shield","enchantChance":0});
	this.unique_item = false;
	
	
	
	_player = this;
	this.sprite = "player";
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.lightRadius = 32.0;
	this.downstab = false;
	this.grabLedges = false;
	this.doubleJump = false;
	this.dodgeFlash = false;
	
	this.states = {
		"duck" : false,
		"guard" : true,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND,
		"guard_down" : false,
		"attack_charge" : 0,
		"charge_multiplier" : false,
		"rollPressCounter" : 0.0,
		"roll" : 0,
		"rollDirection" : 1.0,
		"rollCooldown" : 0.0,
		"effectTimer" : 0.0,
		"downStab" : false,
		"afterImage" : new Timer(0, Game.DELTASECOND * 0.125),
		"manaRegenTime" : 0.0,
		"againstwall" : 0,
		"turn" : 0.0,
		"doubleJumpReady": true,
		"spellCounter" : 0.0,
		"spellCurrent" : undefined,
		"justjumped" : 0.0
	};
	
	this.attstates = {
		"stats" : WeaponStats["short_sword"],
	
		"currentAttack" : null,
		"currentQueue" : null,
		"currentQueuePosition" : 0,
		"currentQueueState" : null,
		"attackEndTime" : 0.0,
		"hit" : false,
		"charge" : 0.0,
		
		"timer" : 0.0,
		"autostartNextAttack" : false
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	};
	
	
	this.speeds = {
		"baseSpeed" : 1.25,
		"inertiaGrounded" : 0.8,
		"inertiaAir" : 0.4,
		"frictionGrounded" : 0.2,
		"frictionAir" : 0.1,
		"rollCooldown" : Game.DELTASECOND * 1.2,
		"jump" : 9.3,
		"airBoost" : 0.5,
		"airGlide" : 0.0,
		"breaks": 0.4,
		"manaRegen" : Game.DELTASECOND * 60,
		"turn" : Game.DELTASECOND * 0.25,
		"charge" : Game.DELTASECOND * 0.4
	};
	
	this.on("pre_death", function(){
		this.heal = 0;
		game.slow(0,this.death_time);
		//audio.stopAs("music");
	});
	this.on("death", function(){
		DemoThanks.deaths++;
		
		this.position.x = 128;
		this.position.y = 200;
		
		/*if( window._world instanceof WorldMap ){
			window._world.worldTick();
		}*/
		
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		PauseMenu.open = true;
		audio.play("playerdeath");
		this.destroy();
	});
	this.on("land", function(){
		//Land from a height
		this.states.doubleJumpReady = true;
		
		audio.play("land");
		var dust = Math.floor(2 + Math.random() * 3);
		for(var i=0; i < dust; i++ ){
			var offset = new Point(
				i * 5 + (Math.random()-0.5) * 3 - (dust*2),
				16 - Math.random() * 3
			);
			game.addObject( new EffectSmoke(
				offset.x + this.position.x, 
				offset.y + this.position.y,
				null,
				{
					"frame":1, 
					"speed":0.4 + Math.random() * 0.2,
					"time":Game.DELTASECOND * (0.3 + 0.4 * Math.random())
				}
			));
		}
	});
	this.on("collideHorizontal", function(h){
		if(this.grabLedges){
			this.states.againstwall = (h>0?1:-1) * Game.DELTASECOND * 0.1;
		}
	});
	this.on("collideVertical", function(v){
		if(v>0) this.knockedout = false;
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 3.0;
		
		if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
		
		//obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("blocked", function(obj){
		if(obj.hasModule(mod_combat)){
			fireDamage = this.damageFire - Math.round(this.damageFire * obj.defenceFire);
			obj.life -= fireDamage;
			obj.displayDamage(fireDamage);
			obj.isDead();
		}
	});
	this.on("hurt", function(obj, damage){
		shakeCamera(Game.DELTASECOND*0.5,str);
		//this.states.ledge = null;
		
		var str = Math.min(Math.max(Math.round(damage*0.1),1),6);
		var dir = this.position.subtract(obj.position);
		
		this.cancelAttack(this);
		this.attstates.charge = 0.0;
		
		var knockback = this.grounded ? 7 : 3;
		if(dir.x < 0){
			this.force.x = -knockback;
		}else{
			this.force.x = knockback;
		}
		if(this.stun_time > 0 ){
			this.states.spellCounter = 0.0;
			this.stun = this.stun_time;
			game.slow(0,5.0);
		}
		if( this.perks.thorns > 0 && obj.hurt instanceof Function){
			obj.hurt(this,Math.floor(damage * this.perks.thorns));
		}
		if(this.life > 0 && damage >= this.life){
			audio.play("deathwarning");
		}
		Background.flash = [0.6,0,0,1];
		audio.play("playerhurt");
	})
	/*
	this.on("struckTarget", function(obj, pos, damage){
		if( this.states.downStab && obj.hasModule(mod_combat)){
			this.states.downStab = false;
			this.force.y = -2;
			this.jump();
			this.doubleJumpReady = true;
		}
	})*/;
	this.on("hurt_other", function(obj, damage){
		var ls = Math.min(this.perks.lifeSteal, 0.4);
		this.life = Math.min( this.life + Math.round(damage * ls), this.lifeMax );
		
		if(this.attstates.currentAttack){
			this.attstates.attackEndTime = this.attstates.currentAttack.time + this.attstates.currentAttack.rest;
			this.attstates.hit = true;
			this.hitIgnoreList.push(obj);
			
			if("pause" in this.attstates.currentAttack){
				game.slow(0.0, this.attstates.currentAttack.pause);
			}
			if("shake" in this.attstates.currentAttack){
				shakeCamera(Game.DELTASECOND*0.25, this.attstates.currentAttack.shake);
			}
			if("stun" in this.attstates.currentAttack){
				obj.stun = this.attstates.currentAttack.stun;
				if(!this.grounded && obj.life > 0 && obj.hasModule(mod_rigidbody)){
					obj.airtime = this.attstates.currentAttack.stun * this.perks.attackairboost;
				}
			}
			if("knockback" in this.attstates.currentAttack && obj.hasModule(mod_rigidbody)){
				var scale = 1.0 / Math.max(obj.mass, 1.0);
				var knock = new Point(this.forward() * this.attstates.currentAttack.knockback.x, this.attstates.currentAttack.knockback.y).scale(scale);
				obj.force.x += knock.x;
				obj.force.y += knock.y;
			}
			
		}
		
		if( "life" in obj && obj.life <= 0 ) {
			//Glow after a kill
			this.states.afterImage.set(Game.DELTASECOND * 3);
		}
		
		if(this.states.roll > 0){
			this.states.doubleJumpReady = true;
		} else if(this.states.downStab){
			this.states.downStab = false;
			this.force.y = -2;
			this.jump();
			this.trigger("downstabTarget", this, damage);
			obj.trigger("downstabbed", this, damage);
			this.states.doubleJumpReady = true;
		} else {
			if( !this.grounded ) {
				//Add extra float
				this.force.y -= this.speeds.jump * this.speeds.airGlide;
			}
		}
		
		//Charge kill explosion!
		if( this.attstates.currentQueueState == Weapon.STATE_CHARGED ){
			//A little shake
			shakeCamera(Game.DELTASECOND*0.3,5);
			
			if( obj.ragdoll ) {
				//Send the enemy flying
				var dir = obj.position.subtract(this.position);
				var aim = dir.normalize().add(new Point(dir.x>0?1:-1,0));
				game.slow(0.1, Game.DELTASECOND * 0.5);
				audio.playLock("explode3", 0.5);
				obj.trigger("death");
				game.addObject( new ExplodingEnemy( 
					obj.position.x,
					this.position.y,
					false,
					{
						"direction" : aim,
						"damage" : this.currentDamage(),
						"sprite" : obj.sprite,
						"flip" : obj.flip,
						"frame" : obj.frame
					}
				));
			}
		}
	});
	this.on("added", function(){
		this.damage_buffer = 0;
		this.lock_overwrite = false;
		this.force.x = this.force.y = 0;
		this.states.doubleJumpReady = true;
		
		game.camera.x = this.position.x-128;
		game.camera.y = Math.floor(this.position.y/240)*240;
		
		Checkpoint.saveState(this);
	});
	this.on("collideObject", function(obj){
		if( this.states.roll > 0 && this.dodgeFlash){
			if("hurt" in obj && obj.hurt instanceof Function){
				var damage = this.baseDamage();
				obj.hurt(this, damage);
			}
		}
	});
	this.on("dropLedge", function(){
		this.states.ledge = false;
		this.gravity = 1.0;
	});
	
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	this.spells = [
	];
	
	this.shieldSlots = [
	
	];
	
	this.baseStats = {
		"attack" : 9,
		"magic" : 3
	};
	this.stats = {
		"attack" : 9,
		"magic" : 3
	};
	
	this.perks = {
		"attackairboost" : 0.0,
		"lifeSteal" : 0.0,
		"bonusMoney" : 0.0,
		"painImmune" : false,
		"thorns" : 0.0,
		"slowWound": 0.0,
		"poisonResist" : 0.0
	}
	
	this.life = 24;
	this.lifeMax = 24;
	this.mana = 24;
	this.manaMax = 24;
	this.money = 0;
	this.heal = 0;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.stun_time = Game.DELTASECOND * 0.33333333;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = Game.DELTASECOND * 1.5;
	this.autoblock = true;
	this.rollTime = Game.DELTASECOND * 0.5;
	this.dodgeTime = this.rollTime * 0.6;
	this.rollSpeed = 9;
	this.dodgeSpeed = 15;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		
		this.superHurt(obj,damage);
	}
	this.superGetDamage = this.getDamage;
	this.getDamage = function(){
		var damage = this.superGetDamage();
		if(this.attstates.currentAttack) {
			damage.physical *= this.attstates.currentAttack["damage"];
		}
		return damage;
	}
	
	//Stats
	this.stat_points = 0;
	this.experience = 0;
	this.level = 1;
	this.nextLevel = 0;
	this.prevLevel = 0;
	
	
	this.equip(this.equip_sword, this.equip_shield);
	
	this.spellsCounters = {
		"magic_strength" : 0,
		"flight" : 0,
		"haste" : 0,
		"magic_sword" : 0,
		"magic_armour" : 0,
		"invincibility" : 0,
		"feather_foot" : 0,
		"thorns" : 0,
		"magic_song" : 0
	};
	
	this.addXP(0);
}

Player.prototype.update = function(){
	if(this.pause) {
		this.force.x = 0;
		this.force.y = 0;
		return;
	}
	
	if(this.unique_item instanceof Item){
		if(!this.unique_item.use(this)){
			this.unique_item = false;
		}
	}
	
	//Reset states
	this.states.guard = false;
	this.states.downStab = false;
	
	this.buffer_damage = this.hasCharm("charm_elephant");
	
	this.states.manaRegenTime = Math.min(this.states.manaRegenTime-this.delta, this.speeds.manaRegen);
	if(this.states.manaRegenTime <= 0){
		this.mana = Math.min(this.mana + 1,this.manaMax );
		this.states.manaRegenTime = this.speeds.manaRegen;
	}
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana + 1, this.manaMax);
		this.manaHeal-= 1;
		if( this.mana >= this.manaMax ) this.manaHeal = 0;
	}
	if( this.hasCharm("charm_methuselah") ){
		for(var i in _player.statusEffects)
			_player.statusEffects[i] = 0;
	}
	
	if( this.heal > 0 ){
		audio.play("heal");
		this.life += 1;
		this.heal -= 1;
		this.damage_buffer = 0;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	}
	if ( this.life > 0 ) {
		var strafe = input.state('block') > 0;
		
		//Update attack animation
		if(this.attstates.currentAttack){
			this.attstates.timer += this.delta;
			
			if(Timer.isAt(this.attstates.timer,0,this.delta)){
				if("force" in this.attstates.currentAttack){
					this.force.x += this.attstates.currentAttack.force.x * this.forward();
					this.force.y += this.attstates.currentAttack.force.y;
				}
				audio.play("swing");
			}
			
			if(this.attstates.timer >= this.attstates.attackEndTime){
				if(this.attstates.autostartNextAttack){
					this.attack();
					this.attstates.autostartNextAttack = false;
				} else {
					//No more attacks, end queue
					this.cancelAttack();
				}
				
			}
		}
		
		if (this.stun > 0 ){
			//Do nothing, just wait to recover
		} else if (this.states.spellCounter > 0){
			this.states.spellCounter -= this.delta;
			if(this.states.spellCounter <= 0){
				//Cast Spell
				this.castSpell();
			}
		} else if (this.knockedout > 0){
			//Do nothing
		} else if( this.states.roll > 0 ) {
			if(this.dodgeFlash){
				this.force.y -= (0.2 + this.gravity) * this.delta;
				this.force.x = this.forward() * this.dodgeSpeed;
			} else {
				this.force.x = this.forward() * this.rollSpeed;
			}
			this.states.roll -= this.delta;
			if( input.state("jump") == 1 ){
				//Jump cancelAttack
				this.invincible = this.states.roll = 0;
				if(this.grounded || (this.states.doubleJumpReady && this.doubleJump)){
					this.jump();
				}
			}
			
			if( this.states.roll <= 0 ) {
				//End of roll
				this.force.x = Math.min(Math.max(this.force.x,-6),6);
			}
			
			//Create dust trail for roll
			if( this.states.effectTimer > Game.DELTASECOND / 16 ){
				this.states.effectTimer = 0;
				game.addObject( new EffectSmoke(
					this.position.x, this.position.y + 16, null, 
					{"frame":1, "speed":0.4,"time":Game.DELTASECOND*0.4}
				));
			}
		} else if( this.attstates.timer > 0 ){
			//Player in attack animation
			
			if(this.attstates.currentAttack){
				var attackMovementSpeed = this.deltaSpeed() * this.attstates.currentAttack.movement;
				if ( input.state('left') > 0 ) { this.force.x -= attackMovementSpeed; }
				if ( input.state('right') > 0 ) { this.force.x += attackMovementSpeed; }
			}
			
			if ( input.state('fire') == 1 ) { 
				//Let the player queue more attacks
				this.attack(this); 
			} else if (input.state('fire') > 1){
				//Keep building up the charge
				this.attstates.charge += game.deltaUnscaled;
			} else {
				this.attstates.charge = 0.0;
			}
			
			if(this.attstates.currentAttack){
				//Strike ahead
				if(this.attstates.timer < this.attstates.currentAttack.time){
					this.strike(this.attstates.currentAttack.strike);
				}
			}
		} else if( this.delta > 0) {
			//Player is in move/idle state
			
			this.states.guard = ( input.state('block') > 0 || this.autoblock );
			
			if(input.state("select") == 1 && this.spells.length > 0){
				audio.play("equip");
				this.spellCursor = (this.spellCursor+1)%this.spells.length;
			}
			
			if( !this.states.duck ) {
				if ( input.state('left') > 0 ) { this.force.x -= this.deltaSpeed(); }
				if ( input.state('right') > 0 ) { this.force.x += this.deltaSpeed(); }
				
				//Come to a complete stop
				if ( input.state('right') <= 0 && input.state('left') <= 0 && this.grounded ) { 
					this.force.x -= this.force.x * Math.min(this.speeds.breaks*this.delta);
				}
			} else {
				this.states.turn = 0.0;
			}
			
			if(this.states.turn > 0){
				//Block disabled while turning
				this.states.guard = false;
			}
			
			if(this.states.againstwall && !this.grounded && input.state("down") <= 0){
				//Wall slide
				if(this.force.y > 0){
					this.force.y = Math.min(this.force.y, 4);
				}
			}
						
			if ( this.downstab && input.state("down") > 0 && !this.grounded) { 
				//Down strike
				this.states.downStab = true;
				this.states.guard = false;
				
				if(this.force.y > 0){
					this.strike(new Line( -4, 8, 4, 20));
				}
				
			} else if ( input.state('fire') == 1 && input.state("up") > 0 ) { 
				//Cast Spell
				if(this.spells.length > 0){
					var spell = this.spells[this.spellCursor];
					if(spell.canCast(this) && spell.stock > 0){
						this.states.spellCurrent = spell;
						this.states.spellCounter = spell.castTime;
					} else {
						audio.play("negative");
					}
				}
			} else if ( input.state('fire') == 1 ) { 
				//Attack and start combo
				this.attack(this); 
			} else if ( input.state('fire') > 0 ) { 
				//Charge attack
				this.attstates.charge += game.deltaUnscaled;
			} else {
				if( this.attstates.charge >= this.speeds.charge){
					//Release Charge
					this.cancelAttack();
					this.attack();
				}
				this.attstates.charge = 0.0;
			}
			
			
			//Apply jump boost
			if( this.spellsCounters.flight > 0 ) {
				this.gravity = 0.2;
				if ( input.state('down') > 0 ) { this.force.y += this.delta * 1.55; }
				if ( input.state('jump') > 0 ) { this.force.y -= this.delta * 1.65; }
			} else { 
				this.gravity = 1.0; 
				if ( input.state('jump') > 0 && !this.grounded ) { 
					
					if( this.force.y > 0 ) {
						this.force.y -= this.speeds.airBoost * this.speeds.airGlide * this.delta;
					}
				
					if( this.jump_boost ) {
						var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : this.speeds.airBoost;
						this.force.y -= this.gravity * boost * this.delta; 
					}
				} else {
					this.jump_boost = false;
					this.airtime = 0.0;
				}
			}
			
			if ( input.state('block') <= 0 && input.state('jump') == 1 ) { 
				if(this.grounded || (this.states.doubleJumpReady && this.doubleJump) || this.states.againstwall){
					this.jump(); 
				}
			}
			if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
				this.duck(); 
			} else { 
				this.stand(); 
			}
			
			if ( input.state("dodge") > 0 && this.states.rollCooldown <= 0 ) {
				//Dodge roll
				if(this.dodgeFlash){
					this.states.roll = this.invincible = this.dodgeTime;
					this.force.y = 0;
					this.position.y -= 1;
					this.grounded = false;
					this.states.rollCooldown = this.speeds.rollCooldown;
				} else if(this.grounded){
					this.states.roll = this.invincible = this.rollTime;
					this.states.rollCooldown = this.speeds.rollCooldown;
				}
			} else if (strafe) {
				//Limit speed and face current direction
				this.force.x = Math.min( Math.max( this.force.x, -2), 2);
				
			} else {
				//Change to face player's selected direction
				if ( input.state('left') > 0 ) { 
					if(!this.flip) this.states.turn = this.speeds.turn;
					this.flip = true; 
				}
				if ( input.state('right') > 0 ) { 
					if(this.flip) this.states.turn = this.speeds.turn;
					this.flip = false;
				}
			}
			
			//Prep roll
			this.states.rollPressCounter -= this.delta;
			if( input.state('left') == 1 || input.state('right') == 1 ){
				this.states.rollDirection = 1.0;
				this.states.rollPressCounter = Game.DELTASECOND * 0.25;
				if( input.state('left') ) this.states.rollDirection = -1.0;
			}
			
		}
		
		this.states.doubleJumpReady = this.states.doubleJumpReady || this.grounded;
		this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
		this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
		this.height = this.states.duck ? 24 : 30;
	}
	//Shield
	this.states.guard_down = this.states.duck;
	this.guard.active = this.states.guard;
	this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.knockedout ){
		this.frame.x = 10;
		this.frame.y = 1;
	} else if ( this.stun > 0 || this.life < 0 ) {
		//Stunned
		this.stand();
		this.frame.x = 10;
		this.frame.y = 1;
	} else if( this.states.ledge ) {
		this.frame.x = 0;
		this.frame.y = 6;
	} else if( this.states.spellCounter > 0 ) {
		this.frame.x = (1 - Math.min(this.states.spellCounter / Game.DELTASECOND, 1)) * 8;
		this.frame.y = 7;
	} else if( this.states.roll > 0 ) {
		if(this.dodgeFlash){
			this.frame.y = 6;
			this.frame.x = 8;
		} else {
			this.frame.y = 2;
			this.frame.x = 6 * (1 - this.states.roll / this.rollTime);
		}
	} else if( this.states.downStab ){
		if(this.frame.x > 2) this.frame.x = 0;
		this.frame.x = Math.min(this.frame.x + this.delta * 0.2,2);
		this.frame.y = 3; 
	} else {
		if(this.attstates.currentAttack){
			//Attack
			var sequence = Weapon.animations[this.attstates.currentAttack.animation];
			var progress = Math.max(Math.min(this.attstates.timer / this.attstates.currentAttack.time,1),0);
			this.frame = sequence.frame(progress);
		} else if( !this.grounded ) {
			//In air
			if(this.states.againstwall && this.force.y > 0){
				this.frame.x = 7;
				this.frame.y = 6;
			} else if(!this.states.doubleJumpReady){
				this.frame.y = 2;
				this.frame.x = Math.max(1,(this.frame.x + this.delta * 0.3)%5);
			} else {
				this.frame.y = 2;
				if(this.force.y < 0.5){
					this.frame.x = 6;
				} else if(this.force.y > 2.0){
					this.frame.x = 8;
				} else {
					this.frame.x = 7;
				}
			}
		} else if( this.states.duck ) {
			//Duck
			this.frame.x = Math.max(Math.min(this.frame.x + this.delta * 0.4,10),8);
			this.frame.y = 0;	
		} else {
			//if( this.states.attack_charge > this.attackProperties.charge_start || this.states.attack > 0 ) this.frame.y = 2;
			if(this.states.turn > 0){
				//Turn animation
				this.frame.y = 3;
				this.frame.x = 3 + 6 * (1-this.states.turn/this.speeds.turn);
			} else if( Math.abs( this.force.x ) > 0.1 && this.grounded ) {
				//Run animation
				this.frame.y = 1;
				this.frame.x = (this.frame.x + this.delta * 0.1 * Math.abs( this.force.x )) % 10;
			} else {
				//Idle
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 8;
			}
		}
		
		//if( this.states.attack_charge > this.attackProperties.charge_start ) this.frame.x = 0;
	}
	
	//Timers
	var attack_decrement_modifier = this.spellsCounters.haste > 0 ? 1.3 : 1.0;
	this.states.rollCooldown -= this.delta;
	this.states.justjumped -= this.delta;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
	this.states.effectTimer += this.delta;
	this.states.turn -= this.delta;
	
	if(Math.abs(this.states.againstwall) <= this.delta){
		this.states.againstwall = 0;
	} else {
		this.states.againstwall -= (this.states.againstwall>0?1:-1) * this.delta;
	}
	
	if( this.states.afterImage.status(this.delta) ){
		game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
	}
}
Player.prototype.deltaSpeed = function(){
	var speed = this.speeds.baseSpeed;
	if( this.spellsCounters.haste > 0 ) speed *= 1.6;
	return speed * this.inertia * this.delta;
}
Player.prototype.idle = function(){}
Player.prototype.stand = function(){
	if( this.states.duck ) {
		this.position.y -= 4;
		this.states.duck = false;
	}
}
Player.prototype.duck = function(){
	if( !this.states.duck ) {
		this.position.y += 3.0;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
		this.frame.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = this.speeds.jump;
	
	if(this.states.duck){
		//Fall through floor
		var standingTile = game.getTile(
			this.position.x,
			this.position.y + 2 + _player.height * .5
		);
		if(standingTile in tilerules.currentrule() && tilerules.currentrule()[standingTile] == tilerules.onewayup){
			this.grounded = false; 
			this.position.y += 2;
			return;
		}
	}
	if(!this.grounded){
		this.states.doubleJumpReady = false;
		
		if(this.states.againstwall){
			force *= 1.2;
			this.force.x = (this.states.againstwall>0?-1:1) * 3;
		}
	}
	
	
	if( this.spellsCounters.flight > 0 ) force = 2;
	
	this.states.justjumped = Game.DELTASECOND * 0.2;
	this.force.y = -force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}

Player.prototype.attack = function(){
	//Player has pressed the attack button or an attack has been queued
	
	if(this.attstates.currentQueue){
		//Chain up next attack
		if(this.attstates.timer >= this.attstates.attackEndTime){
			//Previous attack complete, start next attack
			var state = Weapon.playerState(this);
			this.attstates.hit = false;
			if(this.attstates.currentQueueState == state && this.attstates.currentQueuePosition+1 < this.attstates.currentQueue.length){
				this.attstates.currentQueuePosition++;
				
				this.hitIgnoreList = new Array();
				this.attstates.currentAttack = this.attstates.currentQueue[this.attstates.currentQueuePosition];
				this.attstates.timer = -this.attstates.currentAttack["warm"];
				this.attstates.attackEndTime = this.attstates.currentAttack["miss"] + this.attstates.currentAttack["time"];
				
				if(!this.grounded){
					this.airtime = this.attstates.attackEndTime * this.perks.attackairboost;
				}
				
				return;
			} else {
				this.cancelAttack();
				return;
			}
		} else {
			if(this.attstates.hit || this.attstates.currentQueue.alwaysqueue){
				this.attstates.autostartNextAttack = true;
			}
			return;
		}
	}
	
	//Start new queue
	var state = Weapon.playerState(this);
	
	this.hitIgnoreList = new Array();
	this.attstates.currentQueuePosition = 0;
	this.attstates.currentQueueState = state;
	this.attstates.currentQueue = this.attstates.stats[this.attstates.currentQueueState];
	this.attstates.currentAttack = this.attstates.currentQueue[this.attstates.currentQueuePosition];
	
	//Attack ends after the attack + miss
	this.attstates.timer = -this.attstates.currentAttack["warm"]
	this.attstates.attackEndTime = this.attstates.currentAttack["miss"] + this.attstates.currentAttack["time"];
	
	if(!this.grounded){
		this.airtime = this.attstates.attackEndTime * this.perks.attackairboost;
	}
}
Player.prototype.cancelAttack = function(){
	this.attstates.currentAttack = null;
	this.attstates.currentQueue = null;
	this.attstates.currentQueuePosition = 0;
	this.attstates.currentQueueState = null;
	this.hitIgnoreList = new Array();
	this.attstates.hit = false;
	
	this.attstates.timer = 0.0;
}
Player.prototype.baseDamage = function(){
	return Math.round(8 + this.stats.attack * this.attstates.stats.damage);
}

Player.prototype.currentDamage = function(){
	if(this.attstates.currentAttack) {
		return Math.round(this.baseDamage() * this.attstates.currentAttack["damage"]);
	} else {
		return this.baseDamage();
	}
}


Player.prototype.castSpell = function(name){
	var spell = this.states.spellCurrent;
	if(spell instanceof Spell){
		if(spell.stock > 0 ){
			spell.use(this);
			spell.stock--;
		}
	}
}
Player.prototype.addUniqueItem = function(item){
	if(!(item instanceof Item)){
		return;
	}
	for(var i=0; i < this.uniqueItems.length; i++){
		if(item.name == this.uniqueItems.name){
			return;
		}
	}
	this.uniqueItems.push(item);
}

Player.prototype.equipSpell = function(s){
	this.spellCursor = this.spells.length;
	this.spells.push(s);
	
	s.trigger("equip");
}
Player.prototype.equipCharm = function(c){
	if( this.charm instanceof Item ){
		//Drop Item
		this.charm.sleep = Game.DELTASECOND;
		this.charm.position.x = this.position.x;
		this.charm.position.y = this.position.y;
		if(!this.charm.hasModule(mod_rigidbody)) this.charm.addModule(mod_rigidbody);
		game.addObject(this.charm);
		this.charm.trigger("unequip");
	}
	this.charm = c;
	c.trigger("equip");
}
Player.prototype.equip = function(sword, shield){
	try {
		if(sword == undefined && shield == undefined){
			sword = this.equip_sword;
			shield = this.equip_shield;
		}
		
		if( sword.isWeapon ){
			NPC.set(sword.name, 1);
			this.attstates.stats = WeaponStats[sword.name];
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( "stats" in shield){
				NPC.set(shield.name, 1);
				
				this.shieldProperties.duck = -12.0 + (15 - (shield.stats.height/2));
				this.shieldProperties.stand = -12.0;
				this.guard.x = 0;
				this.guard.w = 28;
				this.guard.lifeMax = shield.stats.guardlife;
				this.guard.life = this.guard.lifeMax;
				this.guard.h = shield.stats.height;
				this.speeds.turn = shield.stats.turn * Game.DELTASECOND;
				this.shieldProperties.frame = shield.stats.frame;
				this.shieldProperties.frame_row = shield.stats.frame_row;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
		
		//Drop old weapon
		if( this.equip_sword != undefined && this.equip_sword != sword ){
			this.equip_sword.trigger("unequip",this);
			this.equip_sword.sleep = Game.DELTASECOND * 2;
			this.equip_sword.position.x = this.position.x;
			this.equip_sword.position.y = this.position.y;
			//game.addObject( this.equip_sword );
		}
		
		//Drop old shield
		if( this.equip_shield != undefined && this.equip_shield != shield ){
			this.equip_shield.trigger("unequip",this);
			this.equip_shield.sleep = Game.DELTASECOND * 2;
			this.equip_shield.position.x = this.position.x;
			this.equip_shield.position.y = this.position.y;
			
			this.shieldSlots = new Array();
		}
		
		if( this.equip_sword != sword && sword instanceof Item ) sword.trigger("equip", this);
		if( this.equip_shield != shield && shield instanceof Item ) shield.trigger("equip", this);
		
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		//Set stats to base
		this.stats.attack = this.baseStats.attack;
		this.stats.magic = this.baseStats.magic;
		this.defencePhysical = 0.0;
		this.defenceFire = 0.0;
		this.defenceSlime = 0.0;
		this.defenceIce = 0.0;
		this.defenceLight = 0.0;
		this.damage = 0;
		this.damageFire = 0;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		for(var i in this.perks){
			this.perks[i] = 0.0;
		}
		this.perks.painImmune = false;
		
		this.attstates.stats.onEquip(this);
		
		if(this.equip_shield != null){
			for(var i=0; i < this.equip_shield.slots.length; i++){
				if(this.shieldSlots[i] instanceof Spell){
					var slotType = Math.floor(this.equip_shield.slots[i] / 3);
					var slotPower = Math.floor(this.equip_shield.slots[i] % 3);
					this.shieldSlots[i].modifyStats(this, slotType, slotPower);
				}
			}
		}
		
		this.damage = Math.floor(this.damage + this.stats.attack * this.attstates.stats.damage);
		this.speeds.manaRegen = Game.DELTASECOND * (10 - this.stats.magic * (9/19));
		
	} catch(e) {
		this.equip( this.equip_sword, this.equip_shield );
	}
}
Player.prototype.hasEquipment = function(name){
	for(var i=0; i < this.equipment.length; i++ ){
		if( this.equipment[i].name == name ) return true;
	}
	return false
}
Player.prototype.levelUp = function(index){
	if( this.stat_points > 0 ) {
		var i=0;
		for(var attr in this.stats ){
			if( i == index && this.stats[attr] < 20) {
				this.stats[attr]++;
				this.stat_points--;
				audio.play("levelup");
			}
			i++;
		}
	}
	
	this.equip( this.equip_sword, this.equip_shield );
}
Player.prototype.addWaystone = function(value){
	this.waystones += value;
	if( this.hasCharm("charm_alchemist") ) {
		this.waystones += value;
	}
}
Player.prototype.addMoney = function(value){
	this.money += value;
	if( this.hasCharm("charm_musa") ) {
		this.life = Math.min( this.life + value*2, this.lifeMax );
	}
	this.trigger("money", value);
}
Player.prototype.addXP = function(value){
	DemoThanks.kills++;
	
	return;
	this.nextLevel = Math.floor( Math.pow( this.level,1.8 ) * 50 );
	this.prevLevel = Math.floor( Math.pow( this.level-1,1.8 ) * 50 );
	
	if(this.hasCharm("charm_wise")) value += Math.floor(value*0.3);
	
	this.experience += value;
	
	if( this.experience >= this.nextLevel ) {
		this.stat_points++;
		this.level++;
		this.life = this.lifeMax;
		this.damage_buffer = 0;
		audio.playLock("levelup2",0.1);
		
		if(Math.random() < 0.1){
			var treasure = Item.randomTreasure(Math.random(),[],{"locked":true});
			//dataManager.itemUnlock(treasure.name);
		}
		
		//Call again, just in case the player got more than one level
		this.addXP(0);
	}
}
Player.prototype.hasCharm = function(value){
	if( this.charm instanceof Item ) {
		return this.charm.name == value;
	}
	return false;
}
Player.prototype.respawn = function(g,c){
	this.life = this.lifeMax;
	this.mana = this.manaMax;
	this.interactive = true;
	this.lock_overwrite = false;
	this.hurtByDamageTriggers = true;
	
	Checkpoint.loadState(this);
	
	game.addObject(this);
	
	game.pause = false;
	PauseMenu.open = false; 
}
Player.prototype.render = function(g,c){	
	/*
	if(this.trot == undefined)this.trot = new Point(0,0);
	if(input.state("left")==1) this.trot.x -= 1;
	if(input.state("right")==1) this.trot.x += 1;
	if(input.state("up")==1) this.trot.y -= 1;
	if(input.state("down")==1) this.trot.y += 1;
	this.frame.x = this.trot.x;
	this.frame.y = this.trot.y;
	*/
	
	//Render player
	if( this.states.roll <= 0 ){
		//Spell effects
		if( this.spellsCounters.flight > 0 ){
			var wings_offset = new Point((this.flip?8:-8),0);
			var wings_frame = 3-(this.spellsCounters.flight*0.2)%3;
			if( this.grounded ) wings_frame = 0;
			g.renderSprite("magic_effects",this.position.subtract(c).add(wings_offset),this.zIndex, new Point(wings_frame, 0), this.flip);
		}
		if( this.spellsCounters.magic_armour > 0 ){
			this.sprite.render(g,this.position.subtract(c),this.frame.x, this.frame.y, this.flip, "enchanted");
		}
		
		//adjust for ledge offset
		if(_player.states.ledge){
			g.renderSprite(
				this.sprite,
				this.position.subtract(c).add(new Point(0,19)),
				this.zIndex,
				this.frame,
				this.flip,
				{"shader":this.filter}
			);
		} else {
			GameObject.prototype.render.apply(this,[g,c]);
		}
	} else {
		//When rolling, ignore flip and shader
		if(this.dodgeFlash){
			var flashLength = Math.max(1 - this.states.roll/this.dodgeTime,0) * 96;
			g.color = [1,1,1,1];
			g.scaleFillRect(
				(this.position.x - (this.flip?0:flashLength)) - c.x,
				(this.position.y - 6) - c.y,
				flashLength,
				12
			);
		}
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, this.force.x < 0);
	}
	
	if( this.spellsCounters.thorns > 0 ){
		g.renderSprite("magic_effects",this.position.subtract(c),this.zIndex, new Point(3, 0), this.flip);
	}
	
	//Render shield after player if active
	//this.rendershield(g,c);
	
	//Render current sword
	if(this.states.roll <= 0){
			this.renderWeapon(g,c);
			this.renderShield(g,c);
			
			if(this.attstates.charge > 0){
				EffectList.charge.apply(this, [g,
					this.position.subtract(c).add(new Point(this.forward()*16,0)),
					this.attstates.charge / this.speeds.charge
				]);
			}
	}
	
	//Charge effect
	/*
	var chargeProgress = this.equip_weapon.chargeTime.time - Game.DELTASECOND*0.5;
	if( chargeProgress > 0 ) {
		var effectPos = new Point(this.position.x, this.position.y - 16);
		EffectList.charge(g, effectPos.subtract(c), chargeProgress);
	}
	*/
	
	//Strike effect
	/*
	if( this.states.attack < this.attackProperties.strike && this.states.attack > this.attackProperties.rest ){
		//var spos = new Point(this.attackProperties.range,0);
		var spos = new Point(24,-2);
		var slength = 5;
		if(this.attackProperties.range > 20 ) slength = 6;
		if(this.attackProperties.range > 28 ) slength = 7;
		var progress = (this.states.attack - this.attackProperties.rest) / (this.attackProperties.strike - this.attackProperties.rest);
		var sframe = Math.trunc(2 - (progress*3));
		if(this.flip) spos.x *= -1;
		if(this.states.duck) spos.y = 4;
		"bullets".render(g,this.position.add(spos).subtract(c),sframe,slength,this.flip);
	}
	*/
}

Player.prototype.renderWeapon = function(g,c,ops,eops){
	try{
		ops = ops || {};
		eops = eops || {};
		
		var _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
		var rotation = _t.r;
		var sposition = _t.p;
		var zPlus = _t.z;
		var effect = _t.v;
		var shield = _t.s;
		
		if(this.flip){
			sposition = new Point(sposition.x*-1,sposition.y);
		}
		ops["rotate"] = (this.flip ? -1 : 1) * rotation;
		
		g.renderSprite("swordtest", this.position.subtract(c).add(sposition), this.zIndex+zPlus, this.equip_sword.equipframe, false, ops);
		if(effect instanceof Point){
			g.renderSprite("swordeffect", this.position.subtract(c), this.zIndex+2, effect, this.flip, eops);
		}
	} catch (e){
		
	}
}
Player.prototype.renderShield = function(g,c,ops){
	try{
		var _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
		var shield = _t.s;
		
		if(shield instanceof Point){
			var shieldFrames = new Point(Math.abs(shield.y), this.shieldProperties.frame_row);
			var shieldFlip = shield.y < 0 ? !this.flip : this.flip;
			var shieldOffset = new Point(
				(this.flip?-1:1)*shield.x, 
				Math.floor(this.guard.y+_player.guard.h*0.5)
			);
			g.renderSprite(
				"shields", 
				this.position.subtract(c).add(shieldOffset), 
				this.zIndex+1, 
				shieldFrames, 
				shieldFlip,
				ops
			);
		}
	} catch(e){
	}
}

Player.prototype.hudrender = function(g,c){
	/* Render HP */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,7,(this.lifeMax)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,this.lifeMax,8);
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,Math.max(this.life,0),8);
	
	/* Render Buffered Damage */
	if(this.life > 0){
		g.color = [0.65,0.0625,0.0,1.0];
		var buffer_start = Math.max( 8 + (this.lifeMax-this.damage_buffer), 8)
		g.scaleFillRect(
			Math.max(this.life,0)+8,
			8,
			-Math.min(this.damage_buffer,this.life),
			8
		);
	}
	
	/* Render Mana */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,19,this.manaMax+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,20,this.manaMax,2);
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(8,20,this.mana,2);
	
	/* Render XP */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,25,24+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,26,24,2);
	g.color = [1.0,1.0,1.0,1.0];
	var rollprogress = Math.min(1 - (this.states.rollCooldown / this.speeds.rollCooldown), 1);
	g.scaleFillRect(8,26,Math.floor( rollprogress*24 ),2);
	//g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*24 ),2);
	
	textArea(g,"$"+this.money,8, 228 );
	//textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 ){
		textArea(g,"Press Start",8, 32 );
	}
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		g.renderSprite("items", 
			new Point((game.resolution.x-33)+i*4, 40),
			this.zIndex,
			this.keys[i].frame,
			false 
		);
	}
	
	var item_pos = 20 + Math.max(this.lifeMax, this.manaMax);
	//item hud
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-item_pos,-15));
		item_pos += 20;
	}
	if(this.spells.length > 0){
		var spell = this.spells[this.spellCursor];
		var spellXOff = spell.stock >= 10 ? -8 : -3;
		spell.render(g, new Point(item_pos,15));
		textArea(g,""+spell.stock,item_pos+spellXOff,24);
		item_pos += 20;
	}
	
	//Create light
	Background.pushLight( this.position, this.lightRadius );
}

Player.prototype.animtest = function(){
	if(input.state("up")==1)this.frame.y--;
	if(input.state("down")==1)this.frame.y++;
	if(input.state("left")==1)this.frame.x--;
	if(input.state("right")==1)this.frame.x++;
}
var playerSwordPosition = {
		0 : {
			0 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			1 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			2 : {p:new Point(-17,-2),s:new Point(20,2),r:0,z:1,v:0},
			3 : {p:new Point(-17,-3),s:new Point(20,2),r:0,z:1,v:0},
			4 : {p:new Point(-17,-3),s:new Point(20,2),r:0,z:1,v:0},
			5 : {p:new Point(-17,-2),s:new Point(20,2),r:0,z:1,v:0},
			6 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			7 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			8 : {p:new Point(-17,-5),s:new Point(20,2),r:0,z:1,v:0},
			9 : {p:new Point(-15,5),s:new Point(19,2),r:-5,z:1,v:0},
			10 : {p:new Point(-14,4),s:new Point(18,2),r:-80,z:1,v:0},
		},
		1 : {
			0 : {p:new Point(-9,1),s:new Point(20,0),r:-110,z:1,v:0},
			1 : {p:new Point(-9,1),s:new Point(20,0),r:-100,z:1,v:0},
			2 : {p:new Point(-10,2),s:new Point(20,1),r:-90,z:1,v:0},
			3 : {p:new Point(-11,4),s:new Point(20,1),r:-100,z:1,v:0},
			4 : {p:new Point(-12,1),s:new Point(20,2),r:-110,z:1,v:0},
			5 : {p:new Point(-12,0),s:new Point(20,2),r:-110,z:1,v:0},
			6 : {p:new Point(-12,3),s:new Point(20,1),r:-100,z:1,v:0},
			7 : {p:new Point(-12,4),s:new Point(20,1),r:-90,z:1,v:0},
			8 : {p:new Point(-12,3),s:new Point(20,1),r:-100,z:1,v:0},
			9 : {p:new Point(-12,5),s:new Point(20,0),r:-110,z:1,v:0},
			10 : {p:new Point(-16,0),r:114,z:1,v:0},
		},
		2 : {
			6 : {p:new Point(-13,-2),s:new Point(20,2),r:-10,z:1,v:0},
			7 : {p:new Point(-13,-3),s:new Point(20,2),r:0,z:1,v:0},
			8 : {p:new Point(-13,-7),s:new Point(20,2),r:0,z:1,v:0},
			9 : {p:new Point(-13,-4),s:new Point(20,2),r:0,z:1,v:0},
		},
		3 : {
			0 : {p:new Point(-12,-24),r:60,z:1,v:0},
			1 : {p:new Point(2,1),r:180,z:1,v:0},
			2 : {p:new Point(2,2),r:180,z:1,v:0},
			
			3 : {p:new Point(14,1),s:new Point(-20,-2),r:100,z:1,v:0},
			4 : {p:new Point(16,-1),s:new Point(-16,-3),r:70,z:1,v:0},
			5 : {p:new Point(6,-1),s:new Point(-8,-3),r:0,z:-1,v:0},
			6 : {p:new Point(-6,1),s:new Point(0,4),r:0,z:-1,v:0},
			7 : {p:new Point(-19,4),s:new Point(8,3),r:30,z:1,v:0},
			8 : {p:new Point(-18,-1),s:new Point(16,2),r:-10,z:1,v:0},
		},
		4 : {
			0 : {p:new Point(-14,0),r:-80,z:1,v:new Point(0,0)},
			1 : {p:new Point(16,-6),r:70,z:1,v:new Point(1,0)},
			2 : {p:new Point(12,-6),r:-45,z:-1,v:new Point(2,0)},
			3 : {p:new Point(12,-6),r:-50,z:-1,v:0},
			4 : {p:new Point(12,-6),r:-45,z:-1,v:0},
			5 : {p:new Point(-24,2),r:-60,z:1,v:new Point(0,1)},
			6 : {p:new Point(-21,-1),r:-60,z:1,v:new Point(1,1)},
			7 : {p:new Point(-23,0),r:-10,z:1,v:new Point(2,1)},
			8 : {p:new Point(21,-4),r:90,z:-1,v:new Point(0,4)},
			9 : {p:new Point(20,-4),r:90,z:-1,v:new Point(1,4)},
			10 : {p:new Point(20,-4),r:90,z:-1,v:0}
		},
		5 : {
			0 : {p:new Point(-16,1),r:-45,z:1,v:0},
			1 : {p:new Point(-16,2),r:-90,z:1,v:0},
			2 : {p:new Point(15,-2),r:90,z:1,v:new Point(0,2)},
			3 : {p:new Point(12,-6),r:45,z:-1,v:new Point(1,2)},
			4 : {p:new Point(6,-6),r:45,z:-1,v:new Point(2,2)},
			5 : {p:new Point(14,-2),r:50,z:-1,v:new Point(3,2)},
			6 : {p:new Point(16,4),r:80,z:1,v:0},
			7 : {p:new Point(-4,4),r:100,z:-1,v:0},
			8 : {p:new Point(12,-26),r:10,z:-1,v:0,v:new Point(0,6)},
			9 : {p:new Point(12,-27),r:0,z:-1,v:0,v:new Point(1,6)},
			10 : {p:new Point(12,-27),r:0,z:-1,v:0,v:new Point(2,6)},
			11 : {p:new Point(12,-27),r:0,z:-1,v:0},
		},
		6 : {
			8 : {p:new Point(-16,1),r:-45,z:1,v:0}
		},
		8 : {
			0 : {p:new Point(-15,-2),r:-10,z:1,v:0},
			1 : {p:new Point(-14,-5),r:-45,z:1,v:0},
			2 : {p:new Point(-15,-2),r:-140,z:1,v:0},
			3 : {p:new Point(12,-6),r:45,z:-1,v:new Point(0,3)},
			4 : {p:new Point(-4,5),r:220,z:-1,v:new Point(1,3)},
			5 : {p:new Point(9,2),r:110,z:1,v:0},
			6 : {p:new Point(-20,-1),r:60,z:1,v:0},
		},
		9 : {
			0 : {p:new Point(-16,5),r:-80,z:1,v:0},
			1 : {p:new Point(-20,2),r:45,z:1,v:0},
			2 : {p:new Point(-20,2),r:90,z:1,v:0},
			3 : {p:new Point(21,1),r:90,z:-1,v:new Point(0,5)},
			4 : {p:new Point(17,2),r:90,z:-1,v:new Point(1,5)},
			5 : {p:new Point(-20,1),r:55,z:1,v:0}
		}
	}