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
	this.enchantChance = 0.8;
	
	ops = ops || {};	
	if( name != undefined ) {
		this.setName( name );
	}
	if( "enchantChance" in ops ) this.enchantChance = ops["this.enchantChance"];
	if( "name" in ops ) this.setName( ops.name );
	
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
			
			if( this.name == "small_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "large_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "kite_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "broad_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "knight_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "spiked_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "heavy_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			if( this.name == "tower_shield") { obj.equip(obj.equip_sword, this); audio.play("equip"); }
			
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			//Enchanted items
			if( this.name == "intro_item") { obj.stats.attack+=3; game.addObject(new SceneTransform(obj.position.x, obj.position.y)); obj.sprite = sprites.player; audio.play("levelup"); }
			
			
			if( this.name == "seed_oriax") { obj.stats.attack+=1; audio.play("levelup"); }
			if( this.name == "seed_bear") { obj.stats.defence+=1; audio.play("levelup"); }
			if( this.name == "seed_malphas") { obj.stats.technique+=1; audio.play("levelup"); }
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; audio.play("levelup"); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; audio.play("levelup"); }
			if( this.name == "seed_minotaur") { 
				obj.on("collideObject", function(obj){ 
					if( this.team != obj.team && obj.hurt instanceof Function && Math.abs(this.force.x) > 4) {
						this.force.x *= -0.5;
						obj.hurt( this, Math.ceil(this.damage/2) ); 
					}
				});
			}
			if( this.name == "seed_plaguerat") { 
				obj.attackEffects.poison[0] = 1.0; 
				obj.life_steal += 0.2
				obj.on("added",function(){ this.addEffect("poison", 1.0, Game.DELTAYEAR);}); 
				audio.play("levelup"); 
			}
			if( this.name == "seed_marquis") { obj.stun_time = 0; audio.play("levelup"); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "seed_chort") { obj.lifeMax += 20; obj.heal += 20; obj.stats.defence+=1; audio.play("levelup"); }
			if( this.name == "seed_poseidon") { obj.stats.attack+=1; obj.stats.defence+=1; obj.stats.technique+=1; audio.play("levelup"); }
			if( this.name == "seed_tails") { obj.on("money", function(v){this.life = Math.min(this.lifeMax, this.life+v);}); audio.play("levelup"); }
			if( this.name == "seed_mair") { obj.stats.attack=Math.max(obj.stats.attack-1,1); obj.stats.defence=Math.max(obj.stats.defence-1,1); obj.stats.technique+=4; audio.play("levelup"); }
			if( this.name == "seed_igbo") { obj.stats.defence+=3; audio.play("levelup"); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "haft") { obj.criticalMultiplier += 2.0; audio.play("levelup"); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; audio.play("levelup"); }
			if( this.name == "fangs") { obj.life_steal += 0.1; audio.play("levelup"); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("gulp"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; audio.play("levelup"); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; audio.play("levelup"); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; audio.play("levelup"); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; audio.play("levelup"); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; audio.play("levelup"); }
			if( this.name == "chort_nose") { obj.waystone_bonus *= 2.0; audio.play("levelup"); }
			if( this.name == "plague_mask") { obj.statusEffects.poison=0; obj.statusResistance.poison = 1.0; audio.play("levelup"); }
			if( this.name == "spiked_shield") { obj.on("block", function(o,p,d){ if(o.hurt instanceof Function) o.hurt(this,Math.floor(d/2)); }); audio.play("levelup"); }
			if( this.name == "black_heart") { obj.stats.attack+=1; obj.stats.defence+=2; obj.stats.technique+=1; obj.lifeMax -= 20; obj.life = Math.min(obj.lifeMax,obj.life); audio.play("levelup"); }
			if( this.name == "treasure_map") { game.getObject(PauseMenu).revealMap(2); audio.play("levelup"); }
			if( this.name == "life_fruit") { obj.lifeMax += 20; obj.heal = 9999; audio.play("gulp"); }
			if( this.name == "mana_fruit") { obj.manaMax += 2; obj.manaHeal = 999; audio.play("gulp"); }
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			
			dataManager.itemGet(this.name);
			
			if( "equip" in obj ){
				obj.equip();
			}
			
			var pm = game.getObject(PauseMenu);
			if( pm != null && this.message != undefined ) {
				pm.message( this.getMessage() );
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
		this.level=1; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":12, "sprite":sprites.sword1 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "long_sword") { 
		this.frame = 1; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":11,"rest":8.0,"range":18, "sprite":sprites.sword2 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "broad_sword") { 
		this.frame = 3; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":18, "sprite":sprites.sword2 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "spear") { 
		this.frame = 2; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":21.5, "strike":17.5,"rest":12.0,"range":27, "sprite":sprites.sword3 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "small_shield") { 
		this.frame = 0; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.0,"guardlife":30,"height":11, "frame":0, "frame_row":0}
		return; 
	}
	if(n == "large_shield") { 
		this.frame = 1; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":16, "frame":0, "frame_row":1}
		return; 
	}
	if(n == "kite_shield") { 
		this.frame = 2; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":0, "frame_row":2}
		return; 
	}
	if(n == "broad_shield") { 
		this.frame = 3; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.4,"guardlife":50,"height":18, "frame":0, "frame_row":3}
		return; 
	}
	if(n == "knight_shield") { 
		this.frame = 4; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":17, "frame":2, "frame_row":0}
		return; 
	}
	if(n == "spiked_shield") { 
		this.frame = 5; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":2, "frame_row":1}
		return; 
	}
	if(n == "heavy_shield") { 
		this.frame = 6; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.2,"guardlife":60,"height":17, "frame":2, "frame_row":2}
		return; 
	}
	if(n == "tower_shield") { 
		this.frame = 7; this.frame_row = 3; 
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.5,"guardlife":70,"height":30, "frame":2, "frame_row":3}
		return; 
	}
	
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	//if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	//if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "mana_small") { this.frame = 4; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "money_bag") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame = 13; this.frame_row = 0; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.0; return; }
	
	if( this.name == "intro_item") { this.frame = 0; this.frame_row = 4; this.message = "Mysterious drink.";}
	
	if( this.name == "seed_oriax") { this.frame = 0; this.frame_row = 4; this.message = "Oriax Seed\nAttack up.";}
	if( this.name == "seed_bear") { this.frame = 1; this.frame_row = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame = 2; this.frame_row = 4; this.message = "Malphas Seed\nTechnique up.";}
	if( this.name == "seed_cryptid") { this.frame = 3; this.frame_row = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame = 4; this.frame_row = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame = 5; this.frame_row = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame = 6; this.frame_row = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame = 7; this.frame_row = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame = 8; this.frame_row = 4; this.message = "Batty Seed\nYou can fly.";}
	if( this.name == "seed_chort") { this.frame = 9; this.frame_row = 4; this.message = "Chort Seed\nYour body is a tank.";}
	if( this.name == "seed_poseidon") { this.frame = 10; this.frame_row = 4; this.message = "Poseidon Seed\nAll attributes up.";}
	if( this.name == "seed_tails") { this.frame = 11; this.frame_row = 4; this.message = "Tails Seed\nGold runs in your veins.";}
	if( this.name == "seed_mair") { this.frame = 12; this.frame_row = 4; this.message = "Mair Seed\nTrades attack and defence for technique.";}
	if( this.name == "seed_igbo") { this.frame = 13; this.frame_row = 4; this.message = "Igbo Seed\nDefence very up.";}
	
	if( this.name == "pedila") { this.frame = 0; this.frame_row = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame = 2; this.frame_row = 5; this.message = "Haft\nIncreased critical damage.";}
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
	if( this.name == "black_heart") { this.frame = 15; this.frame_row = 5; this.message = "Black Heart\nLess life, more attributes.";}
	if( this.name == "treasure_map") { this.frame = 0; this.frame_row = 6; this.message = "Treasure Map\nReveals secrets areas on map.";}
	if( this.name == "life_fruit") { this.frame = 1; this.frame_row = 6; this.message = "Life fruit\nLife up.";}
	if( this.name == "mana_fruit") { this.frame = 2; this.frame_row = 6; this.message = "Mana fruit\nMana up.";}
	
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
			_player.manaMax = Math.max(_player.manaMax-3,0);
			_player.mana = Math.max(_player.mana-3,0);
		});
	}
	if( this.name == "charm_alchemist") { this.frame = 2; this.frame_row = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame = 3; this.frame_row = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame = 4; this.frame_row = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame = 5; this.frame_row = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame = 6; this.frame_row = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame = 7; this.frame_row = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	
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
	} else {
		var bonus = _player.money_bonus || 1.0;
		//money = money == undefined ? (Math.max(dataManager.currentTemple*2,0)+(2+Math.random()*4)) : money;
		money = money == undefined ? (1+Math.random()*3) : money;
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
		if (Math.random() < _player.waystone_bonus && !money_only) {
			var item = new Item( obj.position.x, obj.position.y, "waystone" );
			if( sleep != undefined ) item.sleep = sleep;
			game.addObject( item );
		}
	}
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
Item.enchantWeapon = function(weapon){
	if(!("weaponProperties" in weapon)){
		weapon.message = Item.weaponDescription;
		weapon.weaponProperties = {
			"prefix" : "",
			"title" : weapon.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); }),
			"suffix" : "",
			"props" : []
		};
	}
	
	
	var enchantments = {
		"lifesteal":{"prefix":"Bloody","suffix":"of Blood","rarity":0.1,"description":"Life steal"},
		"sharp":{"prefix":"Sharp","suffix":"of Sharpness","rarity":2.0},
		"deadly":{"prefix":"Deadly","suffix":"of Death","rarity":1.3},
		"cruel":{"prefix":"Cruel","suffix":"of Cruelty","rarity":0.9},
		"savage":{"prefix":"Savage","suffix":"of Savagery","rarity":0.5},
		"phantom":{"prefix":"Phantom","suffix":"of Phantom","rarity":0.01,"description":"Ignores shields"},
		"swiftness":{"prefix":"Swift","suffix":"of Swiftness","rarity":0.5},
		"wise":{"prefix":"Wise","suffix":"of Wisdom","rarity":0.3,"description":"Increased Mana"},
		"slayer":{"prefix":"Slayer's","suffix":"of Slaying","rarity":0.2},
		"guard":{"prefix":"Guardian's","suffix":"of the guardian","rarity":0.5},
		"poison":{"prefix":"Poisonous","suffix":"of Poison","rarity":0.2,"description":"Poison chance"},
		"slow":{"prefix":"Frozen","suffix":"of Frost","rarity":0.2,"description":"Freeze chance"},
		"weakness":{"prefix":"Weakening","suffix":"of Weakness","rarity":0.2,"description":"Weakness chance"}
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
		weapon.bonus_def = weapon.bonus_def || 0;
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
	
	if(weapon.weaponProperties.prefix == ""){
		weapon.weaponProperties.prefix = enchantment.prefix;
	} else if(weapon.weaponProperties.suffix == ""){
		weapon.weaponProperties.suffix = enchantment.suffix;
		weapon.suffix = enchantment.suffix
	}
	if("description" in enchantment){
		weapon.weaponProperties.props.push( enchantment.description );
	}
	
	weapon.filter = "gold";
}