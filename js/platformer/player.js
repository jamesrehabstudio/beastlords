Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.zIndex = 1;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	this.equipment = [new Item(0,0,"short_sword"), new Item(0,0,"small_shield")];
	this.spells = [];
	
	this.equip_sword = this.equipment[0];
	this.equip_shield = this.equipment[1];
	
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false
	};
	
	this.attackProperites = {
		"warm" : 8.5,
		"strike" : 8.5,
		"rest" : 5.0,
		"range" : 8.0,
		"sprite" : sprites.sword1
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	}
	
	this.on("death", function(){
		game.slow(0,20.0);
		this.destroy();
	});
	this.on("land", function(){
		audio.play("land");
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		var facing = true;
		
		if( this.states.guard && facing && (
			(this.states.duck && dir.y < this.shieldProperties.duck) || 
			(!this.states.duck && dir.y > this.shieldProperties.stand)
		)){
			//blocked
			var kb = damage / 15.0;
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -kb : kb) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(obj, damage){
		this.states.attack = 0;
		game.slow(0,5.0);
		audio.play("playerhurt");
	})
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	this.life = 0;
	this.lifeMax = 100;
	this.mana = 100;
	this.manaMax = 100;
	this.money = 0;
	this.heal = 100;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if( this.spellsCounters.thorns > 0 && obj.hurt instanceof Function)
			obj.hurt(this,damage);
		if( this.spellsCounters.magic_armour > 0 )
			damage = Math.max( Math.floor( damage * 0.5 ), 1);
		this.superHurt(obj,damage);
	}
	
	//Stats
	this.stat_points = 0;
	this.experience = 0;
	this.level = 1;
	this.nextLevel = 0;
	this.prevLevel = 0;
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	
	this.equip(this.equipment[0], this.equipment[1]);
	
	this.spellsUnlocked = {};
	this.selectedSpell = "";
	this.spells = {
		"bolt" : function(){ 
			if( this.mana > 15 ){
				this.mana -= 15;
				var bullet = new Bullet(this.position.x, this.position.y, this.flip ? -1 : 1);
				bullet.team = this.team;
				bullet.collisionDamage = this.damage * 3;
				game.addObject(bullet);
			}
		},
		"magic_sword" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.magic_sword = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"magic_armour" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.magic_armour = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"feather_foot" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.feather_foot = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"thorns" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.thorns = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"heal" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.heal += 33;
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		}
	};
	this.spellsCounters = {
		"magic_sword" : 0,
		"magic_armour" : 0,
		"feather_foot" : 0,
		"thorns" : 0
	};
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	
	if( this.heal > 0 ){
		audio.play("heal");
		this.life += 2;
		this.heal -= 2;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	} else {
		if( this.life < this.lifeMax * .2 && this.delta > 0 ) audio.playLock("danger",1.00);
	}
	
	if( this.life > 0 && this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
		if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand(); this.flip = true;}
		if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); this.flip = false; }
		if ( input.state('jump') == 1 && this.grounded ) { this.jump(); }
		if ( input.state('fire') == 1 ) { this.attack(); }
		if ( input.state('select') == 1 ) { this.castSpell(this.selectedSpell); }
		
		if ( input.state('down') > 0 && this.grounded ) { this.duck(); } else { this.stand(); }
		if ( input.state('up') == 1 ) { this.stand(); }
	}
	
	//Apply jump boost
	if ( input.state('jump') > 0 && !this.grounded && this.jump_boost ) { 
		var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
		this.force.y -= this.gravity * boost * this.delta; 
	} else {
		this.jump_boost = false;
	}
	
	this.friction = this.grounded ? 0.2 : 0.05;
	this.inertia = this.grounded ? 0.9 : 0.2;
	this.height = this.states.duck ? 24 : 30;
	this.states.guard = this.states.attack <= 0;
	
	if ( this.life < 1 ) {
		game.removeObject( this );
	}
	
	if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
		//Play sound effect for attack
		if( !this.states.startSwing ) {
			audio.play("swing");
			if( this.spellsCounters.magic_sword > 0 ){
				var offset_y = this.states.duck ? 4 : -4;
				var bullet = new Bullet(this.position.x, this.position.y + offset_y, this.flip ? -1 : 1);
				bullet.team = this.team;
				bullet.speed = this.speed * 2;
				bullet.frame = 1;
				bullet.collisionDamage = Math.max( Math.floor( this.damage * 0.75 ), 1 );
				game.addObject(bullet);
			}
		}
		this.states.startSwing = true;
		
		//Create box to detect enemies
		this.strike(new Line(
			new Point( 12, (this.states.duck ? 4 : -4) ),
			new Point( 12+this.attackProperites.range , (this.states.duck ? 4 : -4)-4 )
		) );
	} else {
		this.states.startSwing = false;
	}
	
	//Animation
	if ( this.stun > 0 ) {
		this.stand();
		this.frame = 4;
		this.frame_row = 0;
	} else {
		if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
	}
	
	//Timers
	this.states.attack -= this.delta;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
}
Player.prototype.idle = function(){}
Player.prototype.stand = function(){
	if( this.states.duck ) {
		this.position.y -= 4;
		this.states.duck = false;
	}
}
Player.prototype.duck = function(){
	if( !this.states.duck ) {
		this.position.y += 4;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = 7;
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attackProperites.warm;
		if( this.grounded ) {
			this.force.x = 0;
		}
	}
}
Player.prototype.castSpell = function(name){
	if( name in this.spells && name in this.spellsUnlocked ) {
		this.spells[name].apply(this);
	}
}
Player.prototype.equip = function(sword, shield){
	try {
		if( sword.name == "short_sword" ){
			this.attackProperites.warm =  8.5;
			this.attackProperites.strike =  8.5;
			this.attackProperites.rest =  5.0;
			this.attackProperites.range =  12.0;
			this.attackProperites.sprite = sprites.sword1;
		} else if ( sword.name == "long_sword" ){
			this.attackProperites.warm = 15.5;
			this.attackProperites.strike =  10.5;
			this.attackProperites.rest =  7.0;
			this.attackProperites.range =  18.0;
			this.attackProperites.sprite = sprites.sword2;
		} else if ( sword.name == "spear" ){
			this.attackProperites.warm =  18.5;
			this.attackProperites.strike =  13.5;
			this.attackProperites.rest =  8.0;
			this.attackProperites.range =  27.0;
			this.attackProperites.sprite = sprites.sword3;
			shield = null;
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( shield.name == "small_shield" ){
				this.shieldProperties.duck = 8.0;
				this.shieldProperties.stand = -8.0;
				this.shieldProperties.frame_row = 3;
			} else if ( shield.name == "tower_shield" ){
				this.attackProperites.warm += 15.0;
				this.attackProperites.strike +=  12.0;
				this.attackProperites.rest +=  12.0;
				this.shieldProperties.duck = Number.MAX_VALUE;
				this.shieldProperties.stand = -Number.MAX_VALUE;
				this.shieldProperties.frame_row = 4;
			} else {
				this.shieldProperties.duck = -Number.MAX_VALUE;
				this.shieldProperties.stand = Number.MAX_VALUE;
				this.shieldProperties.frame_row = 5;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		/* Modify using stats */
		var tech = this.stats.technique - 1;
		
		this.attackProperites.rest = Math.max( this.attackProperites.rest - tech*0.8, 0);
		this.attackProperites.strike = Math.max( this.attackProperites.strike - tech*0.8, 3.5);
		this.attackProperites.warm = Math.max( this.attackProperites.warm - tech*1.0, this.attackProperites.strike);		
		
	} catch(e) {
		this.equip( this.equip_sword, this.equip_shield );
	}
}
Player.prototype.levelUp = function(index){
	if( this.stat_points > 0 ) {
		var i=0;
		for(var attr in this.stats ){
			if( i == index && this.stats[attr] < 20) {
				this.stats[attr]++;
				this.stat_points--;
				audio.play("levelup");
			}
			i++;
		}
	}
	
	this.damage = 3 + this.stats.attack * 2;
	var def = this.stats.defence - 1;
	this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
	this.equip( this.equip_sword, this.equip_shield );
}
Player.prototype.addXP = function(value){
	this.nextLevel = Math.floor( Math.pow( this.level,1.8 ) * 100 );
	this.prevLevel = Math.floor( Math.pow( this.level-1,1.8 ) * 100 );
	this.experience += value;
	
	if( this.experience >= this.nextLevel ) {
		this.stat_points++;
		this.level++;
		audio.play("levelup2");
		
		//Call again, just in case the player got more than one level
		this.addXP(0);
	}
}
Player.prototype.render = function(g,c){
	var shield_frame = (this.states.duck ? 1:0) + (this.states.guard ? 0:2);
	this.sprite.render(g, this.position.subtract(c), shield_frame, this.shieldProperties.frame_row, this.flip);
	
	GameObject.prototype.render.apply(this,[g,c]);
	
	//Render current sword
	this.attackProperites.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.flip);
	
	
	/* Render HP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.fillStyle = "#000";
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.scaleFillRect(8,8,this.life/4,8);
	g.closePath();
	
	/* Render Mana */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,19,(this.manaMax/4)+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,20,this.manaMax/4,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.scaleFillRect(8,20,this.mana/4,2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,25,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,this.money+"g",8, 33 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 45 );
	
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(48+i*16, 12), this.keys[i].frame, this.keys[i].frame_row, false );
	}
	
	//if( this.ttest instanceof Line) this.ttest.renderRect( g, c );
}