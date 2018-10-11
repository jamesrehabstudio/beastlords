class SpellMaster extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.sprite = "spellmaster";
		this.swrap = spriteWrap["spellmaster"];
		
		this.width = 24;
		this.height = 32;
		
		this.cursorSpell = 0;
		
		this._castUpgrade = 0.0;
		this._idleCooldown = 12.0;
		this._idleGlasses = 1.0;
		
		this.addModule( mod_talk );
		
		this.on("open", function(){
			game.pause = true;
			this.cursorSpell = 0;
			audio.play("pause");
		});
		this.on("close", function(){
			game.pause = false;
		});
		this.on(["wakeup","added"], function(){
			this.visible = this.interactive = !!NPC.get("spellmaster");
		});
	}
	update(){
		if( this._castUpgrade > 0){
			//Play casting animation
			let p = Math.clamp01( (SpellMaster.CAST_TIME - this._castUpgrade) * 0.5 );
			this.frame = this.swrap.frame("spell", p);
			this._castUpgrade -= game.deltaUnscaled;
			
		} else if( this.open ) {
			
			//Set animation to idle
			this.frame = this.swrap.frame("idle", 0 );
			this.talkMovePlayer();
			
			if(input.state("up") == 1){
				this.cursorSpell = Math.max(this.cursorSpell-1, 0);
				audio.play("cursor");
			}
			if(input.state("down") == 1){
				this.cursorSpell = Math.min(this.cursorSpell+1, _player.spells.length-1);
				audio.play("cursor");
			}
			
			if(input.state("fire") == 1){
				var spell = _player.spells[this.cursorSpell];
				if(spell && spell.upgradePrice() <= _player.money && spell.level < spell.levelMax){
					//Upgrade spell
					_player.money -= spell.upgradePrice();
					spell.level++;
					_player.equip();
					
					audio.play("item1");
					
					this._castUpgrade = SpellMaster.CAST_TIME;
				} else {
					audio.play("negative");
				}
			}
			
			if(input.state("jump") == 1){
				this.close();
			}
			if(PauseMenu.open){
				this.close();
			}
		} else {
			//Idle
			if( this._idleGlasses > 0.0 ) {
				//Fix glasses
				let p = Math.clamp01( 1 - this._idleGlasses );
				this._idleGlasses -= this.delta;
				this.frame = this.swrap.frame("glasses", p );
			} else {
				//Standing
				this.frame = this.swrap.frame("idle", Math.mod( game.timeScaled, 1.0) );
				
				this._idleCooldown -= this.delta;
				if(this._idleCooldown <= 0){
					this._idleCooldown = Math.random() * 6 + 6;
					this._idleGlasses = 1.0;
				}
			}
		}
	}
	hudrender(g,c){
		if(this.open && this._castUpgrade <= 0){
			var pos = new Point(Math.floor(game.resolution.x/2)-112,8);
			
			boxArea(g,pos.x,pos.y,224,224);
			textArea(g,"Increase Spells",pos.x+20,pos.y+12);
			
			for(var i=0; i < _player.spells.length; i++){
				var spell = _player.spells[i];
				spell.render(g, new Point(pos.x+24, pos.y+36+i*20));
				textArea(g,"Lv."+spell.level, pos.x+40,pos.y+32+i*20);
				
				if(spell.level < spell.levelMax){
					textArea(g,"$"+spell.upgradePrice(), pos.x+88,pos.y+32+i*20);
				} else {
					textArea(g,"Max", pos.x+88,pos.y+32+i*20);
				}
				//textArea(g,spell.name, pos.x+72,pos.y+32+i*20);
				
			}
			
			g.color = [1,1,1,1];
			g.scaleFillRect(pos.x+10,pos.y+34+this.cursorSpell*20,4,4);
		}
	}
}
SpellMaster.CAST_TIME = 2.0;


//The introduction version
class NPCSpellMaster extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.sprite = "spellmaster";
		this.swrap = spriteWrap["spellmaster"];
		
		this.width = d[0];
		this.height = d[1];
		
		this._phase = 0;
		this._time = 0;
		this._timeMax = 1;
		this._castUpgrade = 0.0;
		
		this._fallforce = 0.0;
		this._laddarRot = 0.0;
		this._masterPos = new Point();
		
		this.addModule( mod_talk );
		this.canOpen = false;
		
		this.visible = this.interactive = !NPC.get("spellmaster");
		
		this.on("collideObject", function(obj){
			if( this._phase == 0 && obj instanceof Player){
				this.setPhase(1);
			} 
		});
		
		this.on("open", function(){
			game.pause = true;
			this.cursorSpell = 0;
		});
		this.on("close", function(){
			game.pause = false;
		});
	}
	setPhase(i){
		this._phase = i;
		switch(this._phase){
			case 1: this._time = this._timeMax = 4.0; break;
			case 2: this._time = this._timeMax = 3.0; this._fallforce = 0.0; break;
		}
	}
	update(){
		this._time -= game.deltaUnscaled;
		let p = Math.clamp01( 1 - this._time / this._timeMax );
		
		if(this._phase == 0){
			//Idle
			this.frame = this.swrap.frame("read", Math.mod(game.timeScaled * 0.3, 1.0));
			this._masterPos.x = 0;
			this._masterPos.y = -48;
		} else if(this._phase == 1){
			//Slipping
			this.frame = this.swrap.frame("nudge", Math.clamp01(p * 3) );
			this._laddarRot = Math.lerp(0, Math.PI*0.25*p, Math.sin(p*2.5*Math.PI) );
			this._masterPos.x = Math.sin(this._laddarRot) * -96;
			this._masterPos.y = Math.cos(this._laddarRot) * -96 + 48;
			
			game.pause = this._time < this._timeMax - 0.6;
			
			if(this._time <= 0){
				_player.flip = _player.position.x + this._masterPos.x > this.position.x;
				this.setPhase(2);
			}
		} else if(this._phase == 2){
			//Falling
			this._fallforce += game.deltaUnscaled * UNITS_PER_METER;
			this._masterPos.y += this._fallforce * UNITS_PER_METER * game.deltaUnscaled;
			this._laddarRot = Math.lerp(this._laddarRot, Math.PI * 0.5, game.deltaUnscaled);
			
			if(this._masterPos.y >= 56){
				this._masterPos.y = 56;
				this.frame = this.swrap.frame("land", 0);
			}
			if(this._time <= 0){
				this.setPhase(3);
				
				DialogManager.set( i18n("npc_spellmaster_intro")[0] );
				game.pause = true
				this.open = true;
			}
		} else if(this._phase == 3){
			//Angry
			this.frame = this.swrap.frame("anger", Math.mod(game.time * 4, 1.0));
			this.talkMovePlayer(64, this.position.x + this._masterPos.x);
			
			if(!DialogManager.show){
				this.setPhase(4);
				
				DialogManager.set( i18n("npc_spellmaster_intro")[1] );
				game.pause = true
				this.open = true;
			}
		} else if(this._phase == 4){
			this.frame = this.swrap.frame("idle", Math.mod(game.time * 1, 1.0));
			
			if(!DialogManager.show){
				this.setPhase(5);
				
				DialogManager.set( i18n("npc_spellmaster_intro")[2] );
				game.pause = true
				this.open = true;
			}
		} else if(this._phase == 5){
			this.frame = this.swrap.frame("idle", Math.mod(game.time * 1, 1.0));
			
			if(!DialogManager.show){
				//Exit
				NPC.set("spellmaster", true);
				this.open = game.pause = false;
				this.interactive = this.visible = false;
				//this.setPhase(5);
			}
		}
	}
	render(g,c){
		for(let i=0; i < 8; i++){
			let offset = new Point(Math.sin(this._laddarRot), Math.cos(this._laddarRot)).scale(i*-32).subtract(new Point(0,-64));
			g.renderSprite(this.sprite, this.position.add(offset).subtract(c), this.zIndex+1, new Point(3,5), false, {
				"rotation" : this._laddarRot * -Math.rad2deg
			});
		}
		
		g.renderSprite(this.sprite, this.position.add(this._masterPos).subtract(c), this.zIndex+1, this.frame, this.flip);
	}
	hudrender(g,c){
		if(this.open){
			DialogManager.render(g);
		}
	}
}
NPCSpellMaster.CAST_TIME = 2.0;



self["SpellMaster"] = SpellMaster;
self["NPCSpellMaster"] = NPCSpellMaster;

