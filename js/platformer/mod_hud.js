var mod_hud = {
	"POPUP_TIME" : 4,
	"ITEM_LIST" : [
		"autodrill",
		"baseball_bat",
		"twin_blades",
		"whip",
	],
	"KEEP_VARS" : [
		"wedding_dress"
	],
	"init" : function(){
		this.hud_moneyPos = 0.0;
		this.hud_showItemPos = 0.0;
		this.hud_showItemCount = 0;
		
		this.hud_showItemPercent = true;
		
		this.on("money", function(){
			this.hud_moneyPos = mod_hud.POPUP_TIME;
		});
		this.on(["unique_item_get","weapon_get"], function(item){			
			let prevCount = this.hud_showItemCount;
			
			mod_hud.countItems.apply(this);
			
			if(this.hud_showItemCount > prevCount && this.hud_showItemPercent){
				this.hud_showItemPos = mod_hud.POPUP_TIME;
			}
		});
	},
	"countItems" : function(){
		let count = 0;
		for(let i=0; i < mod_hud.ITEM_LIST.length; i++){
			if(NPC.get(mod_hud.ITEM_LIST[i])){
				count++;
			}
		}
		this.hud_showItemCount = count;
	},
	"renderLifebar" : function(g,c, life, max, buffer){
		/* Render HP */
		let scale = 1.0;
		life *= scale;
		max *= scale;
		buffer *= scale;
		
		g.color = [1.0,1.0,1.0,1.0];
		g.drawRect(c.x-1,c.y-1,(max)+2,10,1);
		g.color = [0.0,0.0,0.0,1.0];
		g.drawRect(c.x,c.y,max,8,2);
		g.color = [1.0,0.0,0.0,1.0];
		g.drawRect(c.x,c.y,Math.max(life,0),8,3);
		
		/* Render Buffered Damage */
		if(life > 0){
			g.color = [0.65,0.0625,0.0,1.0];
			g.scaleFillRect(
				Math.max(life,0)+c.y,
				c.y,
				-Math.min(buffer,life),
				8
			);
		}
	},
	"renderManabar" : function(g,c, mana, max){
		/* Render Mana */
		g.color = [1.0,1.0,1.0,1.0];
		g.drawRect(c.x-1,c.y-1,max+2,4,1);
		g.color = [0.0,0.0,0.0,1.0];
		g.drawRect(c.x,c.y,max,2,2);
		g.color = [0.23,0.73,0.98,1.0];
		g.drawRect(c.x,c.y,mana,2,3);
	},
	"hudrender" : function(g,c){
		/* Frame rate */
		if(PauseMenu.useDebug) { textArea(g, "CPU: "+Math.floor(1 / game.deltaUnscaled), 32, 0); }
		
		/* Render HP */
		mod_hud.renderLifebar(g,new Point(8,8),this.life, this.lifeMax, this.states.damageBuffer);
		
		/* Render Mana */
		mod_hud.renderManabar(g,new Point(8,20),this.mana, this.manaMax);
		
		/* Render EXP */
		let xp = Math.clamp01( (this.experience - this.nextLevelCost(this.level-1)) / (this.nextLevelCost(this.level) - this.nextLevelCost(this.level-1)) );
		
		g.color = [1.0,1.0,1.0,1.0];
		g.drawRect(7,25,26,4,1);
		g.color = [0.0,0.0,0.0,1.0];
		g.drawRect(8,26,24,2,2);
		g.color = [1.0,1.0,1.0,1.0];
		g.drawRect(8,26,Math.floor(24*xp),2,3);
		
		let sideNotifcationOffset = 228;
		
		if(this.hud_moneyPos > 0){
			this.hud_moneyPos -= this.delta;
			let d = this.hud_moneyPos / mod_hud.POPUP_TIME;
			let pos = Math.lerp(-128, 8, Math.clamp01(d * 4) );
			let shake = d > 0.925 ? new Point(Math.randomRange(-1,1), Math.randomRange(-1,1) ) : new Point();
			textArea(g,"$"+this.money, pos + shake.x, sideNotifcationOffset + shake.y );
			sideNotifcationOffset -= 12;
		}
		
		if(this.hud_showItemPos > 0){
			this.hud_showItemPos -= this.delta;
			let d = this.hud_showItemPos / mod_hud.POPUP_TIME;
			let pos = Math.lerp(-128, 8, Math.clamp01(d * 4) );
			let itemcount = this.hud_showItemCount + " / " + mod_hud.ITEM_LIST.length;
			textArea(g, itemcount, pos, sideNotifcationOffset );
			sideNotifcationOffset -= 12;
			
		}
		//textArea(g,"#"+this.waystones,8, 216+12 );
		
		//Keys
		for(var i=0; i < this.keys.length; i++) {
			g.renderSprite("items", 
				new Point((game.resolution.x-33)+i*4, 40),
				this.zIndex,
				this.keys[i].frame,
				false 
			);
		}
		
		var item_pos = 20 + Math.max(this.lifeMax, this.manaMax);
		//item hud
		if(this.charm instanceof Item ){
			this.charm.position.x = this.charm.position.y = 0;
			this.charm.render(g,new Point(-item_pos,-15));
			item_pos += 20;
		}
		if(this.spells.length > 0){
			var spell = this.spells[this.spellCursor];
			var spellXOff = spell.stock >= 10 ? -8 : -3;
			spell.render(g, new Point(item_pos,15));
			//textArea(g,""+spell.stock,item_pos+spellXOff,24);
			item_pos += 20;
		}
	}
}