Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 17;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 0.25;
	
	if( name != undefined ) {
		this.setName( name );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 20; obj.heal += 20; }
			if( this.name == "life_small" ) { obj.heal = 20; }
			if( this.name == "mana_small" ) { obj.manaHeal = 35; }
			if( this.name == "money_bag" ) { obj.money += Math.floor(30*(1+dataManager.currentTemple*0.33)); audio.play("pickup1"); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "short_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "long_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "spear") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "small_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "tower_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.money+=1; audio.play("coin"); }
			if( this.name == "coin_2") { obj.money+=5; audio.play("coin"); }
			if( this.name == "coin_3") { obj.money+=10; audio.play("coin"); }
			if( this.name == "waystone") { obj.waystones++; audio.play("coin"); }
			
			//Enchanted items
			if( this.name == "seed_oriax") { obj.stats.attack+=1; audio.play("levelup"); }
			if( this.name == "seed_bear") { obj.stats.defence+=1; audio.play("levelup"); }
			if( this.name == "seed_malphas") { obj.stats.technique+=1; audio.play("levelup"); }
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; audio.play("levelup"); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; audio.play("levelup"); }
			if( this.name == "seed_minotaur") { obj.on("collideObject", function(obj){ if( this.team != obj.team && obj.hurt instanceof Function ) obj.hurt( this, Math.ceil(this.damage/5) ); }); }
			if( this.name == "seed_plaguerat") { obj.attackEffects.poison[0] += 1.0; obj.life_steal = Math.min(obj.life_steal+0.2,0.4); obj.statusEffectsTimers.poison=obj.statusEffects.poison=Game.DELTAYEAR; obj.on("added",function(){obj.statusEffects.poison=Game.DELTAYEAR;}); audio.play("levelup"); }
			if( this.name == "seed_marquis") { obj.stun_time = 0; audio.play("levelup"); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); audio.play("levelup"); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "whetstone") { obj.equip_sword.bonus_att++; obj.equip_sword.level++; audio.play("levelup"); }
			if( this.name == "haft") { obj.equip_sword.bonus_def = obj.equip_sword.bonus_def+1 || 1; obj.equip_sword.level++; audio.play("levelup"); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; audio.play("levelup"); }
			if( this.name == "fangs") { obj.life_steal = Math.min(obj.life_steal+0.2,0.4); audio.play("levelup"); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("levelup"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; audio.play("levelup"); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; audio.play("levelup"); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; audio.play("levelup"); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; audio.play("levelup"); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; audio.play("levelup"); }
			
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
		this.level=4; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":12, "sprite":sprites.sword1 };
		return; 
	}
	if(n == "long_sword") { 
		this.frame = 1; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":10,"rest":7.0,"range":18, "sprite":sprites.sword2 };
		return; 
	}
	if(n == "broad_sword") { 
		this.frame = 3; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":18, "sprite":sprites.sword2 };
		return; 
	}
	if(n == "spear") { 
		this.frame = 2; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = true;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":18.5, "strike":13.5,"rest":8.0,"range":27, "sprite":sprites.sword3 };
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
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "mana_small") { this.frame = 4; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "money_bag") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	
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
	if( this.name == "whetstone") { this.frame = 1; this.frame_row = 5; this.message = "Whetstone\nCurrent weapon improved.";}
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
	
}
Item.prototype.update = function(){
	if( this.frames.length > 0 ) {
		this.animation_frame = (this.animation_frame + this.delta * this.animation_speed) % this.frames.length;
		this.frame = this.frames[ Math.floor( this.animation_frame ) ];
		this.flip = this.frame < 0;
		this.frame = Math.abs(this.frame);
	}
}
Item.drop = function(obj,money){
	if(Math.random() > (_player.life / _player.lifeMax) && money == undefined){
		game.addObject( new Item( obj.position.x, obj.position.y, "life_small" ) );
	} else {
		var bonus = _player.money_bonus || 1.0;
		money = money == undefined ? (Math.max(dataManager.currentTemple*2,0)+(2+Math.random()*4)) : money;
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
			game.addObject(coin);
			
		}
	}
}