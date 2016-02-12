Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.zIndex = 1;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	this.spells = [];
	this.uniqueItems = [];
	this.charm = false;
	this.spell = false;
	this.knockedout = false;
	this.pause = false;
	
	this.equip_sword = new Item(0,0,0,{"name":"short_sword","enchantChance":0});
	this.equip_shield = new Item(0,0,0,{"name":"small_shield","enchantChance":0});
	this.unique_item = false;
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.jump_strength = 7.7;
	
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND,
		"guard_down" : false,
		"attack_charge" : 0,
		"charge_multiplier" : false,
		"rollPressCounter" : 0.0,
		"roll" : 0,
		"rollDirection" : 1.0,
		"effectTimer" : 0.0,
		"downStab" : false,
		"afterImage" : new Timer(0, Game.DELTASECOND * 0.125)
	};
	
	this.attackProperties = {
		"charge_start" : 0.2 * Game.DELTASECOND,
		"charge_end" : 0.5 * Game.DELTASECOND,
		"warm" : 8.5,
		"strike" : 8.5,
		"rest" : 5.0,
		"range" : 8.0,
		"sprite" : sprites.sword1
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	};
	
	
	this.speeds = {
		"inertiaGrounded" : 0.4,
		"inertiaAir" : 0.1,
		"frictionGrounded" : 0.1,
		"frictionAir" : 0.05,
		"airGlide" : 0.0,
		"breaks": 0.4
	};
	
	this.weapon = {
		"frame" : 0,
		"frame_row" : 0,
		"combo" : 0,
		"charge" : 0,
		"charge_ready" : false,
		"width" : 4
	};
	this.cape = {
		"active" : false,
		"frame" : 0,
		"frame_row" : 0,
		"sprite" : sprites.cape1,
		"cape" : null,
		"flip" : this.flip
	}
	
	this.on("pre_death", function(){
		this.heal = 0;
		game.slow(0,this.death_time);
		audio.stopAs("music");
	});
	this.on("death", function(){
		this.position.x = 128;
		this.position.y = 200;
		
		if( window._world instanceof WorldMap ){
			window._world.worldTick();
		}
		
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		game.getObject(PauseMenu).open = true;
		audio.play("playerdeath");
		this.destroy();
		
		ga("send","event", "death","died:"+dataManager.currentTemple+" at level:"+this.level);
	});
	this.on("land", function(){
		//Land from a height
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
	this.on("collideVertical", function(v){
		if(v>0) this.knockedout = false;
	});
	this.on("guardbreak", function(obj,position,damage){
		dir = this.position.subtract(obj.position);
		this.knockedout = true;
		this.grounded = false;
		this.force.y = -8;
		this.force.x = 12 * (dir.x > 0 ? 1.0 : -1.0);
		
		this.guard.life = this.guard.lifeMax;
		
		game.slow(0.1, Game.DELTASECOND);
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("hurt", function(obj, damage){
		var str = Math.min(Math.max(Math.round(damage*0.1),1),6);
		window.shakeCamera(Game.DELTASECOND*0.5,str);
		if(this.stun_time > 0 ){
			this.states.attack = 0;
			game.slow(0,5.0);
		}
		Background.flash = [0.6,0,0,1];
		audio.play("playerhurt");
	})
	this.on("struckTarget", function(obj, pos, damage){
		if( this.states.downStab && obj.hasModule(mod_combat) && this.force.y > 0 ) {
			this.states.downStab = false;
			this.force.y = -2;
			this.jump();
		}
	});
	this.on("hurt_other", function(obj, damage){
		var ls = Math.min(this.life_steal, 0.4);
		this.life = Math.min( this.life + Math.round(damage * ls), this.lifeMax );
		
		if( "life" in obj && obj.life <= 0 ) {
			//Glow after a kill
			this.states.afterImage.set(Game.DELTASECOND * 3);
		}
		
		if( !this.grounded && !this.states.downStab ) {
			//Add extra float
			this.force.y -= this.jump_strength * this.speeds.airGlide;
		}
		
		//Charge kill explosion!
		if( this.states.charge_multiplier && obj.mass < 2.0 && obj.life <= 0 ) {
			var dir = obj.position.subtract(this.position);
			game.slow(0.1, Game.DELTASECOND * 0.5);
			audio.playLock("explode3", 0.5);
			game.addObject( new ExplodingEnemy( 
				obj.position.x,
				obj.position.y,
				dir.add(new Point(0, -2)),
				{
					"damage" : this.damage * 4,
					"sprite" : obj.sprite,
					"flip" : obj.flip,
					"frame" : obj.frame,
					"frame_row" : obj.frame_row
				}
			));
			
		}
	});
	this.on("added", function(){
		this.damage_buffer = 0;
		this.lock_overwrite = false;
		this.checkpoint = new Point(this.position.x, this.position.y);
		this.force.x = this.force.y = 0;
		
		game.camera.x = this.position.x-128;
		game.camera.y = Math.floor(this.position.y/240)*240;
		
		for(var i in this.spellsCounters ){
			this.spellsCounters[i] = 0;
		}
		
		if( dataManager.temple_instance ) {
			this.keys = dataManager.temple_instance.keys;
		} else {
			this.keys = new Array();
		}
	})
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	
	this.life = 100;
	this.lifeMax = 100;
	this.mana = 24;
	this.manaMax = 24;
	this.money = 0;
	this.waystones = 0;
	this.heal = 0;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = Game.DELTASECOND;
	this.autoblock = true;
	this.rollTime = Game.DELTASECOND * 0.5;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if( this.spellsCounters.thorns > 0 && obj.hurt instanceof Function)
			obj.hurt(this,damage);
		if( this.spellsCounters.magic_armour > 0 )
			damage = Math.max( Math.floor( damage * 0.5 ), 1);
		this.superHurt(obj,damage);
	}
	
	//Stats
	this.stat_points = 0;
	this.experience = 0;
	this.level = 1;
	this.nextLevel = 0;
	this.prevLevel = 0;
	
	
	this.equip(this.equip_sword, this.equip_shield);
	
	this.spellsUnlocked = {};
	this.selectedSpell = "";
	this.spellEffectLength = Game.DELTASECOND * 60;
	this.spells = {
		"magic_strength" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.magic_strength <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_strength = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"invincibility" : function(){ 
			if( this.mana >= 2 && this.spellsCounters.invincibility <= 0 ){
				this.mana -= 2;
				this.invincible = Game.DELTASECOND * 20; 
				this.spellsCounters.invincibility = this.invincible; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"flight" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.flight <= 0 ){
				this.mana -= 1;
				this.spellsCounters.flight = Game.DELTAYEAR; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"haste" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.haste <= 0 ){
				this.mana -= 1;
				this.spellsCounters.haste = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_sword" : function(){
			if( this.mana >= 1 && this.spellsCounters.magic_sword <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_sword = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_armour" : function(){
			if( this.mana >= 1 && this.spellsCounters.magic_armour <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_armour = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"feather_foot" : function(){
			if( this.mana >= 1 && this.spellsCounters.feather_foot <= 0){
				this.mana -= 1;
				this.spellsCounters.feather_foot = Game.DELTAYEAR; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"thorns" : function(){
			if( this.mana > 1 && this.spellsCounters.thorns <= 0 ){
				this.mana -= 1;
				this.spellsCounters.thorns = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"recover" : function(){
			if( this.mana >= 1 && this.hasStatusEffect() ){
				this.mana -= 1;
				for( var i in this.statusEffects ) this.statusEffects[i]=-1;
				audio.play("spell");
			} else audio.play("negative");
		},
		"transmute" : function(){
			if( this.mana >= 2 ){
				this.mana -= 2;
				var objs = game.overlaps(
					new Line(game.camera.x,game.camera.y,game.camera.x+256,game.camera.y+240)
				);
				for(var i=0; i<objs.length; i++) if( objs[i] instanceof Item){
					if( objs[i].name.match(/coin_\d*/) ) objs[i].setName("waystone");
				}
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_song" : function(){
			if( this.mana >= 3 && this.spellsCounters.magic_song <= 0 ){
				this.mana -= 3;
				var roll = Math.random();
				if(roll < 0.04){
					for(var i=0; i < game.objects.length; i++ ) 
						if( game.objects[i].hasModule(mod_combat) && !(game.objects[i] instanceof Player) )
							game.objects[i].statusEffectsTimers.slow = game.objects[i].statusEffects.slow = Game.DELTASECOND * 30;
				} else if(roll < 0.1) {
					for(var i=0; i < game.objects.length; i++ ) 
						if( game.objects[i].hasModule(mod_combat) && !(game.objects[i] instanceof Player) && game.objects[i]._magic_drop == undefined){
							game.objects[i].on("death",function(){ game.addObject(new Item(this.position.x, this.position.y, "waystone")); });
							game.objects[i]._magic_drop = true;
						}
				} else if(roll < 0.2){
					this.spellsCounters.magic_armour = Game.DELTAYEAR; 
					this.spellsCounters.thorns = Game.DELTAYEAR;
				} else if(roll < 0.5) {
					this.heal = 999;
				} else {
					var map = game.getObject(PauseMenu);
					if( map instanceof PauseMenu) map.revealMap(1);
				}
				this.spellsCounters.magic_song = this.spellEffectLength * 2; 
				audio.play("spell");
			} else audio.play("negative");
		},
	};
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
	this.money_bonus = 1.0;
	this.waystone_bonus = 0.1;
	this.life_steal = 0.0;
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	if( this.spellsCounters.haste > 0 ) speed = 1.6;
	
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
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana += 1, this.manaMax);
		this.manaHeal-= 1;
		if( this.mana >= this.manaMax ) this.manaHeal = 0;
	}
	if( this.hasCharm("charm_methuselah") ){
		for(var i in _player.statusEffects)
			_player.statusEffects[i] = 0;
	}
	if( this.statusEffects.cursed > 0 ){
		this.heal = 0;
	}
	if( this.heal > 0 ){
		audio.play("heal");
		this.life += 2;
		this.heal -= 2;
		this.damage_buffer = 0;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	} else {
		if( this.life < this.lifeMax * .2 && this.delta > 0 ) audio.playLock("danger",1.00);
	}
	if ( this.life > 0 ) {
		var strafe = input.state('block') > 0;
		if( this.states.roll > 0 ) {
			this.force.x = this.states.rollDirection * 5;
			this.states.roll -= this.delta;
			
			//Create dust trail for roll
			if( this.states.effectTimer > Game.DELTASECOND / 16 ){
				this.states.effectTimer = 0;
				game.addObject( new EffectSmoke(
					this.position.x, this.position.y + 16, null, 
					{"frame":1, "speed":0.4,"time":Game.DELTASECOND*0.4}
				));
			}
		}else if( !this.knockedout && this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
			//Player is in move/idle state
			
			this.states.guard = ( input.state('block') > 0 || this.autoblock );
			
			if( input.state('spell') == 1 ){
				if( this.spell instanceof Item && this.spell.cast instanceof Function) {
					//Cast spell
					var cost = this.spell.cast(this);
					this.mana = Math.max(this.mana - cost, 0);
				}
			}
			
			if( !this.states.duck ) {
				if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; }
				if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; }
				
				//Come to a complete stop
				if ( input.state('right') <= 0 && input.state('left') <= 0 && this.grounded ) { 
					this.force.x -= this.force.x * Math.min(this.speeds.breaks*this.delta);
				}
			}
						
			if ( input.state("down") > 0 && !this.grounded) { 
				//Down spike
				this.states.downStab = true;
				this.states.guard = false;
				
			} else if ( input.state('fire') == 1 ) { 
				this.attack(); 
			} else if ( input.state('fire') > 0 ) { 
				this.states.attack_charge += this.delta; 
				if( this.states.attack_charge >= this.attackProperties.charge_start){
					strafe = true;
				}
			} else { 
				this.states.charge_multiplier = false;
				
				//Release charge if it has built up
				if( this.states.attack_charge > this.attackProperties.charge_end ){
					this.states.charge_multiplier = true;
					this.attack();
					strafe = true;
					if( !this.states.duck ) {
						this.force.x = 5.0 * (this.flip ? -1.0 : 1.0);
					}
				}
				this.states.attack_charge = 0; 
			}
			
			if ( input.state('block') <= 0 && input.state('jump') == 1 && this.grounded ) { 
				this.jump(); 
			}
			if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
				this.duck(); 
			} else { 
				this.stand(); 
			}
			
			if ( 
				(
					(this.states.rollDirection > 0 && input.state("right") == 1) || 
					(this.states.rollDirection < 0 && input.state("left") == 1)
				) && 
				this.states.rollPressCounter > 0 &&
				this.grounded
			) {
				//Dodge roll
				this.states.roll = this.invincible = this.rollTime;
			} else if (strafe) {
				//Limit speed and face current direction
				this.force.x = Math.min( Math.max( this.force.x, -2), 2);
				
			} else {
				//Change to face player's selected direction
				if ( input.state('left') > 0 ) { this.flip = true;}
				if ( input.state('right') > 0 ) { this.flip = false; }
			}
			
			//Prep roll
			this.states.rollPressCounter -= this.delta;
			if( input.state('left') == 1 || input.state('right') == 1 ){
				this.states.rollDirection = 1.0;
				this.states.rollPressCounter = Game.DELTASECOND * 0.25;
				if( input.state('left') ) this.states.rollDirection = -1.0;
			}
			
		}
		
		//Apply jump boost
		if( this.spellsCounters.flight > 0 ) {
			this.gravity = 0.2;
			if ( input.state('down') > 0 ) { this.force.y += speed * this.delta * 0.3 }
			if ( input.state('jump') > 0 ) { this.force.y -= speed * this.delta * 0.4 }
		} else { 
			this.gravity = 1.0; 
			if ( input.state('jump') > 0 && !this.grounded ) { 
				
				if( this.force.y > 0 ) {
					this.force.y -= 0.4 * this.speeds.airGlide * this.delta;
				}
			
				if( this.jump_boost ) {
					var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
					this.force.y -= this.gravity * boost * this.delta; 
				}
			} else {
				this.jump_boost = false;
			}
		}
		
		this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
		this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
		this.height = this.states.duck ? 24 : 30;
		
		
		if ( this.states.downStab ) {
			this.strike(new Line( 0, 8, 4, 8+Math.max( 12, this.attackProperties.range)));
		}
		
		if ( this.states.attack > this.attackProperties.rest && this.states.attack <= this.attackProperties.strike ){
			//Play sound effect for attack
			if( !this.states.startSwing ) {
				audio.play("swing");
				if( !this.grounded ) {
					this.force.y *= Math.max(1.0 - this.speeds.airGlide, 0);
				}
				if( this.spellsCounters.magic_sword > 0 || this.hasCharm("charm_sword") ){
					var offset_y = this.states.duck ? 6 : -8;
					var bullet = new Bullet(this.position.x, this.position.y + offset_y, this.flip ? -1 : 1);
					bullet.team = this.team;
					bullet.speed = this.speed * 2;
					bullet.knockbackScale = 0.0;
					bullet.frame = 1;
					bullet.damage = Math.max( Math.floor( this.damage * 0.25 ), 1 );
					game.addObject(bullet);
				}
			}
			this.states.startSwing = true;
			
			//Create box to detect enemies
			var temp_damage = this.damage;
			var type = this.equip_sword.phantom ? "hurt" : "struck";
			var weapon_top = (this.states.duck ? 4 : -6) - this.weapon.width*.5;
			if( this.spellsCounters.magic_strength > 0 ) {
				temp_damage = Math.floor(temp_damage*1.25);
			}
			if( this.states.charge_multiplier ) {
				temp_damage *= 2.0;
			}
			this.strike(new Line(
				new Point( 12, weapon_top ),
				new Point( 12+this.attackProperties.range , weapon_top+this.weapon.width )
			), type, temp_damage );
		} else {
			this.states.startSwing = false;
		}
	}
	
	//Shield
	this.states.guard_down = this.states.duck;
	this.guard.active = this.states.guard;
	this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.knockedout ){
		this.frame_row = 4;
		this.frame = (this.frame + this.delta * 0.2 ) % 3;
	} else if ( this.stun > 0 || this.life < 0 ) {
		this.stand();
		this.frame = 3;
		this.frame_row = 0;
	} else if( this.states.roll > 0 ) {
		this.frame_row = 3;
		this.frame = 5 * (1 - this.states.roll / this.rollTime);
	} else if( this.states.downStab ){
		this.frame = 4;
		this.frame_row = 0; 
	} else {
		if( !this.grounded ) {
			this.frame_row = 2;
			this.frame = this.force.y < 1.0 ? 3 : 4;
		} else if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperties.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperties.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack_charge > this.attackProperties.charge_start || this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 && this.grounded ) {
				//Run animation
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack_charge > this.attackProperties.charge_start ) this.frame = 0;
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperties.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperties.strike ) this.frame = 0;		
	}
	
	//Animation Sword
	if(this.states.attack > 0){
		this.weapon.frame = this.frame;
		this.weapon.frame_row = 1 + this.weapon.combo;
	} else if (this.states.downStab) {
		this.weapon.frame = 3;
		this.weapon.frame_row = 0;
	} else if( this.states.attack_charge > 0 ){ 
		this.weapon.frame = 0;
		this.weapon.frame_row = 2;
	} else { 
		this.weapon.frame = this.frame % 3;
		this.weapon.frame_row = 0;
	}
	
	//Animation Cape
	if( this.cape.active ) {
		if( this.flip != this.cape.flip ){
			this.cape.flip = this.flip;
			this.cape.frame_row = 4;
			this.cape.frame = 0;
		}
		if( this.grounded || Math.abs(this.force.y) < 0.4) {
			if(this.states.duck) {
				//Ducking
				if( this.cape.frame_row != 1 ) this.cape.frame = 0;
				this.cape.frame = Math.min( this.cape.frame + this.delta * 0.2, 2);
				this.cape.frame_row = 1;
			} else if(this.cape.frame_row == 4) {
				//Turning
				this.cape.frame += this.delta * 0.2;
				if( this.cape.frame >= 2 ) {
					this.cape.frame = 0;
					this.cape.frame_row = 0;
				}
			} else if( input.state("left") > -0 || input.state("right") > 0 ) {
				//Running
				this.cape.frame = (this.cape.frame + this.delta * Math.abs(this.force.x) * 0.05 ) % 3;
				this.cape.frame_row = 0;
			} else {
				//Stopped or stopping
				this.cape.frame_row = 0;
				if( Math.abs( this.force.x ) > 0.3 ) {
					this.cape.frame = Math.abs( this.force.x ) > 1.0 ? 3 : 4;
				} else {
					this.cape.frame = 0;
				}
			}
		} else {
			//In air
			this.cape.frame = Math.abs(this.force.y) > 2.5 ? 1 : 0;
			this.cape.frame_row = this.force.y > 0 ? 3 : 2;
		}
	}
	
	//Timers
	var attack_decrement_modifier = this.spellsCounters.haste > 0 ? 1.3 : 1.0;
	this.states.attack -= this.delta * attack_decrement_modifier;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
	this.states.effectTimer += this.delta;
	
	if( this.states.afterImage.status(this.delta) ){
		game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
	}
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
	}
}
Player.prototype.jump = function(){ 
	if(this.states.duck){
		//Fall through floor
		var standingTile = game.getTile(
			this.position.x,
			this.position.y + 2 + _player.height * .5
		);
		if(standingTile > 64 && standingTile <= 67){
			this.grounded = false; 
			this.position.y += 2;
			return;
		}
	}
	
	var force = this.jump_strength;
	
	if( this.spellsCounters.flight > 0 ) force = 2;
	
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		if( this.grounded ) {
			this.force.x = 0;
			if( this.states.attack > Game.DELTASECOND * -0.3 ) {
				//Next combo level
				this.weapon.combo = (this.weapon.combo + 1) % 3;
			} else {
				//Reset combo
				this.weapon.combo = 0;
			}
		} else {
			this.weapon.combo = 2;
		}
		this.weapon.width = this.weapon.combo == 2 ? 18 : 4;
		this.states.attack = this.attackProperties.warm;
	}
}
Player.prototype.castSpell = function(name){
	if( name in this.spells && name in this.spellsUnlocked ) {
		this.spells[name].apply(this);
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
	if( this.spell instanceof Item ){
		//Drop Item
		this.spell.sleep = Game.DELTASECOND;
		this.spell.position.x = this.position.x;
		this.spell.position.y = this.position.y;
		if(!this.spell.hasModule(mod_rigidbody)) this.spell.addModule(mod_rigidbody);
		game.addObject(this.spell);
		this.spell.trigger("unequip");
	}
	this.spell = s;
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
		if( sword.isWeapon && "stats" in sword ){
			this.attackProperties.warm =  sword.stats.warm;
			this.attackProperties.strike = sword.stats.strike;
			this.attackProperties.rest = sword.stats.rest;
			this.attackProperties.range = sword.stats.range;
			this.attackProperties.sprite = sword.stats.sprite;
			if( sword.twoHanded ) shield = null;
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( "stats" in shield){
				this.attackProperties.warm *= shield.stats.speed;
				this.attackProperties.strike *= shield.stats.speed;
				this.attackProperties.rest *= shield.stats.speed;
				this.shieldProperties.duck = -5.0 + (15 - (shield.stats.height/2));
				this.shieldProperties.stand = -5.0;
				this.guard.lifeMax = shield.stats.guardlife;
				this.guard.life = this.guard.lifeMax;
				this.guard.h = shield.stats.height;
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
			game.addObject( this.equip_sword );
		}
		
		//Drop old shield
		if( this.equip_shield != undefined && this.equip_shield != shield ){
			this.equip_shield.trigger("unequip",this);
			this.equip_shield.sleep = Game.DELTASECOND * 2;
			this.equip_shield.position.x = this.position.x;
			this.equip_shield.position.y = this.position.y;
			game.addObject( this.equip_shield );
		}
		
		if( this.equip_sword != sword && sword instanceof Item ) sword.trigger("equip", this);
		if( this.equip_shield != shield && shield instanceof Item ) shield.trigger("equip", this);
		
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		//Calculate damage and defence
		var att_bonus = 0;
		var def_bonus = 0;
		var tec_bonus = 0;
		if( this.equip_sword instanceof Item ){
			att_bonus += (this.equip_sword.bonus_att || 0);
			def_bonus += (this.equip_sword.bonus_def || 0);
			tec_bonus += (this.equip_sword.bonus_tec || 0);
		}
		if( this.equip_shield instanceof Item ){
			att_bonus += (this.equip_shield.bonus_att || 0);
			def_bonus += (this.equip_shield.bonus_def || 0);
			tec_bonus += (this.equip_shield.bonus_tec || 0);
		}
		
		var att = Math.max( Math.min( att_bonus + this.stats.attack - 1, 19), 0 );
		var def = Math.max( Math.min( def_bonus + this.stats.defence - 1, 19), 0 );
		var tech = Math.max( Math.min( tec_bonus + this.stats.technique - 1, 19), 0 );
		
		this.guard.lifeMax += 3 * def + tech;
		this.guard.restore = 0.4 + tech * 0.05;
		
		this.damage = 5 + att * 3 + Math.floor(tech*0.5);
		this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
		this.attackProperties.rest = Math.max( this.attackProperties.rest - tech*1.4, 0);
		this.attackProperties.strike = Math.max( this.attackProperties.strike - tech*1.4, 3.5);
		this.attackProperties.warm = Math.max( this.attackProperties.warm - tech*1.8, this.attackProperties.strike);		
		
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
		
		ga("send","event", "levelup","level:" + this.level);
		
		if(Math.random() < 0.1){
			var treasure = Item.randomTreasure(Math.random(),[],{"locked":true});
			dataManager.itemUnlock(treasure.name);
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
Player.prototype.render = function(g,c){	
	//Render shield behind the player
	if( !this.guard.active ){
		this.rendershield(g,c);
	}
	
	//Render player
	if( this.states.roll <= 0 ){
		//Spell effects
		if( this.spellsCounters.flight > 0 ){
			var wings_offset = new Point((this.flip?8:-8),0);
			var wings_frame = 3-(this.spellsCounters.flight*0.2)%3;
			if( this.grounded ) wings_frame = 0;
			sprites.magic_effects.render(g,this.position.subtract(c).add(wings_offset),wings_frame, 0, this.flip);
		}
		if( this.spellsCounters.magic_armour > 0 ){
			this.sprite.render(g,this.position.subtract(c),this.frame, this.frame_row, this.flip, "enchanted");
		}
		
		GameObject.prototype.render.apply(this,[g,c]);
		//Render caps
		if( this.cape.active ) {
			this.cape.sprite.render(g, this.position.subtract(c), this.cape.frame, this.cape.frame_row, this.flip, this.filter);
		}
		
		//Render current sword
		var weapon_filter = this.spellsCounters.magic_strength > 0 ? "enchanted" : _player.equip_sword.filter;
		var weaponDuckPosition = new Point(0, (this.states.duck?4:0));
		this.attackProperties.sprite.render(g, this.position.add(weaponDuckPosition).subtract(c), 
			this.weapon.frame, 
			this.weapon.frame_row, 
			this.flip, 
			weapon_filter
		);
	} else {
		//When rolling, ignore flip and shader
		this.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.force.x < 0);
	}
	
	if( this.spellsCounters.thorns > 0 ){
		sprites.magic_effects.render(g,this.position.subtract(c),3, 0, this.flip);
	}
	
	//Render shield after player if active
	if( this.guard.active ){
		this.rendershield(g,c);
	}
	
	//Charge effect
	if( this.states.attack_charge > 0 ) {
		var effectPos = new Point(this.position.x, this.position.y - 16);
		EffectList.charge(g, effectPos.subtract(c), this.states.attack_charge);
	}
}



Player.prototype.rendershield = function(g,c){
	//Render shield
	
	if( this.states.roll > 0 ) return;
	
	var frame = this.guard.active ? 0 : 1;
	
	//var shield_frame = (this.states.guard_down ? 1:0) + (this.states.guard ? 0:2);
	sprites.shields.render(g, 
		this.position.subtract(c).add(new Point(0, this.guard.y)), 
		this.shieldProperties.frame + frame, 
		this.shieldProperties.frame_row, 
		this.flip,
		"heat",
		{"heat" : 1 - (this.guard.life / ( this.guard.lifeMax * 1.0))}
	);
}
Player.prototype.hudrender = function(g,c){
	/* Render HP */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,Math.max(this.life/4,0),8);
	g.closePath();
	
	/* Render Buffered Damage */
	g.beginPath();
	g.color = [0.65,0.0625,0.0,1.0];
	var buffer_start = Math.max( 8 + (this.lifeMax-this.damage_buffer) / 4, 8)
	g.scaleFillRect(
		Math.max(this.life/4,0)+8,
		8,
		-Math.min(this.damage_buffer,this.life)/4,
		8
	);
	g.closePath();
	
	/* Render Mana */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,19,25+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,20,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(8,20,Math.floor(25*(this.mana/this.manaMax)),2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,25,25+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,"$"+this.money,8, 216 );
	textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 32 );
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, 
			new Point((game.resolution.x-33)+i*4, 40),
			this.keys[i].frame,
			this.keys[i].frame_row,
			false 
		);
	}
	
	var item_pos = 20 + this.lifeMax * 0.25;
	//item hud
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-item_pos,-15));
		item_pos += 20;
	}
	if(this.spell instanceof Item){
		this.spell.position.x = this.spell.position.y = 0;
		this.spell.render(g,new Point(-item_pos,-15));
		item_pos += 20;
	}
	
	//Create light
	Background.pushLight( this.position.subtract(c), 240 );
}