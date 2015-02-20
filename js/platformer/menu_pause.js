PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.cursor = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
}
PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){
	if( this.open ) {
		game.pause = true;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				dataManager.reset();
				dataManager.randomLevel(game,0);
			}
		} else if( this.page == 0 ) {
			//Equipment page
			if( input.state("left") == 1 ) { this.cursor--; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.cursor++; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.cursor-=4; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=4; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, _player.equipment.length -1 ), 0 );
			
			if( input.state("fire") == 1 ) {
				var item = _player.equipment[this.cursor];
				audio.play("equip");
				if( item.name.match(/shield/) ){
					_player.equip( _player.equip_sword, item );
				} else {
					_player.equip( item, _player.equip_shield );
				}
			}
		} else if( this.page == 1 ) {
			//Map page
			if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }

		} else if( this.page == 2 ){
			//attributes page
			if( _player.stat_points > 0 ) {
				if( input.state("up") == 1 ) { this.stat_cursor -= 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.stat_cursor += 1; audio.play("cursor"); }
				this.stat_cursor = Math.max( Math.min( this.stat_cursor, Object.keys(_player.stats).length-1 ), 0 );
				
				if( input.state("fire") == 1 ) _player.levelUp(this.stat_cursor);
			}
		} else if ( this.page == 3 ) {
			var unlocked = Object.keys( _player.spellsUnlocked );
			if( unlocked.length > 0 ) {
				//Select a spell, if one hasn't already been selected
				if( !(_player.selectedSpell in _player.spellsUnlocked ) ) _player.selectedSpell = unlocked[0];
				
				//Control Menu
				if( input.state("up") == 1 ) {
					var pos = Math.max( unlocked.indexOf( _player.selectedSpell ) - 1, 0 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("down") == 1 ) { 
					var pos = Math.min( unlocked.indexOf( _player.selectedSpell ) + 1, unlocked.length-1 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 ) {
				this.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( input.state("select") == 1 ) {
				this.page = ( this.page + 1 ) % 4;
				audio.play("cursor");
			}
		}
	} else {
		if( input.state("pause") == 1 && _player instanceof Player && _player.life > 0 ) {
			this.open = true;
			_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			if( _player.stat_points > 0 ) this.page = 2;
			audio.play("pause");
		}
	}
	
	//Reveal map
	if( this.mapDimension instanceof Line ) {
		var map_index = (
			( Math.floor(_player.position.x / 256) - this.mapDimension.start.x ) + 
			( Math.floor(_player.position.y / 240) - this.mapDimension.start.y ) * this.mapDimension.width()
		);
		this.map_reveal[map_index] = 2;
		
		var lock;
		switch( this.map[map_index] ){
			case 1: lock = new Line(-256,0,512,240); break;
			case 2: lock = new Line(-256,-240,512,240); break;
			case 3: lock = new Line(-256,0,512,480); break;
			case 4: lock = new Line(-256,-240,256,240); break;
			case 5: lock = new Line(0,-240,512,240); break;
			case 6: lock = new Line(-256,0,256,480); break;
			case 7: lock = new Line(0,0,512,480); break;
			case 8: lock = new Line(0,-240,256,480); break;
			case 9: lock = new Line(-256,-240,512,480); break;
			case 10: lock = new Line(0,-240,512,480); break;
			case 11: lock = new Line(-256,-240,256,480); break;
			case 12: lock = new Line(0,0,512,240); break;
			case 13: lock = new Line(-256,0,256,240); break;
			case 14: lock = new Line(0,0,256,240); break;
			case 15: lock = new Line(0,0,512,240); break;
			default: lock = new Line(0,0,256,240); break;
		}
		lock = lock.transpose( Math.floor(_player.position.x / 256)*256,  Math.floor(_player.position.y / 240)*240 );
		_player.lock = lock;
	}
}
PauseMenu.prototype.revealMap = function(){
	for(var i=0; i < this.map.length; i++ ) {
		if( this.map_reveal[i] == undefined ) this.map_reveal[i] = 0;
		this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
	}
}
PauseMenu.prototype.render = function(g,c){
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	sprites.pig.render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	
	if( this.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			sprites.title.render(g,new Point(), 3);
			boxArea(g,68,168,120,40);
			textArea(g,"Press start",84,184);
		} else if( this.page == 0 ) {
			//Equipment
			
			boxArea(g,68,8,120,224);
			textArea(g,"Equipment",94,20);
			
			//Draw cursor
			g.fillStyle = "#FFF";
			g.scaleFillRect(
				84+(this.cursor % 4) * 24, 
				(64 + Math.floor(this.cursor / 4) * 24),
				24, 32 
			);
			g.fillStyle = "#000";
			g.scaleFillRect(
				86+(this.cursor % 4) * 24, 
				(66 + Math.floor(this.cursor / 4) * 24),
				20, 28 
			);
			
			if( _player.equip_sword instanceof Item )
				_player.equip_sword.render(g, new Point(-108,-40));
			if( _player.equip_shield instanceof Item )
				_player.equip_shield.render(g, new Point(-148,-40));
				
			for(var i=0; i < _player.equipment.length; i++ ) {
				_player.equipment[i].position.x = 0;
				_player.equipment[i].position.y = 0;
				_player.equipment[i].render( g, new Point(
					-(96 + (i % 4) * 24),
					(-80 + Math.floor(i / 4) * -24)
				));
			}
		} else if ( this.page == 1 ) {
			//Map
			boxArea(g,16,8,224,224);
			
			textArea(g,"Map",118,20);
			
			var size = new Point(8,8);
			var offset = new Point(32,24);
			for(var i=0; i < this.map.length; i++ ){
				if( this.map[i] > 0 && this.map_reveal[i] > 0 )  {
					var tile = new Point(
						this.mapDimension.start.x + (i%this.mapDimension.width() ),
						this.mapDimension.start.y + Math.floor(i/this.mapDimension.width() )
					);
					var pos = new Point( 
						(this.mapDimension.start.x*8) + (this.mapCursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
						(this.mapDimension.start.y*8) + (this.mapCursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
					);
					if( pos.x >= 0 && pos.x < 24*8 && pos.y >= 0 && pos.y < 24*8 ) {
						sprites.map.render(g,pos.add(offset),this.map[i]-1,(this.map_reveal[i]>=2?0:1));
						
						if( this.map_reveal[i] >= 2 ) {
							var doors = game.getObjects(Door);
							for(var j=0; j < doors.length; j++ ){
								if( tile.x == Math.floor(doors[j].position.x/256) && tile.y == Math.floor(doors[j].position.y/240) ){
									var door_id = doors[j].name.match(/(\d+)/)[0] - 0;
									sprites.map.render(g,pos.add(offset),door_id,2);
								}
							}
						}
					}
				}
			}
			//Draw player
			var pos = new Point(
				1+this.mapCursor.x*8 + Math.floor(_player.position.x/256)*8, 
				2+(this.mapCursor.y*8) + Math.floor(_player.position.y/240)*8
			);
			if( pos.x >= 0 && pos.x < 24*8 && pos.y >= 0 && pos.y < 24*8 ) {
				g.fillStyle = "#F00";
				g.scaleFillRect(pos.x + offset.x, pos.y + offset.y, 5, 5 );
			}
		} else if ( this.page == 2 ) {
			//Stats page
			boxArea(g,68,8,120,224);
			
			textArea(g,"Attributes",88,20);
			
			textArea(g,"Points: "+_player.stat_points ,88,36);
			
			var attr_i = 0;
			for(attr in _player.stats) {
				var y = attr_i * 28;
				textArea(g,attr ,88,60+y);
				g.fillStyle = "#e45c10";
				for(var i=0; i<_player.stats[attr]; i++)
					g.scaleFillRect(88+i*4, 72 + y, 3, 8 );
				
				if( _player.stat_points > 0 ) {
					//Draw cursor
					g.fillStyle = "#FFF";
					if( this.stat_cursor == attr_i )
						g.scaleFillRect(80, 62 + y, 4, 4 );
				}
				attr_i++;
			}
		} else if ( this.page == 3 ) {
			//Spells
			boxArea(g,68,8,120,224);
			textArea(g,"Spells",112,20);
			
			var spell_i = 0;
			for(spell in _player.spellsUnlocked) {
				var y = spell_i * 16;
				textArea(g,_player.spellsUnlocked[spell] ,88,36+y);
				
				if(_player.selectedSpell == spell ) {
					g.fillStyle = "#FFF";
					g.scaleFillRect(80, 38 + y, 4, 4 );
				}
				spell_i++;
			}
		}
	}
}