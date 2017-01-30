ShieldSmith.prototype = new GameObject();
ShieldSmith.prototype.constructor = GameObject;
function ShieldSmith(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "npc_smith";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = this.height = 48;
	
	this.cursorSlot = 0;
	this.cursorMagic = 0;
	this.animationProgress = 0.0;
	this.menuOpen = true;
	this.spellMenuOpen = false;
	
	this.addModule( mod_talk );
	this.text = i18n("smith_intro");
	
	
	this.on("open", function(){
		game.pause = true;
		
		this.cursorSlot = 0;
		this.cursorMagic = 0;
		this.spellMenuOpen = false;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}



ShieldSmith.prototype.update = function(){
	if( this.open ) {
		
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

		} else {
			if(input.state("jump")==1){
				this.close();
			} else if(input.state("fire")==1){
				this.spellMenuOpen = true;
				this.cursorMagic = Math.max(_player.spells.indexOf(_player.shieldSlots[this.cursorSlot]),0);
				audio.play("pause");
			} else if(input.state("left")==1){
				this.cursorSlot = Math.max(this.cursorSlot-1, 0);
				audio.play("cursor");
			} else if( input.state("right")==1){
				this.cursorSlot = Math.min(this.cursorSlot+1, _player.equip_shield.slots.length-1);
				audio.play("cursor");
			}
		}
		
		if(PauseMenu.open){
			this.close();
		}
	}
	
	this.animationProgress = (this.animationProgress + (this.delta / Game.DELTASECOND)) % 1.0;
	this.frame = ShieldSmith.anim.frame(this.animationProgress);
}

ShieldSmith.prototype.isSpellUsed = function(s){
	return _player.shieldSlots.indexOf(s) >= 0;
}

ShieldSmith.prototype.hudrender = function(g,c){
	if(this.open){
		var pos = new Point(Math.floor(game.resolution.x/2)-168,8);
		
		PauseMenu.renderStatsPage(g, pos);
		
		if(this.spellMenuOpen){
			boxArea(g,pos.x+224,8,112,224);
			for(var i=0; i < _player.spells.length; i++){
				var spell = _player.spells[i];
				g.renderSprite("items",new Point(pos.x+244,28+i*20),1,spell.frame);
				textArea(g,"Max: "+spell.stockMax, pos.x+260,24+i*20);
			}
			g.color = [1,1,1,1];
			g.scaleFillRect(pos.x+234,26+this.cursorMagic*20,4,4);
		}
		
		cursorArea(g, pos.x+12+this.cursorSlot*32, 224-36,32,32);
	}
}

ShieldSmith.anim = new Sequence([
	[0,0,0.5],
	[1,0,0.2],
	[2,0,0.1],
	[0,1,0.2],
	[1,1,0.1],
	[2,1,0.1],
]);

ShieldSmith.SLOT_NORMAL_LOW = 0;
ShieldSmith.SLOT_NORMAL_MID = 1;
ShieldSmith.SLOT_NORMAL_HIG = 2;

ShieldSmith.SLOT_ELEMENT_LOW = 3;
ShieldSmith.SLOT_ELEMENT_MID = 4;
ShieldSmith.SLOT_ELEMENT_HIG = 5;

ShieldSmith.SLOT_ATTACK_LOW = 6;
ShieldSmith.SLOT_ATTACK_MID = 7;
ShieldSmith.SLOT_ATTACK_HIG = 8;

ShieldSmith.SLOT_DEFENCE_LOW = 9;
ShieldSmith.SLOT_DEFENCE_MID = 10;
ShieldSmith.SLOT_DEFENCE_HIG = 11;

ShieldSmith.SLOT_FRAME = [
	new Point(0,0),
	new Point(0,1),
	new Point(0,2),
	
	new Point(1,0),
	new Point(1,1),
	new Point(1,2),
	
	new Point(2,0),
	new Point(2,1),
	new Point(2,2),
	
	new Point(3,0),
	new Point(3,1),
	new Point(3,2)
];