function Spell(){
	this.name = "Spell";
	this.stock = 10;
	this.stockMax = 10;
	this.frame = new Point(0,10);
}
Spell.prototype.use = function(player){}
Spell.prototype.modifyStats = function(player, type){}
Spell.prototype.render = function(g,p){
	g.renderSprite("items",p,10,this.frame);
}

SpellFire.prototype = new Spell();
SpellFire.prototype.constructor = Spell;
function SpellFire(){
	//Fires a fireball
	this.constructor();
	this.name = "Fireball";
	this.stock = 10;
	this.stockMax = 10;
	this.frame = new Point(0,10);
}
SpellFire.prototype.use = function(player){
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	var bullet = new Bullet(player.position.x, player.position.y, (player.flip?-1:1));
	bullet.team = 1;
	bullet.frames = [5,6,7];
	bullet.frame.y = 1;
	bullet.blockable = 0;
	bullet.ignoreInvincibility = true;
	bullet.damage = 9 + player.stats.magic * 4;
	bullet.explode = true;
	game.addObject(bullet);
}
SpellFire.prototype.modifyStats = function(player, type){
	var max = Math.max(this.stock - 7,0);
	if(type == ShieldSmith.SLOT_NORMAL_LOW){
		player.stats.attack += max;
	} else if(type == ShieldSmith.SLOT_NORMAL_MID) {
		player.stats.attack += max * 2;
	} else if(type == ShieldSmith.SLOT_NORMAL_HIG) {
		player.stats.attack += max * 3;
	} else if(type == ShieldSmith.SLOT_ELEMENT_LOW) {
		player.defenceFire += max * 0.05;
	} else if(type == ShieldSmith.SLOT_ELEMENT_MID) {
		player.defenceFire += max * 0.07;
	} else if(type == ShieldSmith.SLOT_ELEMENT_HIG) {
		player.defenceFire += max * 0.09;
	} else if(type == ShieldSmith.SLOT_ATTACK_LOW) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_MID) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_HIG) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_LOW) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_MID) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_HIG) {
		
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
SpellFlash.prototype.modifyStats = function(player, type){
	var max = Math.max(this.stock - 7,0);
	if(type == ShieldSmith.SLOT_NORMAL_LOW){
		player.stats.magic += max;
	} else if(type == ShieldSmith.SLOT_NORMAL_MID) {
		player.stats.magic += max * 2;
	} else if(type == ShieldSmith.SLOT_NORMAL_HIG) {
		player.stats.magic += max * 3;
	} else if(type == ShieldSmith.SLOT_ELEMENT_LOW) {
		player.perks.slowWound += max * 0.1;
	} else if(type == ShieldSmith.SLOT_ELEMENT_MID) {
		player.stats.magic += max * 0.5;
		player.perks.slowWound += max * 0.15;
	} else if(type == ShieldSmith.SLOT_ELEMENT_HIG) {
		player.stats.magic += max * 1;
		player.perks.slowWound += max * 0.2;
	} else if(type == ShieldSmith.SLOT_ATTACK_LOW) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_MID) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_HIG) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_LOW) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_MID) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_HIG) {
		
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
SpellHeal.prototype.use = function(player){
	var heal = Math.floor(8 + player.stats.magic*3);
	player.heal += heal;
}
SpellHeal.prototype.modifyStats = function(player, type){
	if(type == ShieldSmith.SLOT_NORMAL_LOW){
		player.defencePhysical += this.stockMax * 0.015;
	} else if(type == ShieldSmith.SLOT_NORMAL_MID) {
		player.defencePhysical += this.stockMax * 0.03;
	} else if(type == ShieldSmith.SLOT_NORMAL_HIG) {
		player.defencePhysical += this.stockMax * 0.06;
	} else if(type == ShieldSmith.SLOT_ELEMENT_LOW) {
		player.defenceFire += this.stockMax * 0.02;
		player.defenceSlime += this.stockMax * 0.02;
		player.defenceIce += this.stockMax * 0.02;
		player.defenceLight += this.stockMax * 0.02;
	} else if(type == ShieldSmith.SLOT_ELEMENT_MID) {
		player.defenceFire += this.stockMax * 0.03;
		player.defenceSlime += this.stockMax * 0.03;
		player.defenceIce += this.stockMax * 0.03;
		player.defenceLight += this.stockMax * 0.03;
	} else if(type == ShieldSmith.SLOT_ELEMENT_HIG) {
		player.defenceFire += this.stockMax * 0.04;
		player.defenceSlime += this.stockMax * 0.04;
		player.defenceIce += this.stockMax * 0.04;
		player.defenceLight += this.stockMax * 0.04;
	} else if(type == ShieldSmith.SLOT_ATTACK_LOW) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_MID) {
		
	} else if(type == ShieldSmith.SLOT_ATTACK_HIG) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_LOW) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_MID) {
		
	} else if(type == ShieldSmith.SLOT_DEFENCE_HIG) {
		
	}
}



spell_heal = function(player){
	//Heas player
	var cost = 12;
	if(player.mana < cost || player.life >= player.lifeMax){
		audio.play("negative");
		return 0;
	}
	
	var heal = Math.floor(8 + player.stats.magic*3);
	player.heal += heal;
	
	return cost;
}

spell_purify = function(player){
	//removes all debuffs
	var cost = 3;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	var used = false;
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i].negative){
			used = true;
			player.buffs[i].time = 0;
		}
	}
	
	if(used){
		audio.play("spell");
		return cost;
	} else {
		audio.play("negative");
		return 0;
	}
}

spell_shield = function(player){
	//removes all debuffs
	var cost = 0;
	
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffMagicShield){
			audio.play("negative");
			return 0;
		}
	}
	var buff = new BuffMagicShield();
	buff.absorb = Math.min((player.stats.magic-1) * 0.05, 0.45);
	player.addBuff(buff)
	audio.play("spell");
	
	return cost;
}

spell_strength = function(player){
	//removes all debuffs
	var cost = 16;
	
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffStrength){
			audio.play("negative");
			return 0;
		}
	}
	var buff = new BuffStrength();
	buff.multiplier = Math.min(1.25 + (player.stats.magic-1) * 0.1, 2.5);
	player.addBuff(buff)
	audio.play("spell");
	
	return cost;
}