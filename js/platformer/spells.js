function Spell(){
	this.name = "Spell";
	this.stock = 10;
	this.castTime = Game.DELTASECOND;
	this.stockMax = 10;
	this.refillRarity = 10.0;
	this.frame = new Point(0,10);
}
Spell.prototype.use = function(player){}
Spell.prototype.modifyStats = function(player, type){}
Spell.prototype.canCast = function(player){ return true; }
Spell.prototype.render = function(g,p){
	g.renderSprite("items",p,10,this.frame);
}
Spell.SLOTTYPE_NORMAL = 0;
Spell.SLOTTYPE_ELEMENT = 1;
Spell.SLOTTYPE_ATTACK = 2;
Spell.SLOTTYPE_DEFENCE = 3;
Spell.randomRefill = function(player){
	var total = 0.0;
	var roll = Math.random();
	var availableCriteria = function(s){
		return s.stock < s.stockMax;
	}
	
	for(var i=0; i < player.spells.length; i++){
		if(availableCriteria(player.spells[i])){
			total += player.spells[i].refillRarity
		}
	}
	roll *= total;
	for(var i=0; i < player.spells.length; i++){
		if(availableCriteria(player.spells[i])){
			if(player.spells[i].refillRarity >= roll){
				return player.spells[i];
			} else {
				roll -= player.spells[i].refillRarity;
			}
		}
	}
}

SpellFire.prototype = new Spell();
SpellFire.prototype.constructor = Spell;
function SpellFire(){
	//Fires a fireball
	this.constructor();
	this.name = "Fireball";
	this.stock = 10;
	this.stockMax = 10;
	this.castTime = Game.DELTASECOND * 0.15;
	this.frame = new Point(0,10);
}
SpellFire.prototype.use = function(player){
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	var bullet = Bullet.createFireball(player.position.x, player.position.y);
	bullet.force.x = player.flip ? -6 : 6;
	bullet.team = player.team;
	bullet.ignoreInvincibility = true;
	bullet.damageFire = 5 + player.stats.magic * 3;
	game.addObject(bullet);
}
SpellFire.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 7,0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.stats.attack += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defenceFire += max * (0.025 + power*0.01);
		player.damageFire += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += max * (1+power);
		player.damageFire += max * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.defenceFire += max * (0.05 + power*0.02);
	}
}

SpellSlimeGernade.prototype = new Spell();
SpellSlimeGernade.prototype.constructor = Spell;
function SpellSlimeGernade(){
	//Fires a fireball
	this.constructor();
	this.name = "Slime gernade";
	this.stock = 10;
	this.stockMax = 10;
	this.castTime = Game.DELTASECOND * 0.15;
	this.frame = new Point(6,10);
}
SpellSlimeGernade.prototype.use = function(player){
	var nade = new Gernade(player.position.x, player.position.y);
	nade.damageSlime = 5 + player.stats.magic * 3;
	nade.force.x = 6;
	nade.force.y = -8;
	nade.team = player.team;
	nade.force.x *= player.flip ? -1.0 : 1.0;
	game.addObject(nade);
}
SpellSlimeGernade.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 7,0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.damageSlime += max * (2+power);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defenceSlime += max * (0.025 + power*0.01);
		player.damageSlime += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.damageSlime += max * (2+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.defenceSlime += max * (0.05 + power*0.02);
	}
}


SpellFlash.prototype = new Spell();
SpellFlash.prototype.constructor = Spell;
function SpellFlash(){
	//Fires a fireball
	this.constructor();
	this.name = "Flash";
	this.stock = 10;
	this.stockMax = 10;
	this.castTime = Game.DELTASECOND * 0.3;
	this.frame = new Point(1,10);
}
SpellFlash.prototype.use = function(player){
	audio.play("spell");
	game.addObject(new EffectFlash(player.position.x,player.position.y));
	
	var area = new Line(game.camera, game.camera.add(game.resolution));
	var objs = game.overlaps(area);
	var damage = Math.floor(8 + player.stats.magic*2);
	var heal = 0;
	for(var i=0; i < objs.length; i++){
		var obj = objs[i];
		if(obj.hasModule(mod_combat) && obj.team != player.team && area.overlaps(obj.position)){
			obj.hurt(player,damage);
			heal += Math.round(damage*0.2);
			game.addObject(new EffectAbsorb(obj.position.x,obj.position.y));
		}
	}
	player.heal += heal;
}
SpellFlash.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 7,0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.stats.magic += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defenceLight += max * (0.025 + power*0.01);
		player.damageLight += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += max * (1+power);
		player.damageLight += max * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.defenceLight += max * (0.05 + power*0.02);
	}
}

SpellHeal.prototype = new Spell();
SpellHeal.prototype.constructor = Spell;
function SpellHeal(){
	//Fires a fireball
	this.constructor();
	this.name = "Heal";
	this.stock = 3;
	this.stockMax = 3;
	this.frame = new Point(2,10);
}
SpellHeal.prototype.canCast = function(player){
	return player.life < player.lifeMax;
}
SpellHeal.prototype.use = function(player){
	var heal = Math.floor(8 + player.stats.magic*3);
	player.heal += heal;
}
SpellHeal.prototype.modifyStats = function(player, type, power){
	var max = this.stockMax;
	if(type == Spell.SLOTTYPE_NORMAL){
		player.defencePhysical += max * (0.015 + power*0.005);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defenceFire += max * (0.015 + power*0.005);
		player.defenceSlime += max * (0.015 + power*0.005);
		player.defenceIce += max * (0.015 + power*0.005);
		player.defenceLight += max * (0.015 + power*0.005);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += max * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.slowWound += max * (0.05 + power*0.25);
	}
}

SpellPurify.prototype = new Spell();
SpellPurify.prototype.constructor = Spell;
function SpellPurify(){
	//Fires a fireball
	this.constructor();
	this.name = "Purify";
	this.stock = 6;
	this.stockMax = 6;
	this.frame = new Point(3,10);
}
SpellPurify.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i].negative){
			return true;
		}
	}
	return false;
}
SpellPurify.prototype.use = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i].negative){
			player.buffs[i].time = 0;
		}
	}
}
SpellPurify.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 3, 0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.perks.poisonResist += max * (0.05 + power * 0.02);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.perks.poisonResist += max * (0.05 + power * 0.02);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += max * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.poisonResist += max * (0.05 + power * 0.02);
	}
}

SpellShield.prototype = new Spell();
SpellShield.prototype.constructor = Spell;
function SpellShield(){
	//Fires a fireball
	this.constructor();
	this.name = "Purify";
	this.stock = 3;
	this.stockMax = 3;
	this.frame = new Point(4,10);
}
SpellShield.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffMagicShield){
			return false;
		}
	}
	return true;
}
SpellShield.prototype.use = function(player){
	var buff = new BuffMagicShield();
	buff.absorb = Math.min((player.stats.magic-1) * 0.05, 0.45);
	player.addBuff(buff)
	audio.play("spell");
}
SpellShield.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 0, 0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.stats.magic += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defenceLight += max * (0.025 + power*0.01);
		player.damageLight += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.damageLight += max * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.defenceLight += max * (0.05 + power*0.02);
	}
}

SpellStrength.prototype = new Spell();
SpellStrength.prototype.constructor = Spell;
function SpellStrength(){
	//Fires a fireball
	this.constructor();
	this.name = "Strength";
	this.stock = 5;
	this.stockMax = 5;
	this.frame = new Point(5,10);
}
SpellStrength.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffStrength){
			return false;
		}
	}
	return true
}
SpellStrength.prototype.use = function(player){
	var buff = new BuffStrength();
	buff.multiplier = Math.min(1.25 + (player.stats.magic-1) * 0.1, 2.5);
	player.addBuff(buff)
	audio.play("spell");
}
SpellStrength.prototype.modifyStats = function(player, type, power){
	var max = Math.max(this.stockMax - 2, 0);
	if(type == Spell.SLOTTYPE_NORMAL){
		player.stats.attack += max * 2 * (1+power);
	} else if(type == Spell.SLOTTYPE_ELEMENT) {
		player.defencePhysical += max * (0.0125 + power*0.005);
		player.stats.attack += max * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.thorns += max * (0.10 + power * 0.04);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.defencePhysical += max * (0.025 + power*0.01);
	}
}