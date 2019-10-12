Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 15;
	this.name = "";
	this.sprite = "items";
	this.sleep = null;
	
	this.glowing = false;
	this.glow = 0.0;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 7.5;
	this.enchantChance = 0.8;
	this.itemid = null;
	this.time = 0.0;
	this.timeLimit = 0.0;
	
	this.addModule(mod_rigidbody);
	this.pushable = false;
	this.physicsLayer = physicsLayer.item;
	this.collisionReduction = -0.8;
	this.resistObjects = 0.3;
	this.gravity = 0;
	
	this.showItemDescription = true;
	
	ops = ops || {};	
	
	if( "enchantChance" in ops ) {
		this.enchantChance = ops["this.enchantChance"];
	}
	if( "id" in ops ) {
		this.itemid = "item_" + ops["id"];
		if(NPC.get(this.itemid)){
			this.on("added", function(){ 
				if( _player instanceof Player && this.name.match(/^key_\d+$/) ){
					_player.keys.push( this );
				}
				this.destroy();
			});
		}
	}
	if( "name" in ops ) {
		if(ops["name"] == "random"){
			this.setName(Item.randomTreasure(Math.random()).name);
		} else {
			this.setName( ops.name );
		}
	}
	
	this.on("sleep", function(){
		if(this.timeLimit){
			this.destroy();
		}
	});
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,0.3); audio.play("key"); }
			if( this.name == "life" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 24; }
			if( this.name == "life_up" ) { obj.lifeMax += 8; obj.heal += 999; DemoThanks.items++; }
			if( this.name == "life_small" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 5; }
			if( this.name == "mana_small" ) { if(obj.mana >= obj.manaMax) return; obj.manaHeal = 12; audio.play("gulp"); }
			if( this.name == "money_bag" ) { Item.dropMoney(obj.position, 50, Game.DELTASECOND*0.5); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "life_fruit") { obj.lifeMax += 6; obj.heal = 9999; audio.play("gulp"); DemoThanks.items++; }
			if( this.name == "mana_fruit") { obj.manaMax += 6; obj.manaHeal = 999; audio.play("gulp"); DemoThanks.items++; }
			
			if( this.isWeapon ) {
				NPC.set(this.name, 1);
				if(this.showItemDescription){
					ItemGet.create(this.name);
				}
				obj.trigger("weapon_get", this)
				/*
				var currentWeapon = _player.equip_sword;
				obj.equip(this, obj.equip_shield);
				game.addObject(currentWeapon);
				currentWeapon.force = new Point(0,0);
				currentWeapon.gravity = 0;
				audio.play("equip");
				*/
			}
			
			if( this.isShield ) {
				if( obj.equip_sword instanceof Item && obj.equip_sword.twoHanded ) {
					//Cant equip shield with a two handed weapon
					return false;
				}
				var currentShield = _player.equip_shield;
				obj.equip(obj.equip_sword, this); 
				game.addObject(currentShield);
				audio.play("equip");
			}
			
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "coin_4") { obj.addMoney(50); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			if( this.name == "spell_refill") { if(this.spell.stock < this.spell.stockMax) { this.spell.stock++; this.destroy(); audio.play("pickup1"); } }
			
			if( this.name == "lightradius") { obj.lightRadius = true; this.pickupEffect(); DemoThanks.items++; }
			if( this.name == "downstab") { obj.downstab = true; this.pickupEffect(); ItemGet.create(this.name); DemoThanks.items++;}
			if( this.name == "doublejump") { obj.doubleJump = true; this.pickupEffect(); ItemGet.create(this.name); DemoThanks.items++;}
			if( this.name == "gauntlets") { obj.walljump = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "dodgeflash") { obj.dodgeFlash = true; this.pickupEffect(); DemoThanks.items++;}
			
			//Enchanted items
			if( this.name == "intro_item") { obj.stats.attack+=3; game.addObject(new SceneTransform(obj.position.x, obj.position.y)); obj.sprite = "player"; audio.play("levelup"); }
			
			
			if( this.name == "seed_oriax") { obj.baseStats.attack+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			if( this.name == "seed_bear") { obj.baseStats.defence+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			if( this.name == "seed_malphas") { obj.baseStats.magic+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			
			
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; this.pickupEffect(); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; this.pickupEffect(); }
			if( this.name == "seed_minotaur") { 
				obj.on("collideObject", function(obj){ 
					if( this.team != obj.team && obj.hurt instanceof Function && Math.abs(this.force.x) > 4) {
						this.force.x *= -0.5;
						obj.hurt( this, Math.ceil(this.damage/2) ); 
					}
				});
				this.pickupEffect();
			}
			if( this.name == "seed_plaguerat") { 
				obj.attackEffects.poison[0] = 1.0; 
				obj.life_steal += 0.2
				obj.on("added",function(){ this.addEffect("poison", 1.0, Game.DELTAYEAR);}); 
				this.pickupEffect();
			}
			if( this.name == "seed_marquis") { obj.stun_time = 0; this.pickupEffect(); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "seed_chort") { obj.lifeMax += 20; obj.heal += 20; obj.stats.defence+=1; this.pickupEffect(); }
			if( this.name == "seed_poseidon") { obj.stats.attack+=1; obj.stats.defence+=1; obj.stats.technique+=1; this.pickupEffect(); }
			if( this.name == "seed_tails") { obj.on("money", function(v){this.life = Math.min(this.lifeMax, this.life+v);}); this.pickupEffect(); }
			if( this.name == "seed_mair") { obj.stats.attack=Math.max(obj.stats.attack-1,1); obj.stats.defence=Math.max(obj.stats.defence-1,1); obj.stats.technique+=4; this.pickupEffect(); }
			if( this.name == "seed_igbo") { obj.stats.defence+=3; this.pickupEffect(); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "haft") { obj.criticalMultiplier += 2.0; this.pickupEffect(); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; this.pickupEffect(); }
			if( this.name == "fangs") { obj.life_steal += 0.1; this.pickupEffect(); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("gulp"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; this.pickupEffect(); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; this.pickupEffect(); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; this.pickupEffect(); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; this.pickupEffect(); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; this.pickupEffect(); }
			if( this.name == "chort_nose") { obj.waystone_bonus *= 2.0; this.pickupEffect(); }
			if( this.name == "plague_mask") { obj.statusEffects.poison=0; obj.statusResistance.poison = 1.0; this.pickupEffect(); }
			if( this.name == "spiked_shield") { obj.on("block", function(o,p,d){ if(o.hurt instanceof Function) o.hurt(this,Math.floor(d/2)); }); this.pickupEffect(); }
			if( this.name == "black_heart") { obj.stats.attack+=1; obj.stats.defence+=2; obj.stats.technique+=1; obj.lifeMax -= 20; obj.life = Math.min(obj.lifeMax,obj.life); this.pickupEffect(); }
			if( this.name == "treasure_map") { game.getObject(PauseMenu).revealMap(2); audio.play("pickup1"); }
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_soul") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			
			if( this.name == "unique_wand"){ obj.addUniqueItem(this); this.destroy(); this.pickupEffect(); }
			if( this.name == "unique_pray"){ obj.addUniqueItem(this); this.destroy(); this.pickupEffect(); }
			
			//dataManager.itemGet(this.name);
			
			if( "equip" in obj ){
				obj.equip();
			}
			
			if(this.itemid){
				game.ga_event("item", this.name);
				NPC.set(this.itemid,1);
				obj.trigger("unique_item_get", this);
			}
			//this.interactive = false;
			obj.trigger("item_get", this);
			this.destroy();
		}
	});
}
Item.prototype.pickupEffect = function(){
	game.addObject(new EffectItemPickup(
		_player.position.x, 
		_player.position.y
	));
}
Item.prototype.setName = function(n){
	this.name = n;
	
	//Equipment
	if(n == "short_sword") { 
		this.frame.x = 0; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(0,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "baseball_bat") { 
		this.frame.x = 1; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(1,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "broad_sword") { 
		this.frame.x = 2; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(2,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "morningstar") { 
		this.frame.x = 3; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(0,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "bloodsickle") { 
		this.frame.x = 4; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(1,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "burningblade") { 
		this.frame.x = 5; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(2,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "whip") { 
		this.frame.x = 6; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(3,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "king_sword") { 
		this.frame.x = 5; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(3,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponList[n];
		return; 
	}
	if(n == "twin_blades") { 
		this.frame.x = 8; this.frame.y = 2; 
		this.isWeapon = true;
		return; 
	}
	if(n == "autodrill") { 
		this.frame.x = 7; this.frame.y = 2; 
		this.isWeapon = true;
		return; 
	}
	
	//Shields
	if(n == "small_shield") { 
		this.frame.x = 0; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.0,"guardlife":30,"height":16, "frame":0, "frame_row":0,"turn":0.15}
		this.slots = [ShieldSmith.SLOT_ATTACK_LOW,ShieldSmith.SLOT_DEFENCE_LOW,ShieldSmith.SLOT_MAGIC_LOW];
		return; 
	}
	if(n == "large_shield") { 
		this.frame.x = 1; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":16, "frame":0, "frame_row":1,"turn":0.4}
		this.slots = [ShieldSmith.SLOT_MAGIC_MID,ShieldSmith.SLOT_SPECIAL_MID,ShieldSmith.SLOT_SPECIAL_LOW,ShieldSmith.SLOT_SPECIAL_LOW];
		return; 
	}
	if(n == "kite_shield") { 
		this.frame.x = 2; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":0, "frame_row":2,"turn":0.5}
		return; 
	}
	if(n == "broad_shield") { 
		this.frame.x = 3; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.4,"guardlife":50,"height":18, "frame":0, "frame_row":3,"turn":0.6}
		return; 
	}
	if(n == "knight_shield") { 
		this.frame.x = 4; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":17, "frame":2, "frame_row":0,"turn":0.5}
		return; 
	}
	if(n == "spiked_shield") { 
		this.frame.x = 5; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":2, "frame_row":1,"turn":0.5}
		return; 
	}
	if(n == "heavy_shield") { 
		this.frame.x = 6; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.2,"guardlife":60,"height":17, "frame":2, "frame_row":2,"turn":0.8}
		return; 
	}
	if(n == "tower_shield") { 
		this.frame.x = 7; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.5,"guardlife":70,"height":30, "frame":2, "frame_row":3,"turn":1.1}
		return; 
	}
	
	if( this.name.match(/^key_\d+$/) ) { this.frame.x = this.name.match(/\d+/) - 0; this.frame.y = 0; return; }
	if(n == "life") { this.frame.x = 0; this.frame.y = 1; return; }
	if(n == "map") { this.frame.x = 3; this.frame.y = 1; this.message = "Map\nReveals unexplored areas on the map."; return }
	
	var coinTime = Game.DELTASECOND * 6;
	
	if(n == "life_small") { this.frame.x = 1; this.frame.y = 1; this.gravity = 0.5; this.timeLimit = coinTime; return; }
	if(n == "mana_small") { this.frame.x = 4; this.frame.y = 1; this.gravity = 0.5; this.timeLimit = coinTime; return; }
	if(n == "money_bag") { this.frame.x = 5; this.frame.y = 1; this.gravity = 0.5; return; }
	if(n == "xp_big") { this.frame.x = 2; this.frame.y = 1; this.gravity = 0.5; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "coin_4") { this.frames = [13,14,15,-14]; this.frame.y = 2;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame.x = 13; this.gravity = 0.5;  this.pushable = true; this.bounce = 0.0; this.timeLimit = coinTime; return; }17
	
	if( this.name == "spell_refill") { this.frame.x = 0; this.frame.y = 10; }
	
	//Special items
	if(n == "lightradius") { this.frame.x = 7; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "downstab") { this.frame.x = 10; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "gauntlets") { this.frame.x = 4; this.frame.y = 6; this.message = i18n("item_"+n); return; }
	if(n == "doublejump") { this.frame.x = 0; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "dodgeflash") { this.frame.x = 5; this.frame.y = 3; this.message = i18n("item_"+n); return; }
	
	//Charms
	if( this.name == "charm_sword") { this.frame.x = 0; this.frame.y = 8; this.message = "Sword Charm\nEnchanted attack.";}
	if( this.name == "charm_mana") { 
		this.frame.x = 1; 
		this.frame.y = 8;
		this.message = "Mana Charm\nLarger supply of mana.";
		this.on("equip",function(){ 
			_player.manaMax += 3;
			_player.mana += 3;
		});
		this.on("unequip",function(){
			_player.manaMax = Math.max(_player.manaMax-3,0);
			_player.mana = Math.max(_player.mana-3,0);
		});
	}
	if( this.name == "charm_alchemist") { this.frame.x = 2; this.frame.y = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame.x = 3; this.frame.y = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame.x = 4; this.frame.y = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame.x = 5; this.frame.y = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame.x = 6; this.frame.y = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame.x = 7; this.frame.y = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	if( this.name == "charm_soul") { this.frame.x = 8; this.frame.y = 8; this.message = "Soul Charm\nA magic seal will protect you.";}
	
	//All items below this point glow!
	this.glowing = true;
		
	if(n == "life_up") { this.frame.x = 6; this.frame.y = 1; return; }
	if( this.name == "intro_item") { this.frame.x = 0; this.frame.y = 4; this.message = "Mysterious drink.";}
	
	if( this.name == "seed_oriax") { this.frame.x = 0; this.frame.y = 4; this.message = "Oriax Seed\nAttack up.";}
	if( this.name == "seed_bear") { this.frame.x = 1; this.frame.y = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame.x = 2; this.frame.y = 4; this.message = "Malphas Seed\nMagic up.";}
	if( this.name == "seed_cryptid") { this.frame.x = 3; this.frame.y = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame.x = 4; this.frame.y = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame.x = 5; this.frame.y = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame.x = 6; this.frame.y = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame.x = 7; this.frame.y = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame.x = 8; this.frame.y = 4; this.message = "Batty Seed\nYou can fly.";}
	if( this.name == "seed_chort") { this.frame.x = 9; this.frame.y = 4; this.message = "Chort Seed\nYour body is a tank.";}
	if( this.name == "seed_poseidon") { this.frame.x = 10; this.frame.y = 4; this.message = "Poseidon Seed\nAll attributes up.";}
	if( this.name == "seed_tails") { this.frame.x = 11; this.frame.y = 4; this.message = "Tails Seed\nGold runs in your veins.";}
	if( this.name == "seed_mair") { this.frame.x = 12; this.frame.y = 4; this.message = "Mair Seed\nTrades attack and defence for technique.";}
	if( this.name == "seed_igbo") { this.frame.x = 13; this.frame.y = 4; this.message = "Igbo Seed\nDefence very up.";}
	
	if( this.name == "pedila") { this.frame.x = 0; this.frame.y = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame.x = 2; this.frame.y = 5; this.message = "Haft\nIncreased critical damage.";}
	if( this.name == "zacchaeus_stick") { this.frame.x = 3; this.frame.y = 5; this.message = "Zacchaeus'\nMore money.";}
	if( this.name == "fangs") { this.frame.x = 4; this.frame.y = 5; this.message = "Fangs\nLife steal.";}
	if( this.name == "passion_fruit") { this.frame.x = 5; this.frame.y = 5; this.message = "Passion Fruit\nFull restoration.";}
	if( this.name == "shield_metal") { this.frame.x = 6; this.frame.y = 5; this.message = "Shield Metal\nCurrent shield improved.";}
	if( this.name == "magic_gem") { this.frame.x = 7; this.frame.y = 5; this.message = "Magic Gem\nEnchanted attack.";}
	if( this.name == "snake_head") { this.frame.x = 8; this.frame.y = 5; this.message = "Snake Head\nAdds poison chance to attack.";}
	if( this.name == "broken_banana") { this.frame.x = 9; this.frame.y = 5; this.message = "Broken Banana\nWeakens enemies.";}
	if( this.name == "blood_letter") { this.frame.x = 10; this.frame.y = 5; this.message = "Blood letter\nAdds bleed chance to attack.";}
	if( this.name == "red_cape") { this.frame.x = 11; this.frame.y = 5; this.message = "Red cape\nAdds rage chance to attack.";}
	if( this.name == "chort_nose") { this.frame.x = 12; this.frame.y = 5; this.message = "Chort Nose\nSniffs out Waystones.";}
	if( this.name == "plague_mask") { this.frame.x = 13; this.frame.y = 5; this.message = "Plague Mask\nImmune to poison.";}
	if( this.name == "spiked_shield") { this.frame.x = 14; this.frame.y = 5; this.message = "Spiked Shield\nInflicts damage on attackers.";}
	if( this.name == "black_heart") { this.frame.x = 15; this.frame.y = 5; this.message = "Black Heart\nLess life, more attributes.";}
	if( this.name == "treasure_map") { this.frame.x = 0; this.frame.y = 6; this.message = "Treasure Map\nReveals secrets areas on map.";}
	if( this.name == "life_fruit") { this.frame.x = 1; this.frame.y = 6; this.message = "Life fruit\nLife up.";}
	if( this.name == "mana_fruit") { this.frame.x = 2; this.frame.y = 6; this.message = "Mana fruit\nMana up.";}
	
	if( this.name == "unique_wand"){
		this.frame.x = 2;
		this.frame.y = 6;
		this.message = "Ancient Wand";
		this.progress = 0.0;
		this.use = function(player){
			this.progress += game.deltaUnscaled;
			if(this.progress < Game.DELTASECOND * 2){
				game.pause = true;
				return true;
			}else{
				this.progress = 0.0;
				Trigger.activate("caverock");
				game.pause = false;
				return false;
			}
		}
	}
	
	if( this.name == "unique_pray"){
		this.frame.x = 1;
		this.frame.y = 6;
		this.message = "Strange Prayer";
		this.progress = 0.0;
		this.use = function(player){
			this.progress += game.deltaUnscaled;
			if(this.progress < Game.DELTASECOND * 2){
				game.pause = true;
				return true;
			}else{
				var objs = game.overlaps(new Line(game.camera,game.camera.add(game.resolution)));
				for(var i=0; i < objs.length; i++){
					objs[i].trigger("prayer");
				}
				this.progress = 0.0;
				game.pause = false;
				return false;
			}
		}
	}
}
Item.prototype.getMessage = function(){
	if( "message" in this ) {
		if( this.message instanceof Function){
			return this.message();
		} else {
			return this.message;
		}
	} else {
		return this.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); })
	}
}
Item.prototype.update = function(){
	if(this.timeLimit){
		if(this.timeLimit - this.time < Game.DELTASECOND * 2){
			//Flash
			this.visible = (this.time / (Game.DELTASECOND * 0.125)) % 1.0 > 0.5;
		}
		if(this.time >= this.timeLimit){
			this.destroy();
		}
		this.time += this.delta;
	}
	if( this.sleep != null ){
		this.sleep -= this.delta;
		this.interactive = this.sleep <= 0;
		if(this.sleep > 0 ){
			this.visible = !this.visible;
		} else {
			this.visible = true;
		}
	}
	if( this.frames.length > 0 ) {
		this.animation_frame = (this.animation_frame + this.delta * this.animation_speed) % this.frames.length;
		this.frame.x = this.frames[ Math.floor( this.animation_frame ) ];
		this.flip = this.frame.x < 0;
		this.frame.x = Math.abs(this.frame.x);
	}
	
	if( this.glowing ) {
		Background.pushLight(this.position, 128, COLOR_WHITE);
	}
}

Item.drop = function(obj){
	DemoThanks.kills++;
	
	let dropItem = false;
	
	if("moneyDrop" in obj){
		Item.dropMoney(obj.position, obj.moneyDrop);
		dropItem = obj.moneyDrop > 0;
	}
	
	if( dropItem ){
		if (Math.random() > 0.9) {
			var item = new Item( obj.position.x, obj.position.y, false, {"name" : "life_small"} );
			game.addObject( item );
		}
		
		if (Math.random() > 0.967) {
			var item = new Item( obj.position.x, obj.position.y, false, {"name" : "mana_small"} );
			game.addObject( item );
		}
	}
}
Item.dropMoney = function(position, money, sleep){
	if(sleep == undefined){
		sleep = 0;
	}
	while(money > 0){
		var coin;
		var off = new Point((Math.random()-.5)*8,(Math.random()-.5)*8);
		if(money > 100){
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_4"} );
			money -= 50;
		} else if(money > 40){
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_3"} );
			money -= 10;
		} else if( money > 10 ) {
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_2"} );
			money -= 5;
		} else {
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_1"} );
			money -= 1;
		}
		coin.force.y -= 5.0;
		if( sleep ) coin.sleep = sleep;
		game.addObject(coin);
	}
}
Item.randomTreasure = function(roll, tags, ops){
	tags = tags || [];
	ops = ops || {};
	ops.remaining = ops.remaining || 0;
	
	var shortlist = [];
	var total = 0.0;
	for(var i=0; i<Item.treasures.length; i++) 
		if((!ops.locked && Item.treasures[i].remaining > ops.remaining) || (ops.locked && Item.treasures[i].unlocked <= 0))
			if(Item.treasures[i].tags.intersection(tags).length == tags.length) {
				total += Item.treasures[i].rarity;
				shortlist.push(Item.treasures[i]);
			}
	roll *= total;
	for(var i=0; i<shortlist.length; i++) {
		if( roll < shortlist[i].rarity ) return shortlist[i];
		roll -= shortlist[i].rarity;
	}
	return Item.treasures[0];
}

Item.weaponDescription = function(){
	var out = "";
	var att = this.bonus_att || 0;
	var def = this.bonus_def || 0;
	if( "weaponProperties" in this ){
		if("prefix" in this.weaponProperties) out += this.weaponProperties.prefix + " ";
		if("title" in this.weaponProperties) out += this.weaponProperties.title + " ";
		if("suffix" in this.weaponProperties) out += this.weaponProperties.suffix;
		out += "\n\v" + att + " ";
		if( def > 0 ) out += "\b" + def;
		out += "\n";
		
		if("props" in this.weaponProperties){
			for(var i=0; i < this.weaponProperties.props.length && i < 2; i++){
				out += this.weaponProperties.props[i] + "\n";
			}
		}
	} else { 
		out += this.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); })
		out += "\n\v" + att + " ";
		if( def > 0 ) out += "\n\b" + def;
		out += "\n";
	}
	return out;
}