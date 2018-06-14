class Player extends GameObject{
	get isAttacking(){return this.attstates.currentAttack >= 0; }
	get currentAttack(){
		if(this.isAttacking){
			return this.equip_sword.stats.getAttack(this.attstates.currentAttack);
		}
		return null;
	}
	get attackProgress() {
		return this.attstates.time / this.attstates.totalTime;
	}
	get isDownstabbing(){
		return this.attstates.currentAttack == PlayerWeapon.DOWNATTACK_INDEX;
	}
	constructor(x,y){
		super(x,y);
		this.position.x = x;
		this.position.y = y;
		this.width = 18;
		this.height = 30;
		this.zIndex = 10;
		this.checkpoint = new Point(x,y);
		
		this.keys = [];
		this.spellCursor = 0;
		this.uniqueItems = [];
		this.pause = false;
		this.canmove = true;
		this.showplayer = true;
		
		this.equip_sword = new Item(0,0,0,{"name":"short_sword","enchantChance":0});
		this.equip_shield = new Item(0,0,0,{"name":"small_shield","enchantChance":0});
		
		self._player = this;
		this.sprite = "player";
		this.swrap = spriteWrap["player"];
		
		this.lightRadius = false;
		this.grabLedge = true;
		this.downstab = false;
		this.walljump = false;
		this.doubleJump = false;
		this.dodgeFlash = false;
		this.flight = false;
		
		this.states = {
			"duck" : false,
			"guard" : true,
			"stun" : 0.0,
			"start_attack" : false,
			"death_clock" : Game.DELTASECOND,
			"guard_down" : false,
			"attack_charge" : 0,
			"charge_multiplier" : false,
			"stanimaLock" : false,
			"rolling" : 0,
			"back_dash" : 0,
			"dash" : 0.0,
			"dash_direction" : 1,
			"airdash" : 0,
			"airdashReady" : true,
			"effectTimer" : 0.0,
			"downStab" : false,
			"jump_boost" : false,
			"afterImage" : new Timer(0, Game.DELTASECOND * 0.125),
			"manaRegenTime" : 0.0,
			"againstwall" : 0.0,
			"turn" : 0.0,
			"doubleJumpReady": true,
			"spellCounter" : 0.0,
			"spellCurrent" : undefined,
			"justjumped" : 0.0,
			"ledgePosition" : false,
			"canGrabLedges" : 0.0,
			"damageBuffer" : 0,
			"damageBufferTick" : 0.0,
			"animationProgress" : 0.0,
			"duckTime" : 0.0,
		};
		
		this.attstates = {
			"currentAttack" : -1, // attack index
			"queue" : null, // true if another press
			"time" : 0.0, //current time in attack
			"totalTime" : 0.0, //Time for the attack
			"wait" : 0.0, //Time after attack
		};
		
		this.shieldProperties = {
			"duck" : 8.0,
			"stand" : -8.0,
			"frame_row" : 3,
		};
		
		
		this.speeds = {
			"baseSpeed" : 4.4,
			"dashTime" : 0.5,
			"airdashTime" : 0.5,
			"airdashStopTime" : 0.7,
			"baseSpeedMax" : 4.0,
			"dashSpeed" : 12.0,
			"inertiaGrounded" : 0.8,
			"inertiaAir" : 0.4,
			"frictionGrounded" : 0.2,
			"frictionAir" : 0.1,
			"jump" : 8.4,
			//"jump" : 7.0,
			"airBoost" : 13,
			"airGlide" : 0.0,
			"breaks": 16,
			"manaRegen" : Game.DELTASECOND * 60,
			"turn" : Game.DELTASECOND * 0.25,
			"charge" : Game.DELTASECOND * 0.4,
			"duckTime" : Game.DELTASECOND * 0.25,
		};
		
		this.on("pre_death", function(){
			this.heal = 0;
			game.slow(0,this.death_time);
			
			game.ga_event("death", game.newmapName, this.position.floor(256,240).toString());
			
		});
		this.on("death", function(){
			DemoThanks.deaths++;
			
			this.position.x = 128;
			this.position.y = 200;
			
			/*if( window._world instanceof WorldMap ){
				window._world.worldTick();
			}*/
			
			for(var i=0; i < game.objects.length; i++ ){
				if(game.objects[i] instanceof GameObject){
					game.objects[i].trigger("player_death");
				}
			}
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
		this.on("blockCollideHorizontal", function(h,block){
			if(this.grabLedge && this.states.canGrabLedges <= 0.0){
				let grabHeight = 12;
				var blockC =  block.corners();
				var blockTop = blockC.top;
				var currentTop = this.position.y - grabHeight;
				var nextTop = (this.position.y + this.force.y * UNITS_PER_METER * this.delta ) - grabHeight;
				
				if(nextTop >= blockTop && currentTop < blockTop){
					this.states.ledgePosition = block;
					this.force.x = this.force.y = 0;
					
					if(h > 0){
						this.position.x = blockC.left - this.width * this.origin.x - 1;
					} else {
						this.position.x = blockC.right + this.width * this.origin.x + 1;
					}
				}
			}
		});
		this.on("collideHorizontal", function(h){
			this.states.againstwall = (h>0?1:-1) * Game.DELTASECOND * 0.1;
			
			if(this.walljump){
				this.states.airdashReady = true;
			}
			
			if(this.states.airdash > 0){
				this.states.airdash = 0;
				shakeCamera(Game.DELTASECOND*0.3,3);
			}
		});
		this.on("collideVertical", function(v){
			if(v>0) this.knockedout = false;
			if(v>0){
				this.states.ledgePosition = false;
			}
		});
		this.on("block", function(obj,strike_rect,damage){
			if( this.team == obj.team ) return;
			if( this.invincible > 0 ) return;
			
			//blocked
			var dir = this.position.subtract(obj.position);
			var kb = damage / 3.0;
			
			if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
			
			//obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
			audio.playLock("block",0.1);
			
			var effect = new EffectBlock(this.position.x+18*this.forward(), strike_rect.center().y);
			effect.flip = this.flip;
			game.addObject(effect);
		});
		this.on("blocked", function(obj){
			if(obj.hasModule(mod_combat)){
				//Calculate fire damage through shield
				let fireDamage = Math.round(this.perks.fireDamage * 100);
				fireDamage = Math.max( fireDamage - obj.defenceFire, 0);
				
				obj.life -= fireDamage;
				obj.displayDamage(fireDamage);
				obj.isDead();
				
				if(this.isDownstabbing){
					this.trigger("downstabTarget", obj, 0);
				}
			}
		});
		this.on("hurt", function(obj, damage){
			//this.states.ledge = null;
			
			var str = Math.min(Math.max(Math.round(damage*0.25),1),6);
			var dir = this.position.subtract(obj.position);
			this.airtime = this.states.airdash = 0;
			
			shakeCamera(Game.DELTASECOND*0.5,str);
			
			this.cancelAttack();
			this.states.ledgePosition = false;
			
			var effect = new EffectHurt(this.position.x, this.position.y);
			var direction = obj.position.subtract(this.position);
			effect.intensity = 0.6 + Math.min(0.32 * (damage/24),0.32);
			effect.rotation = (Math.atan2(direction.y,direction.x)/Math.PI)*180;
			game.addObject(effect);
			
			var knockback = this.grounded ? 7 : 3;
			if(dir.x < 0){
				this.force.x = -knockback;
			}else{
				this.force.x = knockback;
			}
			if(this.stun_time > 0 ){
				this.states.spellCounter = 0.0;
				this.stun = this.stun_time * Math.max(1 - this.perks.painImmune, 0);
				game.slow(0,Game.DELTAFRAME30);
			}
			if( this.perks.thorns > 0 && obj.hurt instanceof Function){
				obj.hurt(this,Math.floor(damage * this.perks.thorns));
			}
			if(this.life > 0 && damage >= this.life){
				audio.play("deathwarning");
			}
			Background.flash = [0.6,0,0,1];
			audio.play("playerhurt");
		});
		/*
		this.on("struckTarget", function(obj, pos, damage){
			if( this.states.downStab && obj.hasModule(mod_combat)){
				this.states.downStab = false;
				this.force.y = -2;
				this.jump();
				this.doubleJumpReady = true;
			}
		})*/;
		this.on("break_tile", function(obj, damage){
			if(this.isDownstabbing){
				this.trigger("downstabTarget", obj, damage);
				obj.trigger("downstabbed", this, damage);
			}
		});
		this.on("hurt_other", function(obj, damage){
			var ls = Math.min(this.perks.lifeSteal, 1.0);
			this.lifeStealCarry += Math.max(Math.min(damage * ls, obj.life),0);
			this.life = Math.min( this.life + Math.floor(this.lifeStealCarry), this.lifeMax );
			this.lifeStealCarry -= Math.floor(this.lifeStealCarry);
			
			this.states.airdashReady = true;
			
			if(this.isAttacking){
				
				SparkEffect.create(this.position.add(obj.position).scale(0.5), 8);
				
				if(obj.life > 0 && this.grounded){
					//Lock player into combo unless target is dead or player is moving
					this.attstates.wait = this.attstates.hitWait;
				}
				
				this.hitIgnoreList.push(obj);
				
				let attack = this.currentAttack;
				
				shakeCamera(Game.DELTASECOND * 0.25, 2.0 * attack.damage);
				
				if("pause" in attack){
					game.slow(0.0, attack.pause);
				}
				if("stun" in attack){
					obj.stun = attack.stun;
					if(!this.grounded && obj.life > 0 && obj.hasModule(mod_rigidbody)){
						obj.airtime = attack.stun * this.perks.attackairboost;
					}
				}
				if("knockback" in attack && obj.hasModule(mod_combat)){
					var scale = 1.0 / Math.max(obj.mass, 1.0);
					var knock = new Point(this.forward() * attack.knockback.x, attack.knockback.y).scale(scale);
					obj.combat_knockback.x += knock.x;
					obj.combat_knockback.y += knock.y;
				}
				
			}
			
			if(this.isDownstabbing){
				//this.states.downStab = false;
				this.trigger("downstabTarget", obj, damage);
				obj.trigger("downstabbed", this, damage);
			} else if( !this.grounded ) {
				//Add extra float
				this.force.y -= this.speeds.jump * this.speeds.airGlide;
			}
			
			//Charge kill explosion!
			if( this.attstates.currentAttack == PlayerWeapon.CHARGED_INDEX ){
				//A little shake
				shakeCamera(Game.DELTASECOND*0.3,5);
				
				if( obj.ragdoll ) {
					//Send the enemy flying
					var dir = obj.position.add(new Point(0,-2)).subtract(this.position);
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
		this.on("downstabTarget", function(obj, damage){
			this.jump();
			this.force.y -= 4;
			this.states.doubleJumpReady = true;
		});
		this.on("added", function(){
			this.states.damageBuffer = 0;
			this.lock_overwrite = false;
			this.force.x = this.force.y = 0.0;
			this.states.doubleJumpReady = true;
			
			this.stun = this.invincible = 0.0;
			
			game.camera.x = this.position.x-128;
			game.camera.y = Math.floor(this.position.y/240)*240;
			
			PauseMenu.pushIcon(this.mapIcon);
			
			Checkpoint.saveState(this);
		});
		this.on("collideObject", function(obj){
			if( this.states.airdash > 0 && this.states.airdash < this.speeds.airdashTime * this.speeds.airdashStopTime){
				if("hurt" in obj && obj.hasModule(mod_combat)){
					var damage = this.baseDamage();
					obj.hurt(this, damage);
					
					this.airtime = this.states.airdash = 0;
					this.force.x = -this.force.x;
					this.force.y = -this.speeds.jump;
					
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
			"defence" : 0,
			"magic" : 3
		};
		this.stats = {
			"attack" : 9,
			"defence" : 0,
			"magic" : 3
		};
		
		this.perks = {
			"attackairboost" : 0.0,
			"fireDamage" : 0.0,
			"lifeSteal" : 0.0,
			"bonusMoney" : 0.0,
			"painImmune" : 0.0,
			"thorns" : 0.0,
			"slowWound": 0.0,
			"attackSpeed": 0.0,
			"manaRegen" : 0.0,
			"poisonResist" : 0.0
		}
		
		this.gravity = 1;
		this.life = 48;
		this.lifeMax = 48;
		this.mana = 24;
		this.manaMax = 24;
		this.stanimaBase = Game.DELTASECOND * 0.5;
		this.stanima = this.stanimaBase;
		this.stanimaMax = this.stanimaBase;
		this.stanimaRestore = 0.2;
		this.money = 0;
		this.heal = 0;
		this.healMana = 0;
		this.damage = 5;
		this.team = 1;
		this.mass = 1;
		this.lifeStealCarry = 0.0;
		this.stun_time = Game.DELTASECOND * 0.33333333;
		this.death_time = Game.DELTASECOND * 2;
		this.invincible_time = Game.DELTASECOND * 1.5;
		this.autoblock = true;
		this.rollTime = Game.DELTASECOND * 0.5;
		this.dodgeTime = this.rollTime * 0.6;
		this.grabLedgeHeight = 12;
		
		this.mapIcon = new MapIcon(this.position.x, this.position.y);
		this.mapIcon.bobSpeed = 4.0;
		
		this.checkAttackArea = function(ops){
			if(this.attstates.time > 0 && this.attstates.time < this.attstates.totalTime){
				let range = this.equip_sword.stats.range;
				let path = this.currentAttack.path;
				let area = new Point(6,6);
				let i = Math.floor( (path.length-1) * this.attackProgress );
				let d = ( this.attackProgress * (path.length-1) ) % 1.0;
				let p = Point.lerp(path[i], path[i+1], d).scale(this.forward() * range, 1);
				if(this.flip) {p.x -= area.x;}
				
				let box = new Line( this.position.add(p), this.position.add(p).add(area) )
				
				Combat.attackCheck.apply(this,[ box, ops ]);
			} else {
				//Use default attack tracking
				let boxes = this.swrap.getAttackBoxes(this.frame, this);
				for(let i=0; i < boxes.length; i++){
					Combat.attackCheck.apply(this,[ boxes[i], ops ]);
				}
			}
			
		}
		
		this.combatFinalDamage = function(d){
			if(this.perks.slowWound > 0){
				this.states.damageBuffer += d;
			} else {
				this.life -= d;
			}
		}
		
		/*
		this.superGetDamage = this.getDamage;
		this.getDamage = function(){
			var damage = this.superGetDamage();
			if(this.attstates.currentAttack) {
				damage.physical *= this.attstates.currentAttack["damage"];
			}
			return damage;
		}
		*/
		
		//Stats
		this.stat_points = 0;
		this.experience = 0;
		this.level = 1;
		this.nextLevel = 0;
		this.prevLevel = 0;
		
		
		this.equip(this.equip_sword, this.equip_shield);
		
		this.spellsCounters = {
			"magic_strength" : 0,
			"haste" : 0,
			"magic_sword" : 0,
			"magic_armour" : 0,
			"invincibility" : 0,
			"feather_foot" : 0,
			"thorns" : 0,
			"magic_song" : 0
		};
	}
	update(){
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
		
		//this.states.manaRegenTime = Math.min(this.states.manaRegenTime-this.delta, this.speeds.manaRegen);
		this.states.manaRegenTime -= this.delta * (1 + this.perks.manaRegen);
		if(this.states.manaRegenTime <= 0){
			this.mana = Math.min(this.mana + 1,this.manaMax );
			this.states.manaRegenTime = this.speeds.manaRegen - this.states.manaRegenTime;
		}
		if( this.manaHeal > 0 ){
			this.mana = Math.min(this.mana + 1, this.manaMax);
			this.manaHeal-= 1;
			if( this.mana >= this.manaMax ) this.manaHeal = 0;
		}
		if( this.heal > 0 ){
			audio.play("heal");
			this.life += 1;
			this.heal -= 1;
			this.states.damageBuffer = 0;
			game.slow(0.0,Game.DELTAFRAME30 * 4.0);
			if( this.life >= this.lifeMax ){
				this.heal = 0;
				this.life = this.lifeMax;
			}
		} else if(this.states.damageBuffer > 0){
			if(this.states.damageBufferTick <= 0){
				this.life--;
				this.states.damageBuffer--;
				this.isDead();
				this.states.damageBufferTick = Game.DELTASECOND * this.perks.slowWound;
			} else{
				this.states.damageBufferTick -= this.delta;
			}
		}
		
		if ( this.life > 0) {
			var strafe = input.state('block') > 0;
			
			if (this.stun > 0 ){
				//Do nothing, just wait to recover
				this.frame.x = 10; this.frame.y = 1;
			} else if(!this.canmove){
				//Player loses control
				if(this.grounded){
					if(Math.abs(this.force.x) < 0.1){
						this.frame = this.swrap.frame("idle", (game.time * 0.65) % 1);
					} else {
						this.states.animationProgress = (this.states.animationProgress + this.delta * Math.abs(this.force.x) * 0.32) % 1;
						this.frame = this.swrap.frame("run", this.states.animationProgress);
					}
				} else {
					this.frame.x = 7;
					this.frame.y = 2;
				}
			} else if (this.states.spellCounter > 0){
				this.states.spellCounter -= this.delta;
				this.frame = this.swrap.frame("spell", 0);
				
				if(this.states.spellCurrent instanceof SpellFire){
					this.states.spellCounter -= game.deltaUnscaled;
					game.slow(0.0,0.02);
				}
				if(this.states.spellCurrent instanceof SpellBolt){
					//Allow movement
					this.move(input.state('left') > 0 ? -1 : (input.state('right') > 0 ? 1 : 0) );
					if ( input.state('jump') == 1 ) { this.jump(); }
				}
				if(this.states.spellCurrent instanceof SpellFlash){
					//Float about
					this.force.y -= (this.gravity+0.05) * self.UNITS_PER_METER * this.delta;
					let spell = this.states.spellCurrent;
					if(spell.manaCost <= this.mana && this.states.spellCounter <= 0 && input.state('spell')){
						this.castSpell();
						this.states.spellCounter = this.states.spellCurrent.castTime;
					}
				}
				
				if(this.states.spellCounter <= 0){
					//Cast Spell
					this.castSpell();
				}
			} else if( this.states.ledgePosition ) {
				//Holding onto a ledge
				this.frame = this.swrap.frame("grab", 0);
				this.force.x = 0;
				this.force.y = this.gravity * -self.UNITS_PER_METER * this.delta;
				this.states.canGrabLedges = Game.DELTASECOND * 0.125;
				
				if(this.states.ledgePosition instanceof GameObject && this.states.ledgePosition.hasModule(mod_block)){
					this.position = this.position.add(this.states.ledgePosition.blockChange);
				}
				if(this.delta > 0){
					if(input.state("jump") == 1){
						this.jump();
						this.states.ledgePosition = false;
					} else if(input.state("down") > 0){
						this.states.ledgePosition = false;
					} else if(this.isStuck){
						this.states.ledgePosition = false;
					}
				}
			} else if( this.states.airdash > 0 ){
				//Air dashing
				if(this.grounded){
					//Landed
					this.states.airdash = 0;
					shakeCamera(Game.DELTASECOND*0.3,3);
				} else if(this.states.airdash > this.speeds.airdashTime * this.speeds.airdashStopTime){
					//Spin in the air
					this.states.airdash -= this.delta;
					this.force.x = this.force.y = 0;
					
					let p = 1 - (this.states.airdash / this.speeds.airdashTime - this.speeds.airdashStopTime) / (1-this.speeds.airdashStopTime);
					this.frame = this.swrap.frame("airdash", p);
					
					if(this.states.airdash <= this.speeds.airdashTime * this.speeds.airdashStopTime){
						//Transition
						this.states.dash_direction = this.forward();
						if(input.state("left") > 0){this.states.dash_direction = -1;}
						if(input.state("right") > 0){this.states.dash_direction = 1;}
						if(input.state("down") > 0){this.states.dash_direction = 0;}
					}
				} else {
					//Fly off
					this.states.airdash -= this.delta;
					if(this.states.dash_direction == 0){
						this.force.x = 0;
						this.force.y = this.speeds.baseSpeed * 2;
						this.frame = new Point(0,11);
					} else {
						this.flip = this.states.dash_direction < 0;
						this.force.x = this.states.dash_direction * this.speeds.baseSpeed * 2;
						this.frame = new Point(0,8);
					}
				}
				
			} else if( this.isAttacking ){
				//Player in attack animation
				
				let attack = this.currentAttack;
				let hAxis = 0;
				if(input.state("left") > 0) { hAxis -= 1;}
				if(input.state("right") > 0) { hAxis += 1;}
				
				//Allow player movement during attack
				this.move(hAxis * attack.movement);
				
				//Let the player queue more attacks
				if ( input.state('fire') == 1 ) { this.attstates.queue = true; }
				
				//Animation
				let attackName = "attack" + (attack.animation);
				this.frame = this.swrap.frame(attackName, this.attackProgress);
				
				if(input.state("dodge") == 1){
					this.cancelAttack();
					this.dodge();
				} else if(this.attstates.warmTime > 0){
					//Warm
					this.attstates.warmTime -= this.delta;
					
				} else if(this.attstates.time < this.attstates.totalTime){
					//Attacking
					this.attstates.time += this.delta * (1.0 + this.perks.attackSpeed);
					
				} else if(this.attstates.coolTime > 0){
					//Cool
					this.attstates.coolTime -= this.delta;
					
				} else {
					//End attack
					let nextAttackIndex = this.equip_sword.stats.nextCombo(this.getWeaponState(), this.attstates.currentAttack);
					
					if(this.attstates.queue && nextAttackIndex >= 0){
						this.attack(nextAttackIndex);
					} else if(input.state("jump") == 1 && this.grounded){
						this.cancelAttack();
						this.jump();
					} else if((this.flip && input.state("right") > 0) || (!this.flip && input.state("left") > 0) ){
						this.cancelAttack();
					} else if(this.attstates.wait > 0){
						this.attstates.wait -= this.delta;
					} else {
						this.cancelAttack();
					}
				}
				
				
			} else if( this.delta > 0) {
				//Player is in move/idle state
				
				this.states.guard = ( input.state('block') > 0 || this.autoblock );
				this.states.canGrabLedges = Math.clamp01(this.states.canGrabLedges - this.delta);
				
				if(input.state("select") == 1 && this.spells.length > 0){
					audio.play("equip");
					this.spellCursor = (this.spellCursor+1)%this.spells.length;
				}
				
				//Player Movement
				let hAxis = input.state("left") > 0 ? -1 : (input.state("right") ? 1 : 0);
				if( this.states.duck ) {
					this.states.turn = 0.0;
				} else {
					this.move(hAxis);
				}
				
				
				if(this.states.turn > 0){
					//Block disabled while turning
					this.states.guard = false;
				}
				
				if(this.grabLedge && this.states.canGrabLedges <= 0 && this.states.againstwall && input.state('down') < 1 && !this.grounded && this.force.y > 0){
					//Detect edge
					if(this.testLedgeTiles()){
						this.states.ledgePosition = this._prevPosition.scale(1/16).floor().scale(16);
						this.position.y = 12 + this.states.ledgePosition.y;
						/*
						this.position = new Point(
							this.states.ledgePosition.x + (this.flip?17+halfwidth:-halfwidth-1),
							this.states.ledgePosition.y + this.grabLedgeHeight
						);
						*/
						this.force.x = this.force.y = 0;
					}
				}
				
				//Cast Spell
				if ( input.state('spell') == 1 ) { 
					if(this.spells.length > 0){
						var spell = this.spells[this.spellCursor];
						if(spell.canCast(this) && this.mana > spell.manaCost){
							this.states.spellCurrent = spell;
							this.states.spellCounter = spell.castTime;
						} else {
							audio.play("negative");
						}
					}
				}
				
				//Attack and start combo
				if ( input.state('fire') == 1 ) { 
					this.attack(); 
				}
				
				//Apply jump boost
				if ( input.state('jump') > 0 && !this.grounded ) { 
					if( this.force.y > 0 ) {
						this.force.y -= this.speeds.airBoost * this.speeds.airGlide * this.delta;
					}
				
					if( this.states.jump_boost ) {
						this.force.y -= this.gravity * this.speeds.airBoost * this.delta; 
					}
				} else {
					this.states.jump_boost = false;
				}
				
				//Jump?
				if ( input.state('block') <= 0 && input.state('jump') == 1 ) { 
					if(this.grounded || (this.states.doubleJumpReady && this.doubleJump) || (this.states.againstwall && this.walljump)){
						this.jump(); 
					}
				}
				
				//Duck?
				if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
					this.duck(); 
				} else { 
					this.stand(); 
				}
				
				//Conditional actions
				if(this.states.dash <= 0){
					//Change to face player's selected direction
					if ( input.state('left') > 0 ) { 
						if(!this.flip) { this.states.turn = this.speeds.turn; }
						this.flip = true; 
					}
					if ( input.state('right') > 0 ) { 
						if(this.flip) { this.states.turn = this.speeds.turn; }
						this.flip = false;
					}
					
					if(this.walljump && !this.grounded && this.states.againstwall){
						//Wall slide
						if(input.state("down") <= 0){
							
							this.frame.x = 7; this.frame.y = 6;
							if(this.force.y > 0){
								this.force.y = Math.min(this.force.y, 4);
							}
						}
					} else if(this.states.duck){
						this.states.duckTime = this.speeds.duckTime;
						this.states.animationProgress = Math.min(this.states.animationProgress+this.delta*4, 1);
						this.frame = this.swrap.frame("duck", this.states.animationProgress);
					} else if(this.dodgeFlash && this.states.airdashReady && !this.grounded && input.state("dodge") == 1 && this.states.airdash <= 0){
						this.airtime = this.states.airdash = this.speeds.airdashTime;
						this.states.airdashReady = false;
					} else if(this.grounded && input.state("dodge") == 1 && this.states.dash <= 0){
						//DASH LIKE A FIEND!
						this.dodge();
					} else if(this.states.turn > 0){
						this.force.x = this.force.x * (1.0 - this.speeds.breaks * this.delta);
						let tProg = 1 - (this.states.turn / this.speeds.turn);
						this.frame = this.swrap.frame("turn", tProg);
					} else if(!this.grounded){
						if(this.states.doubleJumpReady){
							this.frame.x = 7;
							if(this.force.y < -0.5){ this.frame.x = 6; }
							if(this.force.y > 0.5){ this.frame.x = 8; }
							this.frame.y = 2;
						} else {
							this.states.animationProgress = (this.states.animationProgress + this.delta * 4) % 1;
							this.frame = this.swrap.frame("jump2", this.states.animationProgress);
						}
					} else if(Math.abs(this.force.x) < 1.0){
						//Idle
						this.states.animationProgress = (this.states.animationProgress + this.delta * 0.67) % 1;
						this.frame = this.swrap.frame("idle", this.states.animationProgress);
					} else {
						//Running
						this.states.animationProgress = (this.states.animationProgress + this.delta * Math.abs(this.force.x) * 0.32) % 1;
						this.frame = this.swrap.frame("run", this.states.animationProgress);
					}
					
				} else {
					//Player is dashing
					let dProg = 1 - this.states.dash / this.speeds.dashTime;
					let speedCoefficient = this.speeds.dashTime * this.speeds.baseSpeed / this.speeds.dashSpeed;
					
					//Magic equation that smoothes the dash
					let dSpeed = speedCoefficient * Math.PI *  Math.cos(dProg*0.5*Math.PI);
					
					if(this.states.back_dash){
						this.frame = this.swrap.frame("back_dash", dProg);
					} else {
						this.frame = this.swrap.frame("dash", dProg);
					}
					
					
					this.force.x = this.states.dash_direction * this.speeds.dashSpeed * dSpeed;
					
					
					this.states.guard = false;
				}
				
				/*
				//Prep roll
				this.states.rollPressCounter -= this.delta;
				if( input.state('left') == 1 || input.state('right') == 1 ){
					this.states.rollDirection = 1.0;
					this.states.rollPressCounter = Game.DELTASECOND * 0.25;
					if( input.state('left') ) this.states.rollDirection = -1.0;
				}
				*/
			}
			
			this.states.doubleJumpReady = this.states.doubleJumpReady || this.grounded;
			this.states.airdashReady = this.states.airdashReady || this.grounded;
			this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
			this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
			this.height = this.states.duck ? 24 : 30;
		}
		//Shield
		this.states.guard_down = this.states.duck;
		this.guard.active = this.states.guard;
		this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
		
		//Update animations
		//this.animationUpdate();
		
		//Timers
		this.states.stanimaLock = this.states.stanimaLock && this.stanima < this.stanimaMax;
		if(!this.states.rolling){
			this.stanima = Math.min(this.stanima + this.delta * this.stanimaRestore, this.stanimaMax);
		}
		
		this.mapIcon.position.x = this.position.x;
		this.mapIcon.position.y = this.position.y;
		
		this.states.justjumped -= this.delta;
		for(var i in this.spellsCounters ) {
			this.spellsCounters[i] -= this.delta;
		}
		this.states.effectTimer += this.delta;
		this.states.turn -= this.delta;
		this.states.duckTime -= this.delta;
		this.states.dash -= this.delta;
		
		if(Math.abs(this.states.againstwall) <= this.delta){
			this.states.againstwall = 0;
		} else {
			this.states.againstwall -= (this.states.againstwall>0?1:-1) * this.delta;
		}
		
		if( this.states.afterImage.status(this.delta) ){
			game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
		}
		
		this._prevPosition = this.position.scale(1);
	}
	move(hAxis, acceleration = 1.0){
		if(!this.grounded){
			//Moving in the air
			if(hAxis != 0){
				this.addHorizontalForce(hAxis * this.speeds.baseSpeed, 5.0 * acceleration);
			}
		} else {
			//Moveing on the ground
			if(hAxis != 0){
				this.addHorizontalForce(hAxis * this.speeds.baseSpeed, 10.0 * acceleration);
			} else {
				this.force.x *= 1.0 - this.speeds.breaks * this.delta;
			}
		}
	}
	idle(){}
	testLedgeTiles(){
		let ts = 16;
		let tpoint = 0;
		let currentTop = this.position.y - (tpoint + this.height * this.origin.y);
		let prevTop = this._prevPosition.y - (tpoint + this.height * this.origin.y);
		
		if(Math.floor(currentTop/ts) != Math.floor(prevTop/ts)){
			let testPosition = this._prevPosition.subtract(new Point(0, this.height * this.origin.y))
			//You must have passed through a vertical tile threshold
			
			//getTileRule
			//tilerules.ignore
			
			let tBelow = game.getTileRule(testPosition.add(new Point(0, ts*3)));
			let tHole = game.getTileRule(testPosition.add(new Point(this.forward() * ts, 0)));
			let tLedge = game.getTileRule(testPosition.add(new Point(this.forward() * ts, ts)));
			let tFeetRest = game.getTileRule(testPosition.add(new Point(this.forward() * ts, ts*2)));
			
			if(tBelow == tilerules.ignore && tHole == tilerules.ignore && tLedge != tilerules.ignore){
				console.log("Grab!");
				return true;
			}
		}
		return false;
		
	}
	stand(){
		if( this.states.duck ) {
			this.position.y -= 4;
			this.grounded = true;
			this.states.duck = false;
		}
	}
	duck(){
		this.states.dash = 0.0;
		this.force.x = 0.0;
		this.states.dash = 0.0;
		if( !this.states.duck ) {
			this.position.y += 3.0;
			this.states.duck = true;
			this.states.animationProgress = 0;
		}
	}
	jump(){ 
		var force = this.speeds.jump * this.gravity;
		this.states.dash = 0.0;
		
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
			
			if(this.walljump && this.states.againstwall){
				force *= 1.2;
				this.force.x = (this.states.againstwall>0?-1:1) * 3;
			}
		}
		
		this.stand(); 
		this.states.justjumped = Game.DELTASECOND * 0.2;
		this.force.y = -force; 
		this.grounded = false; 
		this.states.jump_boost = true; 
		
		audio.play("jump");
	}
	attack(attackIndex = -1){
		//Player has pressed the attack button or an attack has been queued
		this.cancelAttack();
		
		//let weapon = this.attstates.weapon;
		let weapon = this.equip_sword.stats;
		if(attackIndex < 0){
			attackIndex = weapon.firstAttack(this.getWeaponState());
		}
		
		let attack = weapon.getAttack(attackIndex);
		this.damageMultiplier = attack.damage;
		this.attstates.currentAttack = attackIndex;
		this.attstates.warmTime = attack.warm * weapon.warm;
		this.attstates.coolTime = attack.cool * weapon.warm;
		this.attstates.totalTime = attack.time * weapon.speed;
		this.attstates.hitWait = attack.wait;
		this.attstates.wait = 0.0;
		this.attstates.queue = false;
		this.attstates.time = 0.0;
		
		if(attack.prepause > 0){
			game.slow(0.0, attack.prepause);
			SparkEffect.create(this.position.add(new Point( this.forward()*-12, 0 )), 16);
		}
		
		
		if("force" in attack){
			let addForce = new Point(this.forward() * attack.force.x, attack.force.y);
			this.force = this.force.add(addForce);
			this.grounded = this.grounded && addForce.y >= 0;
		}
		this.states.dash = 0.0;
		audio.play(attack.audio, this.position);
	}
	cancelAttack(){
		this.attstates.currentAttack = -1;
		this.attstates.time = 0.0;
		this.attstates.queue = false;
		this.hitIgnoreList = new Array();
	}
	dodge(){
		this.states.back_dash = input.state("left") < 1 && input.state("right") < 1;
		this.states.dash_direction = this.forward() * (this.states.back_dash ? -1 : 1);
		this.states.dash = this.speeds.dashTime;
		this.force.x = this.states.dash_direction * this.speeds.dashSpeed;
		audio.play("dash");
	}
	getWeaponState(){
		var state = PlayerWeapon.STATE_STANDING;
		if(this.downstab && !this.grounded && input.state("down") > 0){
			state = PlayerWeapon.STATE_DOWNATTACK;
		} else if(this.states.dash > 0){
			state = PlayerWeapon.STATE_CHARGED;
		} else if(!this.grounded){ 
			state = PlayerWeapon.STATE_JUMPING;
		} else if(this.states.duck){
			state = PlayerWeapon.STATE_DUCKING;
		} else if(this.states.duckTime > 0 && Math.abs(this.force.x) > 0.06125) {
			state = PlayerWeapon.STATE_JUMPUP;
		}
		return state;
	}
	baseDamage(){
		return Math.round(8 + this.stats.attack * this.equip_sword.stats.damage);
	}
	currentDamage(){
		if(this.isAttacking) {
			return Math.round(this.baseDamage() * this.currentAttack.damage);
		} else {
			return this.baseDamage();
		}
	}
	castSpell(name){
		var spell = this.states.spellCurrent;
		if(spell instanceof Spell){
			if(spell.manaCost <= this.mana ){
				spell.use(this);
				this.mana = Math.max(this.mana - spell.manaCost, 0);
			}
		}
	}

	equipSpell(s){
		this.spellCursor = this.spells.length;
		this.spells.push(s);
		
		s.trigger("equip");
	}
	equipCharm(c){
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
	equip(sword, shield){
		try {
			
			sword = sword || this.equip_sword;
			shield = shield || this.equip_shield;
			
			//Shields
			if(this instanceof Player){
				if( sword != null){
					NPC.set(sword.name, 1);
				}
				if( shield != null) {
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
			}
			
			this.equip_sword = sword;
			this.equip_shield = shield;
			
			//Set stats to base
			this.stats.attack = this.baseStats.attack;
			this.stats.defence = this.baseStats.defence;
			this.stats.magic = this.baseStats.magic;
			this.defencePhysical = 0;
			this.defenceFire = 0;
			this.defenceSlime = 0;
			this.defenceIce = 0;
			this.defenceLight = 0;
			this.damage = 0;
			this.damageFire = 0;
			this.damageSlime = 0;
			this.damageIce = 0;
			this.damageLight = 0;
			for(var i in this.perks){
				this.perks[i] = 0.0;
			}
			
			this.equip_sword.stats.onEquip(this);
			
			if(this.equip_shield != null){
				for(var i=0; i < this.equip_shield.slots.length; i++){
					if(this.shieldSlots[i] instanceof Spell){
						var slotType = Math.floor(this.equip_shield.slots[i] / 3);
						var slotPower = Math.floor(this.equip_shield.slots[i] % 3);
						this.shieldSlots[i].modifyStats(this, slotType, slotPower);
					}
				}
			}
			
			this.defencePhysical += Math.floor(this.stats.defence);
			this.defenceFire += Math.floor(this.stats.defence * 0.2);
			this.defenceSlime += Math.floor(this.stats.defence * 0.7);
			this.defenceIce += Math.floor(this.stats.defence * 0.6);
			this.defenceLight += Math.floor(this.stats.defence * 0.0);
			
			this.damage = Math.floor(this.damage + this.stats.attack * this.equip_sword.stats.damage);
			
			if(this instanceof Player){
				this.speeds.manaRegen = Game.DELTASECOND * (10 - this.stats.magic * (9/19));
			}
			
		} catch(e) {
			this.equip( this.equip_sword, this.equip_shield );
		}
	}
	hasEquipment(name){
		for(var i=0; i < this.equipment.length; i++ ){
			if( this.equipment[i].name == name ) return true;
		}
		return false
	}
	addMoney(value){
		this.money += value;
		if( false ){ //money pick up heals
			this.life = Math.min( this.life + value*2, this.lifeMax );
		}
		this.trigger("money", value);
	}
	respawn(g,c){
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
	toJson(){
		var out = {};
		out.life = this.life;
		out.lifeMax = this.lifeMax;
		out.mana = this.mana;
		out.manaMax = this.manaMax;
		out.stanimaMax = this.stanimaMax;
		out.money = this.money;
		
		out.lightRadius = this.lightRadius;
		out.downstab = this.downstab;
		out.walljump = this.walljump;
		out.doubleJump = this.doubleJump;
		out.dodgeFlash = this.dodgeFlash;
		
		out.weapon = false;
		out.shield = false;
		
		out.stats = {};
		out.spells = new Array();
		out.slots = new Array();
		
		if(this.equip_sword instanceof Item){
			out.weapon = this.equip_sword.name;
		}
		if(this.equip_shield instanceof Item){
			out.shield = this.equip_shield.name;
		}
		
		for(var i=0; i < this.spells.length; i++){
			out.spells[i] = {"name" : this.spells[i].objectName, "level" : this.spells[i].level};
		}
		
		for(var i=0; i < this.shieldSlots.length; i++){
			out.slots[i] = this.spells.indexOf(this.shieldSlots[i]);
		}
		
		for(var i in this.baseStats){
			out.stats[i] = this.baseStats[i];
		}
		return out;
	}
	fromJson(data){
		this.life = data.life;
		this.lifeMax = data.lifeMax;
		this.mana = data.mana;
		this.manaMax = data.manaMax;
		this.stanimaMax = data.stanimaMax;
		this.money = data.money;
		this.baseStats = data.stats;
		
		this.lightRadius = data.lightRadius;
		this.downstab = data.downstab;
		this.walljump = data.walljump;
		this.doubleJump = data.doubleJump;
		this.dodgeFlash = data.dodgeFlash;
		
		if(data.weapon){
			this.equip_sword = new Item(0,0,0,{"name" : data.weapon});
		}
		if(data.shield){
			this.equip_shield = new Item(0,0,0,{"name" : data.shield});
		}
		for(var i=0; i < data.spells.length; i++){
			var spell = new self[data.spells[i].name];
			spell.level = data.spells[i].level;
			this.spells.push(spell);
		}
		for(var i=0; i < data.slots.length; i++){
			this.shieldSlots[i] = this.spells[data.slots[i]];
		}
		
		this.equip();
	}

	render(g,c){
		if(this.showplayer){
			//Render player
			
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
			/*
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
			*/
			let color = this.tint;
			if(this.invincible > 0) { color = [0.8,0.2,0.2,(game.time%0.125)>0.06125?1:0]; }
			g.renderSprite(this.sprite, this.position.subtract(c),this.zIndex,this.frame,this.flip, {
				"u_color" : color
			});
			
			//When rolling, ignore flip and shader
			if(this.dodgeFlash && this.states.rolling){
				var flashLength = Math.max(1 - this.states.roll/this.dodgeTime,0) * 96;
				g.color = [1,1,1,1];
				g.scaleFillRect(
					(this.position.x - (this.flip?0:flashLength)) - c.x,
					(this.position.y - 6) - c.y,
					flashLength,
					12
				);
			}
			
			if( this.spellsCounters.thorns > 0 ){
				g.renderSprite("magic_effects",this.position.subtract(c),this.zIndex, new Point(3, 0), this.flip);
			}
			//Render current sword
			if(!this.states.rolling){
					this.renderWeapon(g,c);
					this.renderShield(g,c);
			}
		}
	}
	renderWeapon(g,c,ops={},eops={}){
		try{
			let rangeScale = this.equip_sword.stats.range / 70;
			let meshScale = 0.1;
			
			let _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
			let rotation = _t.r;
			let sposition = _t.p;
			let zPlus = _t.z;
			let effect = _t.v;
			let shield = _t.s;
			
			if(this.flip){
				sposition = new Point(sposition.x*-1,sposition.y);
			}
			ops["rotate"] = (this.flip ? -1 : 1) * rotation;
			
			g.renderSprite("swordtest", this.position.subtract(c).add(sposition), this.zIndex+zPlus, this.equip_sword.equipframe, false, ops);
			
			if(this.isAttacking && this.attackProgress > 0){
				//eops["rotate"] = effect.r;
				//let effectFrame = new Point(effect.x, effect.y);
				//let spriteName = effect.s;
				
				//g.renderSprite(spriteName, this.position.subtract(c), this.zIndex+2, effectFrame, this.flip, eops);
				let attack = this.currentAttack;
				let attackMeshName = attack.mesh;
				
				g.renderMesh(attackMeshName, this.position.subtract(c), this.zIndex+2, {
					scale : [
						rangeScale * meshScale,
						meshScale,
						meshScale
					],
					flip : this.flip,
					u_time : this.attackProgress,
					u_color : this.equip_sword.stats.color1,
					u_color2 : this.equip_sword.stats.color2
				});
			}
		} catch (e){
			//console.warn("Render weapon: "+e);
		}
	}
	renderShield(g,c,ops){
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

	hudrender(g,c){
		/* Render HP */
		Player.renderLifebar(g,new Point(8,8),this.life, this.lifeMax, this.states.damageBuffer);
		
		/* Render Mana */
		Player.renderManabar(g,new Point(8,20),this.mana, this.manaMax);
		
		/* Render stanima */
		var stanimaLength = Math.floor( (this.stanimaMax / this.stanimaBase) * 24 );
		var stanimaRemain = Math.floor( (this.stanima / this.stanimaBase) * 24 );
		g.color = [1.0,1.0,1.0,1.0];
		g.scaleFillRect(7,25,stanimaLength+2,4);
		g.color = [0.0,0.0,0.0,1.0];
		g.scaleFillRect(8,26,stanimaLength,2);
		g.color = this.states.stanimaLock ? [0.7,0.2,0.2,1.0] : [1.0,1.0,1.0,1.0];
		g.scaleFillRect(8,26,stanimaRemain,2);
		
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
			//textArea(g,""+spell.stock,item_pos+spellXOff,24);
			item_pos += 20;
		}
		
		//Create light
		if(this.lightRadius){
			Background.pushLight( this.position, 240 );
		} else {
			Background.pushLight( this.position, 56, [0.25,0.15,0.1,1.0] );
		}
	}
	animtest(){
		if(input.state("up")==1)this.frame.y--;
		if(input.state("down")==1)this.frame.y++;
		if(input.state("left")==1)this.frame.x--;
		if(input.state("right")==1)this.frame.x++;
	}
}
Player.renderLifebar = function(g,c, life, max, buffer){
	/* Render HP */
	let scale = 1.0;
	life *= scale;
	max *= scale;
	buffer *= scale;
	
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(c.x-1,c.y-1,(max)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,max,8);
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,Math.max(life,0),8);
	
	/* Render Buffered Damage */
	if(life > 0){
		g.color = [0.65,0.0625,0.0,1.0];
		g.scaleFillRect(
			Math.max(life,0)+c.y,
			c.y,
			-Math.min(buffer,life),
			8
		);
	}
}
Player.renderManabar = function(g,c, mana, max){
	/* Render Mana */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(c.x-1,c.y-1,max+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,max,2);
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(c.x,c.y,mana,2);
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
			0 : {p:new Point(-14,0),r:-80,z:1,v:{x:0,y:0,r:0,s:"swordeffect"}},
			1 : {p:new Point(16,-6),r:70,z:1,v:{x:1,y:0,r:0,s:"swordeffect"}},
			2 : {p:new Point(12,-6),r:-45,z:-1,v:{x:2,y:0,r:0,s:"swordeffect"}},
			3 : {p:new Point(12,-6),r:-50,z:-1,v:0},
			4 : {p:new Point(12,-6),r:-45,z:-1,v:0},
			5 : {p:new Point(-24,2),r:-60,z:1,v:{x:0,y:1,r:0,s:"swordeffect"}},
			6 : {p:new Point(-21,-1),r:-60,z:1,v:{x:1,y:1,r:0,s:"swordeffect"}},
			7 : {p:new Point(-23,0),r:-10,z:1,v:{x:2,y:1,r:0,s:"swordeffect"}},
			8 : {p:new Point(21,-4),r:90,z:-1,v:{x:0,y:4,r:0,s:"swordeffect"}},
			9 : {p:new Point(20,-4),r:90,z:-1,v:{x:1,y:4,r:0,s:"swordeffect"}},
			10 : {p:new Point(20,-4),r:90,z:-1,v:0}
		},
		5 : {
			0 : {p:new Point(-16,1),r:-45,z:1,v:0},
			1 : {p:new Point(-16,2),r:-90,z:1,v:0},
			2 : {p:new Point(15,-2),r:90,z:1,v:{x:0,y:2,r:0,s:"swordeffect"}},
			3 : {p:new Point(12,-6),r:45,z:-1,v:{x:1,y:2,r:0,s:"swordeffect"}},
			4 : {p:new Point(6,-6),r:45,z:-1,v:{x:2,y:2,r:0,s:"swordeffect"}},
			5 : {p:new Point(14,-2),r:50,z:-1,v:{x:3,y:2,r:0,s:"swordeffect"}},
			6 : {p:new Point(16,4),r:80,z:1,v:0},
			7 : {p:new Point(-4,4),r:100,z:-1,v:0},
			8 : {p:new Point(12,-26),r:10,z:-1,v:0,v:{x:0,y:6,r:0,s:"swordeffect"}},
			9 : {p:new Point(12,-27),r:0,z:-1,v:0,v:{x:1,y:6,r:0,s:"swordeffect"}},
			10 : {p:new Point(12,-27),r:0,z:-1,v:0,v:{x:2,y:6,r:0,s:"swordeffect"}},
			11 : {p:new Point(12,-27),r:0,z:-1,v:0},
		},
		6 : {
			8 : {p:new Point(-16,1),r:-45,z:1,v:0}
		},
		8 : {
			0 : {p:new Point(-15,-2),r:-10,z:1,v:0},
			1 : {p:new Point(-14,-5),r:-45,z:1,v:0},
			2 : {p:new Point(-15,-2),r:-140,z:1,v:0},
			3 : {p:new Point(12,-6),r:45,z:-1,v:{x:0,y:3,r:0,s:"swordeffect"}},
			4 : {p:new Point(-4,5),r:220,z:-1,v:{x:1,y:3,r:0,s:"swordeffect"}},
			5 : {p:new Point(9,2),r:110,z:1,v:0},
			6 : {p:new Point(-20,-1),r:60,z:1,v:0},
		},
		9 : {
			0 : {p:new Point(-16,5),r:-80,z:1,v:0},
			1 : {p:new Point(-20,2),r:45,z:1,v:0},
			2 : {p:new Point(-20,2),r:90,z:1,v:0},
			3 : {p:new Point(21,1),r:90,z:-1,v:{x:0,y:5,r:0,s:"swordeffect"}},
			4 : {p:new Point(17,2),r:90,z:-1,v:{x:1,y:5,r:0,s:"swordeffect"}},
			5 : {p:new Point(-20,1),r:55,z:1,v:0}
		},
		10 : {
			0 : {p:new Point(-15,-3),r:-100,z:1,v:0},
			1 : {p:new Point(-15,-3),r:-100,z:1,v:0},
			2 : {p:new Point(-14,-3),r:-95,z:1,v:0},
			3 : {p:new Point(-13,-3),r:-95,z:1,v:0},
			4 : {p:new Point(-11,-3),r:-90,z:1,v:0},
			5 : {p:new Point(-11,-3),r:-95,z:1,v:0},
			6 : {p:new Point(-12,-3),r:-105,z:1,v:0},
			7 : {p:new Point(-13,-3),r:-100,z:1,v:0},
			
			8 : {p:new Point(-13,-2),r:-50,z:1,v:0},
			9 : {p:new Point(-12,-2),r:-45,z:1,v:0},
			10 : {p:new Point(-12,-6),r:-40,z:1,v:0},
		},
		11 : {
			0 : {p:new Point(-10,-23),r:24,z:1,v:{x:0,y:0,r:0,s:"swordeffectv"}},
			1 : {p:new Point(2,4),r:120,z:1,v:{x:1,y:0,r:0,s:"swordeffectv"}},
			2 : {p:new Point(4,1),r:80,z:1,v:{x:2,y:0,r:0,s:"swordeffectv"}},
			3 : {p:new Point(4,1),r:75,z:1,v:{x:3,y:0,r:0,s:"swordeffectv"}},
			4 : {p:new Point(4,1),r:75,z:1,v:0},
		}
	}