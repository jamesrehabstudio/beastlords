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
	for(var i in player.statusEffects){
		if(player.statusEffects[i] > 0){
			used = true;
			player.statusEffects[i] = 0.0;
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

spell_teleport = function(player){
	//removes all debuffs
	var cost = 12;
	
	var marker = game.getObject(TeleMarker);
	if(marker instanceof TeleMarker){
		player.position.x = marker.position.x;
		player.position.y = marker.position.y;
		marker.destroy();
		return 0;
	} else {
		if(player.mana < cost){
			audio.play("negative");
			return 0;
		}
		game.addObject(new TeleMarker(player.position.x, player.position.y, player));
	}
	
	return cost;
}