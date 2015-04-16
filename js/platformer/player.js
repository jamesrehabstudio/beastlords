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
	//this.equipment = [new Item(0,0,"short_sword"), new Item(0,0,"small_shield")];
	this.spells = [];
	this.charm = false;
	
	this.equip_sword = new Item(0,0,"short_sword",{"enchantChance":0});
	this.equip_shield = new Item(0,0,"small_shield",{"enchantChance":0});
	
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND,
		"guard_down" : false
	};
	
	this.attackProperites = {
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
	}
	
	this.on("pre_death", function(){
		game.slow(0,this.death_time);
		audio.stopAs("music");
	});
	this.on("death", function(){
		this.position.x = 128;
		this.position.y = 200;
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		game.getObject(PauseMenu).open = true;
		audio.play("playerdeath");
		this.destroy();
		
		_gaq.push(["_trackEvent","death","temple",dataManager.currentTemple]);
		_gaq.push(["_trackEvent","death","level",this.level]);
	});
	this.on("land", function(){
		audio.play("land");
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
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
		if( this.inviciple > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("hurt", function(obj, damage){
		var dir = this.position.subtract(obj.position).normalize(damage);
		window.shakeCamera(dir);
		if(this.stun_time > 0 ){
			this.states.attack = 0;
			game.slow(0,5.0);
		}
		
		audio.play("playerhurt");
	})
	this.on("hurt_other", function(obj, damage){
		this.life = Math.min( this.life + Math.round(damage * this.life_steal), this.lifeMax );
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
	
	this.life = 0;
	this.lifeMax = 100;
	this.mana = 3;
	this.manaMax = 3;
	this.money = 0;
	this.waystones = 0;
	this.heal = 100;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = 20;
	this.autoblock = true;
	
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
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	
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
	this.waystone_bonus = 0.06;
	this.life_steal = 0.0;
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	if( this.spellsCounters.haste > 0 ) speed = 1.4;
	this.states.guard = false;
	
	this.buffer_damage = this.hasCharm("charm_elephant");
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana += 2, this.manaMax);
		this.manaHeal-= 2;
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
		if( this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
			if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand();}
			if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); }
			if ( input.state('fire') == 1 ) { this.attack(); }
			
			if ( input.state('jump') == 1 && this.grounded ) { this.jump(); }
			
			if ( !this.autoblock &&  input.state('block') > 0) {
				if( input.state("block") == 1 ) this.states.guard_down = this.states.duck;
				if( input.state('down') == 1 ) this.states.guard_down = true;
				if( input.state('up') == 1 ) this.states.guard_down = false;
				
				this.force.x = Math.min( Math.max( this.force.x, -2), 2);
				this.states.guard = this.states.attack <= 0;
			} else {
				if ( input.state('left') > 0 ) { this.flip = true;}
				if ( input.state('right') > 0 ) { this.flip = false; }
				if ( input.state('down') > 0 && this.grounded ) { this.duck(); } else { this.stand(); }
				if ( input.state('up') == 1 ) { this.stand(); }
				
				if( this.autoblock ) this.states.guard = this.states.attack <= 0;
			}
		}
		
		//Apply jump boost
		if( this.spellsCounters.flight > 0 ) {
			this.gravity = 0.2;
			if ( input.state('down') > 0 ) { this.force.y += speed * this.delta * 0.3 }
			if ( input.state('jump') > 0 ) { this.force.y -= speed * this.delta * 0.4 }
		} else { 
			this.gravity = 1.0; 
			if ( input.state('jump') > 0 && !this.grounded && this.jump_boost ) { 
				var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
				this.force.y -= this.gravity * boost * this.delta; 
			} else {
				this.jump_boost = false;
			}
		}
		
		this.friction = this.grounded ? 0.2 : 0.05;
		this.inertia = this.grounded ? 0.9 : 0.2;
		this.height = this.states.duck ? 24 : 30;
		
		if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
			//Play sound effect for attack
			if( !this.states.startSwing ) {
				audio.play("swing");
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
			if( this.spellsCounters.magic_strength > 0 ) temp_damage = Math.floor(temp_damage*1.25);
			this.strike(new Line(
				new Point( 12, (this.states.duck ? 4 : -4) ),
				new Point( 12+this.attackProperites.range , (this.states.duck ? 4 : -4)-4 )
			), type, temp_damage );
		} else {
			this.states.startSwing = false;
		}
	}
	
	//Shield
	this.guard.active = this.states.guard;
	if( this.autoblock ) {
		this.states.guard_down = this.states.duck;
		this.guard.y = this.states.duck ? this.shieldProperties.duck : this.shieldProperties.stand;
	} else { 
		this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
	}
	
	//Animation
	if ( this.stun > 0 || this.life < 0 ) {
		this.stand();
		this.frame = 4;
		this.frame_row = 0;
	} else {
		if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
	}
	
	//Timers
	var attack_decrement_modifier = this.spellsCounters.haste > 0 ? 1.3 : 1.0;
	this.states.attack -= this.delta * attack_decrement_modifier;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
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
		this.position.y += 3.9999999;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = 7;
	
	if( this.spellsCounters.flight > 0 ) force = 2;
	
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attackProperites.warm;
		if( this.grounded ) {
			this.force.x = 0;
		}
	}
}
Player.prototype.castSpell = function(name){
	if( name in this.spells && name in this.spellsUnlocked ) {
		this.spells[name].apply(this);
	}
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
			this.attackProperites.warm =  sword.stats.warm;
			this.attackProperites.strike = sword.stats.strike;
			this.attackProperites.rest = sword.stats.rest;
			this.attackProperites.range = sword.stats.range;
			this.attackProperites.sprite = sword.stats.sprite;
			if( sword.twoHanded ) shield = null;
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( shield.name == "small_shield" ){
				this.shieldProperties.duck = 6.0;
				this.shieldProperties.stand = -5.0;
				this.shieldProperties.frame_row = 3;
				this.guard.h = 16;
			} else if ( shield.name == "tower_shield" ){
				this.attackProperites.warm += 15.0;
				this.attackProperites.strike +=  12.0;
				this.attackProperites.rest +=  12.0;
				this.shieldProperties.duck = -5.0;
				this.shieldProperties.stand = -5.0;
				this.guard.h = 32;
				this.shieldProperties.frame_row = 4;
			} else {
				this.shieldProperties.duck = -Number.MAX_VALUE;
				this.shieldProperties.stand = -Number.MAX_VALUE;
				this.shieldProperties.frame_row = 5;
				this.guard.h = 16;
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
		
		this.damage = 5 + att * 3 + Math.floor(tech*0.5);
		this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
		this.attackProperites.rest = Math.max( this.attackProperites.rest - tech*1.6, 0);
		this.attackProperites.strike = Math.max( this.attackProperites.strike - tech*1.6, 3.5);
		this.attackProperites.warm = Math.max( this.attackProperites.warm - tech*2.0, this.attackProperites.strike);		
		
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
		
		_gaq.push(["_trackEvent","levelup",this.level]);
		
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
	var shield_frame = (this.states.guard_down ? 1:0) + (this.states.guard ? 0:2);
	this.sprite.render(g, this.position.subtract(c), shield_frame, this.shieldProperties.frame_row, this.flip);
	
	
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
	
	if( this.spellsCounters.thorns > 0 ){
		sprites.magic_effects.render(g,this.position.subtract(c),3, 0, this.flip);
	}
	
	//Render current sword
	var weapon_filter = this.spellsCounters.magic_strength > 0 ? "enchanted" : "default";
	this.attackProperites.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.flip, weapon_filter);
	
	
	/* Render HP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.fillStyle = "#000";
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.scaleFillRect(8,8,Math.max(this.life/4,0),8);
	g.closePath();
	
	/* Render Buffered Damage */
	g.beginPath();
	g.fillStyle = "#A81000";
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
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,19,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,20,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.scaleFillRect(8,20,Math.floor(25*(this.mana/this.manaMax)),2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,25,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,"$"+this.money,8, 216 );
	textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 32 );
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(223+i*4, 40), this.keys[i].frame, this.keys[i].frame_row, false );
	}
	
	//Charm
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-(this.lifeMax*0.25 + 20),-15));
	}
}