Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	this.sleep = null;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 0.25;
	this.enchantChance = 0.2;
	
	ops = ops || {}
	if( "enchantChance" in ops ) this.enchantChance = ops["this.enchantChance"];
	
	if( name != undefined ) {
		this.setName( name );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 20; obj.heal += 20; }
			if( this.name == "life_small" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 20; }
			if( this.name == "mana_small" ) { if(obj.mana >= obj.manaMax) return; obj.manaHeal = 3; audio.play("gulp"); }
			if( this.name == "money_bag" ) { obj.money += Math.floor(30*(1+dataManager.currentTemple*0.33)); audio.play("pickup1"); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			
			if( this.name == "short_sword") { obj.equip(this, obj.equip_shield); audio.play("equip") }
			if( this.name == "long_sword") { obj.equip(this, obj.equip_shield); audio.play("equip") }
			if( this.name == "spear") { obj.equip(this, obj.equip_shield); audio.play("equip") }
			if( this.name == "small_shield") { obj.equip(obj.equip_sword, this); audio.play("equip") }
			if( this.name == "tower_shield") { obj.equip(obj.equip_sword, this); audio.play("equip") }
			
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			//Enchanted items
			if( this.name == "seed_oriax") { obj.stats.attack+=1; audio.play("levelup"); }
			if( this.name == "seed_bear") { obj.stats.defence+=1; audio.play("levelup"); }
			if( this.name == "seed_malphas") { obj.stats.technique+=1; audio.play("levelup"); }
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; audio.play("levelup"); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; audio.play("levelup"); }
			if( this.name == "seed_minotaur") { obj.on("collideObject", function(obj){ if( this.team != obj.team && obj.hurt instanceof Function ) obj.hurt( this, Math.ceil(this.damage/5) ); }); }
			if( this.name == "seed_plaguerat") { 
				obj.attackEffects.poison[0] += 1.0; 
				obj.life_steal = Math.min(obj.life_steal+0.2,0.4); 
				obj.statusEffectsTimers.poison = obj.statusEffects.poison = Game.DELTAYEAR;
				obj.trigger("status_effect", "poison");
				obj.on("added",function(){
					obj.statusEffectsTimers.poison=this.statusEffects.poison=Game.DELTAYEAR; 
					this.trigger("status_effect", "poison");
				}); 
				audio.play("levelup"); 
			}
			if( this.name == "seed_marquis") { obj.stun_time = 0; audio.play("levelup"); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); audio.play("levelup"); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "haft") { obj.equip_sword.bonus_def = obj.equip_sword.bonus_def+1 || 1; obj.equip_sword.level++; audio.play("levelup"); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; audio.play("levelup"); }
			if( this.name == "fangs") { obj.life_steal = Math.min(obj.life_steal+0.1,0.4); audio.play("levelup"); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("levelup"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; audio.play("levelup"); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; audio.play("levelup"); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; audio.play("levelup"); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; audio.play("levelup"); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; audio.play("levelup"); }
			if( this.name == "chort_nose") { obj.waystone_bonus += .08; audio.play("levelup"); }
			if( this.name == "plague_mask") { obj.spellsCounters.poison=0; obj.on("status_effect",function(i){ this.spellsCounters.poison=0; }); audio.play("levelup"); }
			if( this.name == "spiked_shield") { obj.on("block", function(o,p,d){ if(o.hurt instanceof Function) o.hurt(this,Math.floor(d/2)); }); audio.play("levelup"); }
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			var pm = game.getObject(PauseMenu);
			if( pm != null && this.message != undefined ) {
				pm.message( this.message );
			}
			this.interactive = false;
			this.destroy();
		}
	});
}
Item.prototype.setName = function(n){
	this.name = n;
	
	//Equipment
	if(n == "short_sword") { 
		this.frame = 0; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=2; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":12, "sprite":sprites.sword1 };
		this.message = "Short sword\n\v"+this.bonus_att;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "long_sword") { 
		this.frame = 1; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":11,"rest":8.0,"range":18, "sprite":sprites.sword2 };
		this.message = "Long sword\n\v"+this.bonus_att;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "broad_sword") { 
		this.frame = 3; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":18, "sprite":sprites.sword2 };
		this.message = "Broad sword\n\v"+this.bonus_att;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "spear") { 
		this.frame = 2; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":21.5, "strike":17.5,"rest":12.0,"range":27, "sprite":sprites.sword3 };
		this.message = "Spear\n\v"+this.bonus_att;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "mana_small") { this.frame = 4; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "money_bag") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame_row = 0; this.addModule(mod_rigidbody); this.bounce = 0.0; return; }
	
	if( this.name == "seed_oriax") { this.frame = 0; this.frame_row = 4; this.message = "Oriax Seed\nDamage up.";}
	if( this.name == "seed_bear") { this.frame = 1; this.frame_row = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame = 2; this.frame_row = 4; this.message = "Malphas Seed\nTechnique up.";}
	if( this.name == "seed_cryptid") { this.frame = 3; this.frame_row = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame = 4; this.frame_row = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame = 5; this.frame_row = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame = 6; this.frame_row = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame = 7; this.frame_row = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame = 8; this.frame_row = 4; this.message = "Batty Seed\nYou can fly.";}
	
	if( this.name == "pedila") { this.frame = 0; this.frame_row = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame = 2; this.frame_row = 5; this.message = "Haft\nCurrent weapon defence up.";}
	if( this.name == "zacchaeus_stick") { this.frame = 3; this.frame_row = 5; this.message = "Zacchaeus'\nMore money.";}
	if( this.name == "fangs") { this.frame = 4; this.frame_row = 5; this.message = "Fangs\nLife steal.";}
	if( this.name == "passion_fruit") { this.frame = 5; this.frame_row = 5; this.message = "Passion Fruit\nFull restoration.";}
	if( this.name == "shield_metal") { this.frame = 6; this.frame_row = 5; this.message = "Shield Metal\nCurrent shield improved.";}
	if( this.name == "magic_gem") { this.frame = 7; this.frame_row = 5; this.message = "Magic Gem\nEnchanted attack.";}
	if( this.name == "snake_head") { this.frame = 8; this.frame_row = 5; this.message = "Snake Head\nAdds poison chance to attack.";}
	if( this.name == "broken_banana") { this.frame = 9; this.frame_row = 5; this.message = "Broken Banana\nWeakens enemies.";}
	if( this.name == "blood_letter") { this.frame = 10; this.frame_row = 5; this.message = "Blood letter\nAdds bleed chance to attack.";}
	if( this.name == "red_cape") { this.frame = 11; this.frame_row = 5; this.message = "Red cape\nAdds rage chance to attack.";}
	if( this.name == "chort_nose") { this.frame = 12; this.frame_row = 5; this.message = "Chort Nose\nSniffs out Waystones.";}
	if( this.name == "plague_mask") { this.frame = 13; this.frame_row = 5; this.message = "Plague Mask\nImmune to poison.";}
	if( this.name == "spiked_shield") { this.frame = 14; this.frame_row = 5; this.message = "Spiked Shield\nInflicts damage on attackers.";}
	
	if( this.name == "charm_sword") { this.frame = 0; this.frame_row = 8; this.message = "Sword Charm\nEnchanted attack.";}
	if( this.name == "charm_mana") { 
		this.frame = 1; 
		this.frame_row = 8;
		this.message = "Mana Charm\nLarger supply of mana.";
		this.on("equip",function(){ 
			_player.manaMax += 3;
			_player.mana += 3;
		});
		this.on("unequip",function(){
			_player.manaMax -= 3;
			_player.mana -= 3;
		});
	}
	if( this.name == "charm_alchemist") { this.frame = 2; this.frame_row = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame = 3; this.frame_row = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame = 4; this.frame_row = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame = 5; this.frame_row = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame = 6; this.frame_row = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame = 7; this.frame_row = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	
}
Item.prototype.update = function(){
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
		this.frame = this.frames[ Math.floor( this.animation_frame ) ];
		this.flip = this.frame < 0;
		this.frame = Math.abs(this.frame);
	}
}
Item.drop = function(obj,money,sleep){
	var money_only = obj.hasModule(mod_boss);
	if(Math.random() > (_player.life / _player.lifeMax) && !money_only){
		var item = new Item( obj.position.x, obj.position.y, "life_small" );
		if( sleep != undefined ) item.sleep = sleep;
		game.addObject( item );
	} else if (Math.random() < _player.waystone_bonus && !money_only) {
		var item = new Item( obj.position.x, obj.position.y, "waystone" );
		if( sleep != undefined ) item.sleep = sleep;
		game.addObject( item );
	} else {
		var bonus = _player.money_bonus || 1.0;
		//money = money == undefined ? (Math.max(dataManager.currentTemple*2,0)+(2+Math.random()*4)) : money;
		money = money == undefined ? (2+Math.random()*4) : money;
		money = Math.floor( money * bonus );
		while(money > 0){
			var coin;
			var off = new Point((Math.random()-.5)*8,(Math.random()-.5)*8);
			if(money > 40){
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_3" );
				money -= 10;
			} else if( money > 10 ) {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_2" );
				money -= 5;
			} else {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_1" );
				money -= 1;
			}
			coin.force.y -= 5.0;
			if( sleep != undefined ) coin.sleep = sleep;
			game.addObject(coin);
			
		}
	}
}

Item.enchantWeapon = function(weapon){
	var enchantments = {
		"lifesteal":{"prefix":"Bloody","suffix":"of Blood","rarity":0.1},
		"sharp":{"prefix":"Sharp","suffix":"of Sharpness","rarity":2.0},
		"deadly":{"prefix":"Deadly","suffix":"of Death","rarity":1.3},
		"cruel":{"prefix":"Cruel","suffix":"of Cruelty","rarity":0.9},
		"savage":{"prefix":"Savage","suffix":"of Savagery","rarity":0.5},
		"phantom":{"prefix":"Phantom","suffix":"of Phantom","rarity":0.01},
		"swiftness":{"prefix":"Swift","suffix":"of Swiftness","rarity":0.5},
		"wise":{"prefix":"Wise","suffix":"of Wisdom","rarity":0.3},
		"slayer":{"prefix":"Slayer's","suffix":"of Slaying","rarity":0.2},
		"guard":{"prefix":"Guardian's","suffix":"of the guardian","rarity":0.5},
		"poison":{"prefix":"Poisonous","suffix":"of Poison","rarity":0.2},
		"slow":{"prefix":"Frozen","suffix":"of Frost","rarity":0.2},
		"weakness":{"prefix":"Weakening","suffix":"of Weakness","rarity":0.2}
	};
	var total=0; for(var i in enchantments) total += enchantments[i].rarity;
	roll = Math.random() * total;
	
	var i = "sharp";
	var enchantment = enchantments[i];
	
	for(i in enchantments){
		if(roll <= enchantments[i].rarity){
			enchantment = enchantments[i];
			break;
		} else {
			roll -= enchantments[i].rarity;
		}
	}
	
	if(i=="lifesteal"){
		weapon.level += 3;
		weapon.on("equip",function(player){ player.life_steal += 0.1; } );
		weapon.on("unequip",function(player){ player.life_steal -= 0.1; } );
	} else if(i=="sharp"){
		weapon.bonus_att += 1;
		weapon.level += 1;
	} else if(i=="deadly"){
		weapon.bonus_att += 2;
		weapon.level += 1;
	} else if(i=="cruel"){
		weapon.bonus_att += 3;
		weapon.level += 1;
	} else if(i=="savage"){
		weapon.bonus_att += 4;
		weapon.level += 1;
	} else if(i=="phantom"){
		weapon.level += 5;
		weapon.ignore_shields = true;
	} else if(i=="swiftness"){
		var hold = weapon.stats.strike - weapon.stats.rest;
		weapon.stats.warm = Math.max(weapon.stats.warm*0.75, hold);
		weapon.stats.strike = Math.max(weapon.stats.strike*0.75, hold);
		weapon.stats.rest = Math.max(weapon.stats.rest*0.75, 0);
		weapon.level += 1;
	} else if(i=="wise"){
		weapon.on("equip",function(player){ player.manaMax += 2; } );
		weapon.on("unequip",function(player){ player.manaMax -= 2; player.mana = Math.min(player.mana, player.manaMax); } );
		weapon.level += 1;
	} else if(i=="slayer"){
		weapon.bonus_att += 1;
		weapon.level += 1;
	} else if(i=="guard"){
		weapon.bonus_def += 2;
		weapon.level += 1;
	} else if(i=="poison"){
		weapon.on("equip",function(player){ player.attackEffects.poison[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.poison[0] -= 0.2; } );
		weapon.level += 2;
	} else if(i=="slow"){
		weapon.on("equip",function(player){ player.attackEffects.slow[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.slow[0] -= 0.2; } );
		weapon.level += 3;
	} else if(i=="weakness"){
		weapon.on("equip",function(player){ player.attackEffects.weaken[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.weaken[0] -= 0.2; } );
		weapon.level += 1;
	}
	
	if(!("prefix" in weapon)){
		weapon.prefix = enchantment.prefix;
	} else if(!("suffix" in weapon)){
		weapon.suffix = enchantment.suffix
	}
	
	weapon.filter = "gold";
	weapon.message = ("prefix" in weapon ? weapon.prefix+" " : "") + weapon.name + ("suffix" in weapon ? " "+weapon.suffix : "");
	if( "bonus_att" in weapon || "bonus_def" in weapon ){
		weapon.message += "\n";
		if( "bonus_att" in weapon ) weapon.message += "\v" + weapon.bonus_att +" ";
		if( "bonus_def" in weapon ) weapon.message += "\b" + weapon.bonus_def;
		weapon.message += "\n";
	}
}