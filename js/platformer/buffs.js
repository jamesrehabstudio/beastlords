function Buff(){
	this.time = Game.DELTASECOND;
	this.negative = false;
	this.user = null;
}

//Positive

BuffStrength.prototype = new Buff();
BuffStrength.prototype.constructor = Buff;
function BuffStrength(){
	this.constructor();
	this.negative = false;
	this.additional = 0;
	this.multiplier = 1.5;
	this.time = Game.DELTASECOND * 45;
}
BuffStrength.prototype.prehurt_other = function(damage, target){
	return damage * this.multiplier + this.additional;
}
BuffStrength.prototype.render = function(g,c){
	if(this.user instanceof Player){
		this.user.renderWeapon(g,c,{
			"shader":"item",
			"u_frameSize" : [32,64],
			"u_pixelSize" : 256,
			"u_color":[1.0,0.5,0.0,1.0]
		});
	}
	return g;
}

BuffFireDamage.prototype = new Buff();
BuffFireDamage.prototype.constructor = Buff;
function BuffFireDamage(){
	this.constructor();
	this.negative = false;
	this.damage = 5;
	this.time = Game.DELTASECOND * 45;
}
BuffFireDamage.prototype.prehurt_other = function(damage, target){
	return damage + this.damage;
}
BuffFireDamage.prototype.blocked = function(damage, target){
	target.life -= this.damage;
	target.displayDamage(this.damage);
	target.isDead();
	return damage;
}
BuffFireDamage.prototype.render = function(g,c){
	this.user.renderWeapon(g,c,null,{
		"shader":"item",
		"u_frameSize" : [112,48],
		"u_pixelSize" : 256,
		"u_color":[1.0,0.5,0.0,1.0]
	});
	return g;
}

BuffMagicShield.prototype = new Buff();
BuffMagicShield.prototype.constructor = Buff;
function BuffMagicShield(){
	this.constructor();
	this.negative = false;
	this.absorb = 0.2;
	this.time = Game.DELTASECOND * 120;
}
BuffMagicShield.prototype.hurt = function(damage, attacker){
	if(this.user instanceof Player){
		var maxreduction = this.user.mana * (1 + this.absorb);
		if(damage > maxreduction){
			this.user.mana = 0;
			damage = Math.floor(Math.max(damage - this.user.mana * (1+this.absorb),0));
			this.time = 0;
		} else {
			this.user.mana = Math.floor(Math.max(this.user.mana - damage * (1-this.absorb),0));
			damage = 0;
			audio.play("barrier",this.user.position);
		}
	}
	return damage;
}
BuffMagicShield.prototype.render = function(g,c){
	g.renderSprite(
		this.user.sprite,
		this.user.position.subtract(c),
		this.user.zIndex,
		this.user.frame,
		this.user.flip,
		{
			"shader":"item",
			"u_frameSize" : [64,64],
			"u_pixelSize" : 1024,
			"u_color":[0.5,0.8,1.0,1.0]
		}
	)
	return g;
}

BuffLifeleech.prototype = new Buff();
BuffLifeleech.prototype.constructor = Buff;
function BuffLifeleech(){
	this.constructor();
	this.negative = false;
	this.percentage = 0.05;
	this.time = Game.DELTASECOND * 5;
}
BuffLifeleech.prototype.hurt_other = function(damage, target){
	var finalDamage = Math.max(Math.min(target.life+damage,damage),0);
	var l = Math.floor(finalDamage * this.percentage);
	this.user.life = Math.min(this.user.life + l, this.user.lifeMax);
	return damage;
}

//Debuffs

BuffPoison.prototype = new Buff();
BuffPoison.prototype.constructor = Buff;
function BuffPoison(){
	this.constructor();
	this.negative = true;
	this.speed = Game.DELTASECOND * 1.0;
	this.time = Game.DELTASECOND * 12;
	this.damage = 1;
}
BuffPoison.prototype.update = function(){
	if(Timer.interval(this.time,this.speed,game.delta)){
		var c = this.user.corners();
		var pos = new Point(c.left + Math.random()*this.user.width, c.top + Math.random()*this.user.height);
		var effect = new EffectStatus(pos.x,pos.y);
		effect.frame.x = 1;
		game.addObject(effect);
		
		this.user.displayDamage(this.damage);
		this.user.life -= this.damage;
		this.user.isDead();
	}
}