spell_fire = function(player){
	//Fires a fireball
	var cost = 4;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
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
	
	return cost;
}

spell_bifurcate = function(player){
	//Fires a fireball
	var cost = 24;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	audio.play("cracking");
	var bullet = new Bullet(player.position.x, player.position.y, (player.flip?-1:1));
	bullet.team = 1;
	bullet.frames = [5,6,7];
	bullet.frame_row = 1;
	bullet.on("hurt_other", function(obj){
		this.damage = Math.max(Math.floor(obj.life*0.5),1);
	});
	
	if(player.states.duck){
		bullet.position.y += 8;
	} else {
		bullet.position.y -= 8;
	}
	
	game.addObject(bullet);
	
	return cost;
}

spell_flash = function(player){
	//Fires a fireball
	var cost = 16;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
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
	
	return cost;
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