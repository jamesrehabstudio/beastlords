DebugeMenu = {
	"cursor" : 0,
	"cursorItems" : 14,
	"update" : function(){
		if( input.state("up") == 1 ) { 
			this.cursor = (this.cursor > 0) ? this.cursor - 1 : (this.cursorItems - 1); 
			audio.play("cursor"); 
		}
		if( input.state("down") == 1 ) { 
			this.cursor = (this.cursor + 1) % this.cursorItems; 
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				_player.lightRadius = !_player.lightRadius;
			} else if(this.cursor == 1){
				_player.downstab = !_player.downstab;
			} else if(this.cursor == 2){
				_player.doubleJump = !_player.doubleJump;
			} else if(this.cursor == 3){
				_player.walljump = !_player.walljump;
			} else if(this.cursor == 4){
				_player.dodgeFlash = !_player.dodgeFlash;
			} else if(this.cursor == 5){
				_player.lifeMax += 6;
				_player.life += 6;
			} else if(this.cursor >= 6){
				var spellName = Spell.NAMES[this.cursor-6];
				let spell = _player.spells.find(function(a){ return a.objectName == spellName; });
				if(spell){
					spell.level += 1;
				} else {
					_player.spells.push( new self[spellName]() );
				}
			}
		}
		if( input.state("jump") == 1) {
			if(this.cursor == 5){
				_player.lifeMax = Math.max(_player.lifeMax-6, 6);
				_player.life = Math.min(_player.life, _player.lifeMax);
			} else if(this.cursor >= 6){
				var spellName = Spell.NAMES[this.cursor-6];
				let spell = _player.spells.find(function(a){ return a.objectName == spellName; });
				if(spell){
					if(spell.level > 1){
						spell.level -= 1;
					} else {
						_player.spells.remove(_player.spells.indexOf(spell));
					}
				}
			}
		}
	},
	"render" : function(g,c){
			
		boxArea(g,c.x,8,224,224);
		//textArea(g,"Special Items",c.x+56,20);
		textArea(g,"Debug",c.x+92,20);
		
		textArea(g,"@",c.x+16,32+this.cursor*12);
		
		var offy = 32;
		textArea(g,"Light radius:",c.x+32,offy);
		textArea(g,""+_player.lightRadius,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Down Stab:",c.x+32,offy);
		textArea(g,""+_player.downstab,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Double Jump:",c.x+32,offy);
		textArea(g,""+_player.doubleJump,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Wall Jump:",c.x+32,offy);
		textArea(g,""+_player.walljump,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Dodge Flash:",c.x+32,offy);
		textArea(g,""+_player.dodgeFlash,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Life:",c.x+32,offy);
		Player.renderLifebar(g,c.add(new Point(80,offy-8)), _player.life, _player.lifeMax, 0);
		offy += 12;
		
		for(let i=0; i < Spell.NAMES.length; i++){
			var spellName = Spell.NAMES[i];
			let spell = _player.spells.find(function(a){return a.objectName == spellName;});
			
			textArea(g,spellName.substr(5,14),c.x+32,offy);
			
			if(spell){
				textArea(g,"Lv."+spell.level,c.x+144,offy);
			}
			offy += 12;
		}
		
		/*
		for(var i=0; i < _player.uniqueItems.length; i++){
			var y_pos = 46 + 20 * i;
			var item = _player.uniqueItems[i];
			var name = item.message;
			if(this.cursor == i){
				textArea(g,"@",c.x+16,y_pos);
			}
			g.renderSprite("items",new Point(c.x+40,y_pos+4),this.zIndex,item.frame);
			textArea(g,name,c.x+52,y_pos);
		}
		*/
	}
}