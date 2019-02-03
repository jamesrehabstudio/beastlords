function Spell(){
	this.name = "Spell";
	this.objectName = "Spell";
	this.level = 1;
	this.levelMax = 5;
	this.castTime = Game.DELTASECOND;
	this.refillRarity = 10.0;
	this.frame = new Point(0,10);
	this.priceBase = 7;
	this.priceExponent = 2.5;
	this.manaCost = 3;
}
Spell.prototype.use = function(player){}
Spell.prototype.modifyStats = function(player, type){}
Spell.prototype.canCast = function(player){ return true; }
Spell.prototype.upgradePrice = function(){ return Math.floor(Math.pow(this.priceBase+this.level, this.priceExponent)); }
Spell.prototype.render = function(g,p){
	g.renderSprite("items",p,10,this.frame);
}
Spell.SLOTTYPE_SPECIAL = 0;
Spell.SLOTTYPE_MAGIC = 1;
Spell.SLOTTYPE_ATTACK = 2;
Spell.SLOTTYPE_DEFENCE = 3;
Spell.NAMES = [
	"SpellFire", 
	"SpellBolt", 
	"SpellFlash", 
	"SpellHeal", 
	"SpellIce",
	"SpellShield", 
	"SpellSlimeGernade", 
	"SpellStrength"
];
/*
Spell.randomRefill = function(player, nothingchance){
	var total = nothingchance || 0.0;
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
	return null;
}
*/

SpellIce.prototype = new Spell();
SpellIce.prototype.constructor = Spell;
function SpellIce(){
	//Fires a fireball
	this.constructor();
	this.name = "Ice";
	this.objectName = "SpellIce";
	this.castTime = Game.DELTASECOND * 0.125;
	this.frame = new Point(8,11);
	this.manaCost = 5;
}
SpellIce.prototype.use = function(player){
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	//var bullet = Bullet.createFireball(player.position.x, player.position.y);
	let bullet = new IceballSpell(player.position.x, player.position.y );
	bullet.team = player.team;
	bullet.owner = player;
	bullet.damageIce = Math.floor( (4 + this.level * 4) * ( 1 + player.stats.magic / 10 ) );
	bullet.force.x = player.forward() * 8;
	return game.addObject(bullet);
}
SpellIce.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceFire += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}


SpellFire.prototype = new Spell();
SpellFire.prototype.constructor = Spell;
function SpellFire(){
	//Fires a fireball
	this.constructor();
	this.name = "Fireball";
	this.objectName = "SpellFire";
	this.castTime = Game.DELTASECOND * 0.05;
	this.frame = new Point(0,10);
}
SpellFire.prototype.use = function(player){
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	//var bullet = Bullet.createFireball(player.position.x, player.position.y);
	var bullet = new FireballSpell(player.position.x, player.position.y, 12)
	//bullet.force.x = player.flip ? -6 : 6;
	bullet.team = player.team;
	bullet.owner = player;
	bullet.damageFire = Math.floor( (4 + this.level * 4) * ( 1 + player.stats.magic / 10 ) );
	return game.addObject(bullet);
}
SpellFire.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceFire += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellBolt.prototype = new Spell();
SpellBolt.prototype.constructor = Spell;
function SpellBolt(){
	//Fires a fireball
	this.constructor();
	this.name = "Bolt";
	this.objectName = "SpellBolt";
	this.castTime = Game.DELTASECOND * 0.1;
	this.frame = new Point(7,10);
	this.manaCost = 1;
}
SpellBolt.prototype.use = function(player){
	audio.play("cracking");
	var bullet = new Bullet(player.position.x, player.position.y);
	bullet.force.x = player.forward() * 8;
	bullet.team = player.team;
	bullet.frame = new Point(1,0);
	bullet.ignoreInvincibility = true;
	bullet.damage = 0;
	bullet.damageLight = 5 + Math.floor(player.stats.magic * this.level * 0.666);
	game.addObject(bullet);
}
SpellBolt.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.perks.attackSpeed += 0.05 + 0.03 * (this.level * (1+power));
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.perks.attackSpeed += 0.05 + 0.03 * (this.level * (1+power));
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceLight += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellSlimeGernade.prototype = new Spell();
SpellSlimeGernade.prototype.constructor = Spell;
function SpellSlimeGernade(){
	//Fires a fireball
	this.constructor();
	this.name = "Slime gernade";
	this.objectName = "SpellSlimeGernade";
	this.castTime = Game.DELTASECOND * 0.15;
	this.frame = new Point(6,10);
}
SpellSlimeGernade.prototype.use = function(player){
	var nade = new Gernade(player.position.x, player.position.y);
	nade.damageSlime = 10 + player.stats.magic * this.level;
	nade.force.x = 6;
	nade.force.y = -8;
	nade.team = player.team;
	nade.force.x *= player.flip ? -1.0 : 1.0;
	game.addObject(nade);
}
SpellSlimeGernade.prototype.modifyStats = function(player, type, power){	
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.damageSlime += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.damageSlime += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 2 + Math.floor(this.level * (1.5 + power * 0.5));
		player.defenceSlime += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}


SpellFlash.prototype = new Spell();
SpellFlash.prototype.constructor = Spell;
function SpellFlash(){
	//Fires a fireball
	this.constructor();
	this.name = "Flash";
	this.objectName = "SpellFlash";
	this.castTime = Game.DELTASECOND * 0.3;
	this.manaCost = 2;
	this.frame = new Point(1,10);
}
SpellFlash.prototype.use = function(player){
	//Cast lightning
	let spell = game.addObject(new FlashSpell(player.position.x, player.position.y, player));
	spell.damageLight = Math.floor(2 + player.stats.magic * (0.8 + this.level * 0.2) );
	spell.lifeSteal = 0.2 + this.level * 0.1875;
	
}
SpellFlash.prototype.modifyStats = function(player, type, power){
	
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power) * 2;
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.perks.lifeSteal += 0.025 * this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceLight += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellHeal.prototype = new Spell();
SpellHeal.prototype.constructor = Spell;
function SpellHeal(){
	//Fires a fireball
	this.constructor();
	this.name = "Heal";
	this.objectName = "SpellHeal";
	this.manaCost = 16;
	this.frame = new Point(2,10);
	this.priceBase = 8;
	this.priceExponent = 2.7;
}
SpellHeal.prototype.canCast = function(player){
	return player.life < player.lifeMax;
}
SpellHeal.prototype.use = function(player){
	var heal = Math.floor(3 + (player.stats.magic + this.level) * 2);
	player.heal += heal;
}
SpellHeal.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.perks.slowWound += this.level * (0.05 + power * 0.05);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defenceFire += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceSlime += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceIce += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += this.level * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.perks.slowWound += this.level * (0.05 + power*0.25);
	}
}

SpellPurify.prototype = new Spell();
SpellPurify.prototype.constructor = Spell;
function SpellPurify(){
	//Fires a fireball
	this.constructor();
	this.name = "Purify";
	this.objectName = "SpellPurify";
	this.manaCost = 12;
	this.frame = new Point(3,10);
	this.priceBase = 6;
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
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.defence += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.perks.poisonResist += this.level * (0.05 + power * 0.02);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += this.level * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.poisonResist += this.level * (0.05 + power * 0.02);
	}
}

SpellShield.prototype = new Spell();
SpellShield.prototype.constructor = Spell;
function SpellShield(){
	//Fires a fireball
	this.constructor();
	this.name = "Magic Shield";
	this.objectName = "SpellShield";
	this.manaCost = 3;
	this.frame = new Point(4,10);
	this.priceBase = 9;
	this.priceExponent = 3.0;
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
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
		player.perks.manaRegen += (this.level + power) * 0.25;
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.damageLight += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.painImmune += this.level  * (1+power) * 0.2;
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
	}
}

SpellStrength.prototype = new Spell();
SpellStrength.prototype.constructor = Spell;
function SpellStrength(){
	//Fires a fireball
	this.constructor();
	this.name = "Strength";
	this.objectName = "SpellStrength";
	this.manaCost = 16;
	this.frame = new Point(5,10);
	this.priceBase = 8;
	this.priceExponent = 3.0;
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
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * 2 * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defencePhysical += this.level * (0.0125 + power*0.005);
		player.stats.attack += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * 2 * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.thorns += this.level * (0.10 + power * 0.04);
	}
}
