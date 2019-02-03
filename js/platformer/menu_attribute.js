AttributeMenu = {
	"cursor" : 0,
	"cursorSlot" : 0,
	"cursorMagic" : 0,
	"cursorEquip" : 0,
	"testPlayer" : false,
	"spellMenuOpen" : false,
	"weaponMenuOpen" : false,
	"weaponList" : false,
	"shieldList" : false,
	"update" : function(){
		if(this.spellMenuOpen){
			if(input.state("jump")==1){
				this.spellMenuOpen = false;
			} else if(input.state("fire")==1){
				if(_player.shieldSlots[this.cursorSlot] == _player.spells[this.cursorMagic]){
					_player.shieldSlots[this.cursorSlot] = undefined;
					_player.equip();
					audio.play("equip");
					this.spellMenuOpen = false;
				} else {
					var usedIndex = _player.shieldSlots.indexOf(_player.spells[this.cursorMagic]);
					if(usedIndex >= 0){
						_player.shieldSlots[usedIndex] = undefined;
					}
					_player.shieldSlots[this.cursorSlot] = _player.spells[this.cursorMagic];
					_player.equip();
					audio.play("equip");
					this.spellMenuOpen = false;
				} 
			} else if(input.state("up")==1){
				this.cursorMagic = Math.max(this.cursorMagic-1, 0);
				audio.play("cursor");
			} else if( input.state("down")==1){
				this.cursorMagic = Math.min(this.cursorMagic+1, _player.spells.length-1);
				audio.play("cursor");
			}
			
			this.testPlayer = this.createTestPlayer();
			var cursorSpell = _player.spells[this.cursorMagic];
			var spellsCurrentOccupation = _player.shieldSlots.indexOf(cursorSpell);
			if(spellsCurrentOccupation >= 0 ){ this.testPlayer.shieldSlots[spellsCurrentOccupation] = undefined; }
			this.testPlayer.shieldSlots[this.cursorSlot] = cursorSpell;
			if(cursorSpell == this.testPlayer.shieldSlots[this.cursorSlot]){ this.testPlayer.shieldSlots[spellsCurrentOccupation] = undefined; }
			Player.prototype.equip.apply(this.testPlayer);
		} else if(this.weaponMenuOpen) {
			var currentSword = this.weaponList[this.cursorEquip];
			if(input.state("jump") == 1){
				this.weaponMenuOpen = false;
			} else if(input.state("fire") == 1){
				_player.equip(currentSword, _player.equip_shield);
				audio.play("equip");
				this.weaponMenuOpen = false;
			} else if(input.state("up") == 1){
				this.cursorEquip = Math.max(this.cursorEquip-1, 0);
				audio.play("cursor");
			} else if(input.state("down") == 1){
				this.cursorEquip = Math.min(this.cursorEquip+1, this.weaponList.length-1);
				audio.play("cursor");
			}
			this.testPlayer = this.createTestPlayer();
			this.testPlayer.equip_sword = currentSword;
			Player.prototype.equip.apply(this.testPlayer);
			
		} else {
			if(this.cursor == 0){
				if(input.state("fire")==1){
					this.weaponList = this.createWeaponList();
					this.weaponMenuOpen = true;
					this.cursorEquip = 0;
					audio.play("pause");
				}
			} else if(this.cursor == 1){
			} else if(this.cursor >= 2){
				if(input.state("fire")==1){
					this.spellMenuOpen = true;
					this.cursorSlot = this.cursor - 2;
					this.cursorMagic = Math.max(_player.spells.indexOf(_player.shieldSlots[this.cursorSlot]),0);
					audio.play("pause");
				} /*else if(input.state("left")==1){
					this.cursorSlot = Math.max(this.cursorSlot-1, 0);
					audio.play("cursor");
				} else if( input.state("right")==1){
					this.cursorSlot = Math.min(this.cursorSlot+1, _player.equip_shield.slots.length-1);
					audio.play("cursor");
				}*/
			}
			if(input.state("up") == 1){
				this.cursor = Math.max(this.cursor-1,0);
				audio.play("cursor");
			} else if(input.state("down") == 1){
				this.cursor = Math.min(this.cursor+1,4);
				audio.play("cursor");
			}
			this.testPlayer = false;
		}
	},
	"close" : function(){
		this.spellMenuOpen = false;
		this.weaponMenuOpen = false;
		this.testPlayer = false;
		this.weaponList = false;
		this.shieldList = false;
		this.cursor = 0;
		this.cursorMagic = 0;
		this.cursorSlot = 0;
	},
	"render" : function(g,c){
		var pos = new Point(Math.floor(game.resolution.x/2)-112,8);
		
		if(this.spellMenuOpen || this.weaponMenuOpen){
			var pos = new Point(Math.floor(game.resolution.x/2)-168,8);
		}
		
		this.renderWindow(g, pos, this.testPlayer);
		
		if(this.spellMenuOpen){
			this.renderSpellSelect(g,pos);
		} else if(this.weaponMenuOpen){
			this.renderWeaponSelect(g,pos);
		}
		
		textArea(g,"@", pos.x+20,148+this.cursor*14);
		/*
		if(this.cursor == 0){
			textArea(g,"@", pos.x+20,156+this.cursor*14);
		} else if(this.cursor == 1){
			textArea(g,"@", pos.x+20,168);
		} else {
			cursorArea(g, pos.x+12+this.cursorSlot*32, 224-36,32,32);
		}
		*/
	},
	"renderSpellSelect" : function(g,c){
		boxArea(g,c.x+224,8,112,224);
		for(var i=0; i < _player.spells.length; i++){
			var spell = _player.spells[i];
			g.renderSprite("items",new Point(c.x+244,28+i*20),1,spell.frame);
			textArea(g,"Lv."+spell.level, c.x+260,24+i*20);
		}
		g.color = [1,1,1,1];
		g.drawRect(c.x+234,26+this.cursorMagic*20,4,4,1);
	},
	"renderWeaponSelect" : function(g,c){
		boxArea(g,c.x+224,8,112,224);
		for(var i=0; i < this.weaponList.length; i++){
			var weapon = this.weaponList[i];
			g.renderSprite("items",new Point(c.x+244,28+i*20),1,weapon.icon);
			textArea(g,weapon.name, c.x+260,24+i*20);
		}
		g.color = [1,1,1,1];
		g.drawRect(c.x+234,26+this.cursorEquip*20,4,4,1);
	},
	"renderWindow" : function(g,c,testPlayer){
		var padding = 20;
		var statX = 64;
				
		boxArea(g,c.x,c.y,224,224);
		
		textArea(g,"Attributes",c.x+64,c.y+12);
		
		//textArea(g,"Points: "+_player.stat_points ,c.x+20,36);
		var attributeY = c.y+28;
		
		//Quick function for rendering stats
		var r = function(g,x,y,player,vfunc,rightAlign=false){
			var origVal = vfunc(_player);
			
			if(origVal >= 10 && rightAlign){x -= 8;}
			
			if(!player){
				textArea(g,""+origVal, x,y);
			} else {
				var sval = "" + vfunc(player);
				var val = Number.parseInt(sval);
				var xoff = 8 * (sval.length);
				origVal = Number.parseInt(origVal);
				textArea(g,sval, x,y);
				if(val > origVal){
					g.renderSprite("text",new Point(x+xoff,y),999,new Point(6,6));
				} else if(val < origVal){
					g.renderSprite("text",new Point(x+xoff,y),999,new Point(7,6));
				}
			}
		}
		
		//Level
		textArea(g,"Level:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.level;});
		attributeY += 16;
		
		//Damage
		textArea(g,"Damage:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.damage + p.damageFire + p.damageSlime + p.damageIce + p.damageLight;});
		attributeY += 12;
		
		/*
		//Physical
		textArea(g,"P", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.damage);});
		
		//Ice
		textArea(g,"I", c.x+padding+32,attributeY);
		r(g,c.x+padding+40,attributeY,testPlayer,function(p){return Math.floor(p.damageIce);});
		
		//Slime
		textArea(g,"S", c.x+padding+64,attributeY);
		r(g,c.x+padding+72,attributeY,testPlayer,function(p){return Math.floor(p.damageSlime);});
		
		
		attributeY += 12;
		
		//Fire
		textArea(g,"F", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.damageFire);});
		
		//Light
		textArea(g,"L", c.x+padding+32,attributeY);
		r(g,c.x+padding+40,attributeY,testPlayer,function(p){return Math.floor(p.damageLight);});
		
		attributeY += 16;
		*/
		
		
		textArea(g,"Defence", c.x+padding,attributeY);
		attributeY += 12;
		
		//Physical
		g.renderSprite("attrib_icons",new Point(c.x+padding,attributeY),0,new Point(0,2));
		r(g,c.x+padding+8,attributeY+12,testPlayer,function(p){return Math.floor(p.defencePhysical)+"";},true);
		
		//Ice
		g.renderSprite("attrib_icons",new Point(c.x+padding+20,attributeY),0,new Point(3,2));
		r(g,c.x+padding+28,attributeY+12,testPlayer,function(p){return Math.floor(p.defenceIce)+"";},true);
		
		//Slime
		g.renderSprite("attrib_icons",new Point(c.x+padding+40,attributeY),0,new Point(2,2));
		r(g,c.x+padding+48,attributeY+12,testPlayer,function(p){return Math.floor(p.defenceSlime)+"";},true);
		
		//Fire
		g.renderSprite("attrib_icons",new Point(c.x+padding+60,attributeY),0,new Point(1,2));
		r(g,c.x+padding+68,attributeY+12,testPlayer,function(p){return Math.floor(p.defenceFire)+"";},true);
		
		//Light
		g.renderSprite("attrib_icons",new Point(c.x+padding+80,attributeY),0,new Point(4,2));
		r(g,c.x+padding+88,attributeY+12,testPlayer,function(p){return Math.floor(p.defenceLight)+"";},true);
		
		attributeY += 32;
		
		//attack
		textArea(g,"Attack:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.attack;});
		attributeY += 12;
		
		//magic
		textArea(g,"Defence:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.defence;});
		attributeY += 12;
		
		//magic
		textArea(g,"Magic:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.magic;});
		
		attributeY += 16;
		
		//Weapon
		var weapon = _player.equip_sword;
		g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(0,0));
		g.renderSprite("items",new Point(c.x+padding+16,attributeY+4),20,weapon.icon);
		textArea(g,weapon.name, c.x+24+padding,attributeY);
		attributeY += 14;
		
		//Shield
		var shield = _player.equip_shield;
		g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(1,0));
		if(shield){
			g.renderSprite(shield.sprite,new Point(c.x+padding+16,attributeY+4),20,shield.frame);
			textArea(g,shield.name, c.x+24+padding,attributeY);
		}
		attributeY += 14;
		
		//Shield slots
		//for(var i=0; i < _player.equip_shield.slots.length; i++){
		for(var i=0; i < 3; i++){
			//var slotType = _player.equip_shield.slots[i];
			g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(i,1));
			//g.renderSprite("shieldslots",new Point(8+c.x+padding+i*32,c.y+196),1,ShieldSmith.SLOT_FRAME[slotType]);
			//g.renderSprite("shieldslots",new Point(c.x+padding+16,attributeY+4),20,ShieldSmith.SLOT_FRAME[slotType]);
			
			if(i < _player.shieldSlots.length){
				if(_player.shieldSlots[i] instanceof Spell){
					_player.shieldSlots[i].render(g,new Point(c.x+padding+16,attributeY+4));
				}
			}
			attributeY += 14;
		}
		
		
		
		//Render perks
		attributeY = c.y+28;
		for(var i in _player.perks){
			if(_player.perks[i] || (testPlayer && testPlayer.perks[i])){
				textArea(g,i.slice(0,8), c.x+112,attributeY);
				//textArea(g,""+Math.floor(_player.perks[i]*100), c.x+192,attributeY);
				r(g,c.x+184,attributeY,testPlayer,function(p){return Math.floor(p.perks[i]*100);});
				
				attributeY += 12;
			}
		}
		
		/*
		
		*/
	},
	"createTestPlayer" : function(){
		var output = {
			"level" : _player.level,
			"baseStats" : {},
			"stats" : {},
			"equip_sword" : _player.equip_sword,
			"equip_shield" : _player.equip_shield,
			"perks" : {},
			"shieldSlots" : []
		}
		
		for(var i=0; i < _player.shieldSlots.length; i++){
			output.shieldSlots.push(_player.shieldSlots[i]);
		}
		for(perk in _player.perks){
			output.perks[perk] = 0.0;
		}
		for(stat in _player.baseStats){
			output.baseStats[stat] = _player.baseStats[stat];
			output.stats[stat] = 0;
		}
		return output;
	},
	"createWeaponList" : function(){
		NPC.set("short_sword", 1);
		out = [];
		//for(var i=0; i < this.weapons.length; i++){
		for(var i in WeaponList){
			if(NPC.get(i)){
				out.push(WeaponList[i]);
			}
		}
		return out;
	},
	"shields" : ["small_shield", "large_shield", "kite_shield", "broad_shield", "knight_shield", "spiked_shield", "heavy_shield", "tower_shield"]
}