Debuger.prototype = new GameObject();
Debuger.prototype.constructor = GameObject;
function Debuger(x, y){	
	this.sprite = sprites.player;
	this.width = 14;
	this.height = 30;
	this.speed = 10;
	
	window._player = this;
	this.addModule( mod_camera );
	
	window.pixel_scale = 0.25;
}
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
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
	this.heal = 100;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.equip(this.equipment[0], this.equipment[1]);
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if( this.spellsCounters.magic_armour > 0 )
			damage = Math.max( Math.floor( damage * 0.5 ), 1);
		if( this.spellsCounters.thorns > 0 )
			obj.hurt(this,damage);
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
		"defence" : 1
	}
	
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
		this.force.y -= this.gravity * 0.45 * this.delta; 
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
		this.frame = Math.max((this.frame + 1) % 5, 3);
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
	var force = this.spellsCounters.feather_foot > 0 ? 10 : 7;
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
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
	
	this.damage = 2 + this.stats.attack * 3;
	this.damageReduction = (this.stats.defence-1) * 0.04;
}
Player.prototype.addXP = function(value){
	this.nextLevel = Math.floor( Math.pow( this.level,1.4 ) * 100 );
	this.prevLevel = Math.floor( Math.pow( this.level-1,1.4 ) * 100 );
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
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 33 );
	
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(48+i*16, 12), this.keys[i].frame, this.keys[i].frame_row, false );
	}
	
	//if( this.ttest instanceof Line) this.ttest.renderRect( g, c );
}

Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.knight;
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_down" : false,
		"guard" : 2 //0 none, 1 bottom, 2 top
	}
	
	this.attack_warm = 40.0;
	this.attack_time = 23.0;
	this.attack_rest = 20.0;
	
	this.life = 40;
	this.damage = 15;
	this.collideDamage = 10;
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( (this.states.guard == 1 && dir.y < 0) || (this.states.guard == 2 && dir.y > 0) ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -1 : 1) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = Math.random() > 0.6 ? 0 : 30;
		this.states.guard = Math.random() > 0.5 ? 1 : 2;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(10);
		this.destroy();
	});
}
Knight.prototype.update = function(){	
	this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active && this.states.attack <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 ){
			this.states.attack_down = Math.random() > 0.5;
			this.states.guard = 0;
			this.states.attack = this.attack_warm;
			this.states.cooldown = 70.0;
		}
		
		if( this.states.guard == 0 && this.states.attack <= 0 ){
			this.states.guard = Math.random() > 0.5 ? 1 : 2;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time && this.states.attack > this.attack_rest ){
			this.strike(new Line(
				new Point( 15, (this.states.attack_down ? 8 : -8) ),
				new Point( 27, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame_row = 1;
		} else {
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.2) % 4, 1 );
			} else {
				this.frame = 0;
			}
			this.frame_row = 0;
		}
	}
}
Knight.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 2 : 3 ), 2, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Sword
	var _x = 0
	if( this.states.attack > 0 )
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	this.sprite.render( g, 
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.frame, this.frame_row+3, this.flip
	);
}

Skeleton.prototype = new GameObject();
Skeleton.prototype.constructor = GameObject;
function Skeleton(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.skele;
	this.speed = .3;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = 20;
	this.mass = 0.8;
	this.damage = 15;
	this.collideDamage = 8;
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( (this.states.block_down && dir.y < 0) || (!this.states.block_down && dir.y > 0) ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -1 : 1) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = 30.0;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(4);
		audio.play("kill");
		game.objects.remove( game.objects.indexOf(this) );
	});
}
Skeleton.prototype.update = function(){	
	this.sprite = sprites.skele;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -8.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attack_warm;
			this.states.cooldown = 50.0;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time ){
			this.strike(new Line(
				new Point( 12, -6 ),
				new Point( 20, -10 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_time ? 2 : (this.states.attack < this.attack_time*1.5 ? 1 : 0);
			this.frame_row = 1
		} else if( !this.grounded ) {
			this.frame = 3;
			this.frame_row = 1;
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4, 1 );
			}
		}
	}
}

Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = sprites.megaknight;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0,
		"walk_back" : false
	}
	
	this.attack_times = {
		"warm" : 60.0,
		"swing" : 50.0,
		"damage" : 45.0,
		"rest" : 40
	};
	var corner = new Point(256*Math.floor(x/256),240*Math.floor(y/240));
	this.borders = [
		new Line(corner.x,corner.y,corner.x+256,corner.y),
		new Line(corner.x+256,corner.y,corner.x+256,corner.y+240),
		new Line(corner.x+256,corner.y+240,corner.x,corner.y+240),
		new Line(corner.x,corner.y+240,corner.x,corner.y)
	];
	
	this.life = 80;
	this.mass = 4.0;
	this.damage = 25;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( dir.y < 22.0 || !this.active ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = (Math.random() > 0.6 ? 0.0 : 10.0);
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(40);
		for(var i=0; i < this.borders.length; i++ ) game.removeCollision( this.borders[i] );
		_player.lock = false;
		game.objects.remove( game.objects.indexOf(this) );
	});
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		if( !this.active && Math.abs( dir.x ) < 64 && Math.abs( dir.y ) < 64 ){
			this.active = true;
			for(var i=0; i < this.borders.length; i++ ) game.addCollision( this.borders[i] );
			_player.lock = new Line(this.borders[0].start,this.borders[1].end);
		}
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.walk_back ? -1.0 : 1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				var start_distance = this.position.x - this.start_x;
				if( Math.abs( dir.x ) < 32 ) this.states.walk_back = true;
				if( Math.abs( dir.x ) > 96 && Math.abs(start_distance) < 48 ) this.states.walk_back = false;
				if( start_distance > 96 ) this.states.walk_back = !this.flip;
				else if( start_distance < -96 ) this.states.walk_back = this.flip;
				else if( this.states.cooldown < 50 && Math.abs(start_distance) < 64 ) this.states.walk_back = false;
				
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 48 ){
			this.states.attack = this.attack_times.warm;
			this.states.cooldown = this.attack_times.warm * 2;
		}
		
		if ( this.states.attack > this.attack_times.rest && this.states.attack < this.attack_times.damage ){
			this.strike(new Line(
				new Point( 16, 0 ),
				new Point( 40, 16 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_times.damage ? 2 : (this.states.attack < this.attack_times.swing ? 1 : 0);
			this.frame_row = 1
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = ( this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 3;
			}
		}
	}
}

Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.amon;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("collideHorizontal", function(dir){
		this.force.x *= -1;
	});
	this.on("collideVertical", function(dir){
		this.force.y *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(10);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 15;
	this.collisionReduction = 1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	
	this.mass = 1.0;
	this.gravity = 0.0;
}
Amon.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	if( this.stun < 0 ) {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
	} else {
		this.force.x = this.force.y = 0;
	}
}

Oriax.prototype = new GameObject();
Oriax.prototype.constructor = GameObject;
function Oriax(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	
	this.speed = 0.1;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(5);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 40;
	this.collideDamage = 5;
	this.mass = 1.0;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 45,
		"release" : 25
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.flip ? -1 : 1) * (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( Math.abs(dir.x) < 32 ) this.states.backup = true;
		if( Math.abs(dir.x) > 104 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 60;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new SnakeBullet(this.position.x, this.position.y+8, (this.flip?-1:1) );
				} else {
					missle = new SnakeBullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = (this.frame + 0.5) % 2;
		this.frame_row = 2;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame += this.states.attack_lower ? 2 : 0;
			this.frame_row = 1;
		} else {
			this.frame = Math.max(this.frame + this.delta * Math.abs(this.force.x) * 0.3, 1 ) % 4;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.origin.y = 0.8;
	
	this.speed = 0.2;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team != obj.team ) {
			obj.trigger("struck", this, this.position, this.collideDamage );
			this.trigger("death");
		} else if( this.states.landed && obj instanceof Oriax ){
			this.trigger("death");
		}
	});
	this.on("collideVertical", function(dir){
		if( !this.states.landed ){
			this.states.landed = true;
			this.flip = !this.flip;
		}
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	this.flip = d < 0;
	this.force.x = d * 8;
	this.life = 3;
	this.collideDamage = 5;
	this.mass = 0.0;
	this.gravity = 0.1;
	
	this.states = {
		"landed" : false,
		"life" : 200
	}
}
SnakeBullet.prototype.update = function(){
	this.frame = Math.max( (this.frame + this.delta * 0.2) % 4, 2);
	this.frame_row = 2;
	this.friction = this.grounded ? 0.2 : 0.05;
	
	this.states.life -= this.delta;
	
	if( this.stun < 0 && this.states.landed && this.states.dieOnTouch ) {
		this.gravity = 1.0;
		var direction = (this.flip ? -1 : 1);
		this.force.x += this.speed * this.delta * direction;
	}
	
	if( this.states.life < 0 ){
		this.trigger("death");
	}
}

Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = sprites.chaz;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(8);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 45;
	this.collideDamage = 5;
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 15
	};
}
Chaz.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( this.position.x - this.start_x > 24 ) this.states.backup = true;
		if( this.position.x - this.start_x < -24 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 50;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new Bullet(this.position.x, this.position.y+10, (this.flip?-1:1) );
				} else {
					missle = new Bullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = (this.frame + 0.5) % 2;
		this.frame_row = 3;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame_row = this.states.attack_lower ? 2 : 1;
		} else {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 12;
	this.height = 12;
	this.blockable = true;
	
	this.speed = 6.0;
	this.sprite = sprites.bullets;
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team ) {
			if( this.blockable ) {
				obj.trigger("struck", this, this.position, this.collideDamage );
			} else {
				obj.hurt( this, this.collideDamage );
			}
			this.trigger("death");
		} 
	});
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(obj,pos,damage){ this.destroy();});
	
	this.team = 0;
	this.collideDamage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
}

Dropper.prototype = new GameObject();
Dropper.prototype.constructor = GameObject;
function Dropper(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.origin = new Point();
	this.frame = 6;
	this.frame_row = 12;
	
	
	this.sprite = game.tileSprite;
	this.cooldown = 50;
	console.log("BROPPER");
}
Dropper.prototype.update = function(){
	if( this.cooldown < 0 ) {
		this.cooldown = 50;
		var bullet = new Bullet(this.position.x + 8, this.position.y + 16, 0);
		bullet.collideDamage = 5;
		bullet.blockable = false;
		bullet.gravity = 1.0;
		game.addObject( bullet );
	}
	this.cooldown -= this.delta;
}

/* Props */

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y){
	this.constructor();
	this.start_x = x + 8;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	
	this.onboard = false;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = true;
			obj.position.y = this.position.y;
			obj.checkpoint = this.position;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
			obj.visible = false;
			obj.interactive = false;
		}
	});
	
	this.mass = 0;
	this.gravity = 0.0;
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 192 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard ) {
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		if( Math.abs( this.position.y - goto_y ) > 16 ) {
			if( this.position.y > goto_y ) 
				this.force.y = -this.speed;
			else 
				this.force.y = this.speed;
		}
	}
	
	this.onboard = false;
}
Lift.prototype.render = function(g,c){
	g.fillStyle = "#FA0";
	//g.beginPath();
	g.scaleFillRect(
		this.position.x - (this.width * .5 + c.x),
		this.position.y - (this.height * .5 + c.y),
		this.width, this.height
	);
	//g.closePath();
	
}

DeathTrigger.prototype = new GameObject();
DeathTrigger.prototype.constructor = GameObject;
function DeathTrigger(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 16;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			obj.invincible = -999;
			obj.position.x = obj.checkpoint.x;
			obj.position.y = obj.checkpoint.y;
			obj.hurt( this, Math.floor( obj.lifeMax * .2) );
		} else if( obj.hasModule(mod_combat) ) {
			obj.invincible = -999;
			obj.hurt( this, 9999 );
		}
		if(obj instanceof Item){
			obj.destroy();
		}
	});
}

Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	
	if( name != undefined ) {
		this.setName( name );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 25; obj.heal = Number.MAX_VALUE; }
			if( this.name == "life_small" ) { obj.heal = 10; }
			if( this.name == "money_small" ) { obj.addXP(10); audio.play("pickup1"); }
			if( this.name == "money_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "short_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "long_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "spear") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "small_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "tower_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			this.position.x = this.position.y = 0;
			this.destroy();
		}
	});
}
Item.prototype.setName = function(n){
	this.name = n;
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	if(n == "short_sword") { this.frame = 0; this.frame_row = 2; return; }
	if(n == "long_sword") { this.frame = 1; this.frame_row = 2; return; }
	if(n == "spear") { this.frame = 2; this.frame_row = 2; return; }
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "mana_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "money_small") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "money_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	
}
Item.drop = function(obj){
	var drops = ["life_small", "money_small"];
	drops.sort(function(a,b){ return Math.random() - 0.5; } );
	if(Math.random() > 0.84 ){
		game.addObject( new Item( obj.position.x, obj.position.y, drops[0] ) );
	}
}

Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			var dir = this.position.subtract(obj.position);
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					this.destroy();
					return;
				}
			}
			obj.position.x = this.position.x + (dir.x < 0 ? 32 : -32);
		}
	});
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 8;
	this.frame_row = Math.floor( r / 8 );
}

CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.active = false;
	this.progress = 0.0;
	this.on("struck",function(obj,pos,damage){
		if( ! this.active && obj instanceof Player ) {
			audio.stop("music");
			audio.play("crash");
			this.active = true;
		}
	});
	
	var lines = [
		new Line(this.position.x-32, this.position.y-48, this.position.x-32, this.position.y+48),
		new Line(this.position.x-32, this.position.y+48, this.position.x+32, this.position.y+48),
		new Line(this.position.x+32, this.position.y+48, this.position.x+32, this.position.y-48),
		new Line(this.position.x+32, this.position.y-48, this.position.x-32, this.position.y-48)
	];
	for(var i=0; i < lines.length; i++) game.addCollision(lines[i]);
	
	this.addModule(mod_combat);
}
CornerStone.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame = 1;
		
		if( this.progress > 33.333 ) {
			audio.playLock("fanfair",10.0);
			audio.playLock("explode1",10.0);
			this.frame = 2;
		}
		
		if( this.progress > 233.333 ) {
			//Load new level
			dataManager.randomLevel( game, dataManager.currentTemple + 1 );
			_player.life = 1;
			game.pause = false;
			_player.heal = Number.MAX_VALUE;
			_player.mana = _player.manaMax;
			_player.addXP(40);
			_player.keys = [];
			
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}

Prisoner.prototype = new GameObject();
Prisoner.prototype.constructor = GameObject;
function Prisoner(x,y){
	this.constructor();
	this.sprite = sprites.prisoner;
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 48;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.phase = 0;
	this.alert = 0;
	
	this.progress = 0.0;
	
	this.message_help = "Help, I'm trapped in here!\nI can teach you something \nif you free me.";
	this.message_thanks = "Thank you for your help,\nbrave traveller. Now \nreceive your reward.";
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.phase == 0){
			this.phase = 1;
		}
	});
	this.on("wakeup", function(){
		if( this.alert == 0 ) this.alert = 1;
	});
	this.on("sleep", function(){
		if( this.alert > 0 ) this.alert = 2;
	});
	
	this.addModule(mod_rigidbody);
	this.friction = 0.9;
	this.mass = 0;
}
Prisoner.prototype.update = function(){
	this.flip = this.position.x - _player.position.x > 0;
	
	if( this.phase == 1 ) { 
		this.interactive = false;
		game.pause = true;
		if( input.state("fire") == 1 ) this.phase = 2;
	}
	
	if( this.phase >= 2 && this.phase < 4 ) {
		game.pause = true;
		
		if( this.phase == 2 && this.progress > 16 ) {
			this.phase = 3;
			audio.play("pause");
			var pauseMenu = game.getObject(PauseMenu);
			pauseMenu.page = 3;
			pauseMenu.open = true;
		}
		
		if( this.phase == 3 && this.progress > 50 ) {
			this.giveSpell();
			this.phase = 4;
		}
		
		this.progress += game.deltaUnscaled;
	}
	
	if( this.phase <= 0 ){
		this.frame = ( this.frame + this.delta * 0.2 ) % 3;
	} else {
		this.frame = 3;
	}
}
Prisoner.prototype.giveSpell = function(){
	var spell_list = {
		"bolt" : "Bolt",
		"magic_sword" : "Magic Sword",
		"magic_armour" : "Magic Armour",
		"feather_foot" : "Feather Foot",
		"thorns" : "Thorns",
		"heal" : "Heal"
	};
	var names = Object.keys( spell_list );
	names.sort(function(a,b){ return Math.random() -0.5; });
	for(var i=0; i < names.length; i++ ) {
		if( !( names[i] in _player.spellsUnlocked ) ){
			_player.spellsUnlocked[ names[i] ] = spell_list[names[i]];
			audio.play("item1");
			break;
		}
	}
}
Prisoner.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.phase == 1 ){
		textArea(g, this.message_thanks, 32,32);
	}
	if( this.alert == 1 && this.phase == 0 ){
		textArea(g, this.message_help, 32,32);
	}
}

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 1);
	this.width = this.height = 16;
	this.frame = 6;
	this.frame_row = 11;
	this.visible = false;
	
	this.center = new Point(this.position.x, this.position.y);
	this.lineTop = new Line(this.position.x+16,this.position.y,this.position.x,this.position.y);
	
	this.timer = 20
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.3);
		}
	});
	this.on("wakeup",function(){
		if( !this.visible ) {
			this.visible = true; 
			this.active = false;
			game.addCollision(this.lineTop);
			this.timer = 20;
		}
	});
}
CollapseTile.prototype.update = function(){
	if( this.active ) {
		//wobble
		this.position.x = this.center.x + ( -1 + Math.random() * 2 );
		this.position.y = this.center.y + ( -1 + Math.random() * 2 );
		this.timer -= this.delta;
		
		if(this.timer < 0) this.hide();
	}
}
CollapseTile.prototype.hide = function(){
	this.active = false;
	this.visible = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.removeCollision(this.lineTop);
}
CollapseTile.prototype.destroy = function(){
	game.removeCollision(this.lineTop);
	GameObject.prototype.destroy.apply(this);
}

PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	
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
		
		//Navigate pages
		if( input.state("select") == 1 ) {
			this.page = ( this.page + 1 ) % 4;
			audio.play("cursor");
		}
		
		if( this.page == 0 ) {
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
				this.stat_cursor = Math.max( Math.min( this.stat_cursor, 1 ), 0 );
				
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
		
		if( input.state("pause") == 1 ) {
			this.open = false;
			game.pause = false;
			audio.play("unpause");
		}
	} else {
		if( input.state("pause") == 1 && _player instanceof Player ) {
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
	
	if( this.open ) {
		if( this.page == 0 ) {
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
					var pos = new Point( 
						(this.mapDimension.start.x*8) + (this.mapCursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
						(this.mapDimension.start.y*8) + (this.mapCursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
					);
					if( pos.x >= 0 && pos.x < 24*8 && pos.y >= 0 && pos.y < 24*8 )
						sprites.map.render(g,pos.add(offset),this.map[i]-1,(this.map_reveal[i]>=2?0:1));
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

/* Modules */
var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.grounded = false;
		this.friction = 0.1;
		this.collisionReduction = 0.0;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			this.force.y *= this.collisionReduction;
			if( dir > 0 ) this.grounded = true;
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) ) {
				var dir = this.position.subtract( obj.position ).normalize();
				var mass = Math.max( 1.0 - Math.max(this.mass - obj.mass, 0), 0);
				this.force.y += dir.y * this.friction * mass;
				this.force.x += dir.x * this.friction * mass;
			}
		});
	},
	'update' : function(){
		this.force.y += this.gravity * this.delta;
		//Max speed 
		this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
		this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
		
		if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
		if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
		
		this.grounded = false;
		game.i_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
		var friction_x = 1.0 - this.friction * this.delta;
		this.force.x *= friction_x;
	},
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
	},
	'update' : function(){		
		var screen = new Point(256,240);
		game.camera.x = this.position.x - (256 / 2);
		game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		if( this.lock instanceof Line ) {
			game.camera.x = Math.min( Math.max( game.camera.x, this.lock.start.x ), this.lock.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this.lock.start.y ), this.lock.end.y - screen.y );
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.damage = 10;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = 10.0;
			
		this.strike = function(l){
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			offset.correct();
			this.ttest = offset;
			
			var hits = game.overlaps(offset);
			for( var i=0; i < hits.length; i++ ) {
				if( hits[i] != this && hits[i].life != null ) {
					hits[i].trigger("struck", this, offset.center(), this.damage);
				}
			}
		}
		
		this.hurt = function(obj, damage){
			if( this.invincible <= 0 ) {
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.floor( this.damageReduction * damage ), 1 );
				
				this.life -= damage;
				var dir = this.position.subtract( obj.position ).normalize();
				this.force.x += dir.x * ( 3/Math.max(this.mass,0.3) );
				this.invincible = this.invincible_time;
				this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				if( this.life <= 0 ) this.trigger("death");
			}
		}
	},
	"update" : function(){
		this.invincible -= this.delta;
		this.stun -= this.delta;
	}
}

var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","|","}","~","£"
];
function boxArea(g,x,y,w,h){
	g.fillStyle = "#000";
	g.scaleFillRect(x, y, w, h );
	g.fillStyle = "#FFF";
	g.scaleFillRect(x+7, y+7, w-14, h-14 );
	g.fillStyle = "#000";
	g.scaleFillRect(x+8, y+8, w-16, h-16 );
}
function textArea(g,s,x,y,w,h){
	var _x = 0;
	var _y = 0;
	for(var i=0; i < s.length; i++ ){
		if(s[i] == "\n") {
			_x = 0; _y++;
		} else {
			var index = textLookup.indexOf(s[i]);
			if( index >= 0 ){
				sprites.text.render(g,new Point(_x*8+x,_y*12+y),index);
				_x++;
			}
		}
	}
}