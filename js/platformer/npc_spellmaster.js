SpellMaster.prototype = new GameObject();
SpellMaster.prototype.constructor = GameObject;
function SpellMaster(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "prisoner";
	
	this.frame.x = 3;
	this.frame.y = 0;
	
	this.width = 32;
	this.height = 40;
	
	this.cursorSpell = 0;
	
	this.addModule( mod_talk );
	this.on("open", function(){
		game.pause = true;
		this.cursorSpell = 0;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}



SpellMaster.prototype.update = function(){
	if( this.open ) {
		
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
			if(spell && spell.upgradePrice() <= _player.money){
				//Upgrade spell
				_player.money -= spell.upgradePrice();
				spell.stock++;
				spell.stockMax++;
				_player.equip();
				
				audio.play("item1");
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
	}
}

SpellMaster.prototype.hudrender = function(g,c){
	if(this.open){
		var pos = new Point(Math.floor(game.resolution.x/2)-112,8);
		
		boxArea(g,pos.x,pos.y,224,224);
		textArea(g,"Increase Spells",pos.x+20,pos.y+12);
		
		for(var i=0; i < _player.spells.length; i++){
			var spell = _player.spells[i];
			spell.render(g, new Point(pos.x+24, pos.y+36+i*20));
			textArea(g,""+spell.stockMax, pos.x+40,pos.y+32+i*20);
			//textArea(g,spell.name, pos.x+72,pos.y+32+i*20);
			textArea(g,"$"+spell.upgradePrice(), pos.x+72,pos.y+32+i*20);
		}
		
		g.color = [1,1,1,1];
		g.scaleFillRect(pos.x+10,pos.y+34+this.cursorSpell*20,4,4);
	}
}