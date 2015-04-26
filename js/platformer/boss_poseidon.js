Poseidon.prototype = new GameObject();
Poseidon.prototype.constructor = GameObject;
function Poseidon(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 96;
	this.sprite = sprites.poseidon;
	this.speed = .3;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(26);
	this.collideDamage = 5;
	this.damage = dataManager.damage(4);
	this.landDamage = dataManager.damage(6);
	this.stun_time = 0;
	this.interactive = false;
	
	this.mass = 6.0;
	this.gravity = 0.4;
	this.begin = Game.DELTASECOND * 6;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0, //0 nothing, 1 ground pound, 2 fireballs, 3 lunge
		"attack_counter" : 0,
		"recover" : 0.0,
		"direction" : 1.0,
		"next" : 0
	}
	
	this.attack_times = {
		"warm" : 43,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideVertical", function(y){
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			else
				obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		game.addObject(new SceneEnding());
	});
}
Poseidon.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.active && this.begin > 0 ) {
		this.begin -= this.delta;
		this.interactive = false;
	}
	
	if( this.life > 0 && this.active && this.begin <= 0 ) {
		this.interactive = true;
		if( this.states.attack_type == 1 ) {
			//Ground pound
			if( this.force.y < 0 ) {
				//track player in mid air
				this.force.x += ( dir.x > 0 ? -1 : 1 ) * this.speed * this.delta;
			}
			if( this.states.attack_counter > 0 ) {
				if( this.grounded ) {
					if( this.states.cooldown <= 0 ) {
						this.states.attack_counter--;
						this.force.y = -9;
						this.states.cooldown = Game.DELTASECOND * 0.25;
						this.grounded = false;
					} else { 
						this.states.cooldown -= this.delta;
					}
				}
			} else {
				if( this.grounded ) {
					this.frame = 0; //animation fix for landing
					this.states.attack_type = 0;
					this.states.recover = Game.DELTASECOND * 1.2;
				}
			}
		} else if ( this.states.attack_type == 2 ){
			//Blow the player back with fireballs
			if( this.states.attack > 0 ){
				this.states.attack -= this.delta;
			} else if( this.states.attack_counter > 0 ) {
				if( this.states.cooldown <= 0 ) {
					this.states.cooldown = Game.DELTASECOND * 0.6;
					this.states.attack_counter--;
					var offset = Math.random() > 0.5 ? 28 : 42;
					var bullet = new Bullet(this.position.x, this.position.y + offset);
					bullet.blockable = true;
					bullet.team = this.team;
					bullet.force = new Point((this.flip?-1:1)*5, 0);
					game.addObject(bullet);
				}
				_player.force.x += (this.flip ? -1 : 1) * 0.6;
				this.states.cooldown -= this.delta;
			} else {
				this.states.attack_type = 0;
				this.states.recover = Game.DELTASECOND * 2;
			}
		} else if ( this.states.attack_type == 3 ){
			//Fire ball
			if( this.states.attack <= Game.DELTASECOND * 0.5 && this.states.attack_counter > 0 ) {
				this.states.attack_counter--;
				var bullet = new Bullet(this.position.x, this.position.y + 32);
				bullet.blockable = false;
				bullet.effect = EffectExplosion;
				bullet.team = this.team;
				bullet.force = new Point((this.flip?-1:1)*7, 0);
				game.addObject(bullet);
			}
			if( this.states.attack <= 0 ) {
				this.states.attack_type = 0;
				this.states.recover = Game.DELTASECOND * 1.5;
			}
			this.states.attack -= this.delta;
		} else {
			if ( this.states.recover <= 0 ) {
				this.flip = dir.x > 0;
				if( this.states.next == 0 ) {
					//March back and forth until counter runs down
					if( this.position.x - this.start_x > 40 ) this.states.direction = -1;
					if( this.position.x - this.start_x < -40 ) this.states.direction = 1;
					this.force.x += this.speed * this.delta * this.states.direction * 0.5;
					if( this.states.cooldown <= 0 ) {
						this.states.next = Math.floor( 1 + Math.random() * 3 );
					}
					this.states.cooldown -= this.delta;
				} else {
					//Move into position for next attack
					if( this.states.next == 1 ) {
						this.states.attack_type = this.states.next;
						this.states.next = 0;
						this.states.attack_counter = Math.floor(3 + Math.random() * 3);
						this.states.cooldown = Game.DELTASECOND * 0.25;
					} else {
						var goto_position = this.flip ? (this.start_x+64) : (this.start_x-64);
						if( this.states.next == 3 ) goto_position = this.start_x;
						
						if( Math.abs( this.position.x - goto_position ) < 16 ) {
							this.states.attack_type = this.states.next;
							this.states.next = 0;
							this.states.cooldown = 0;
							this.states.attack = Game.DELTASECOND*1.5;
							this.states.attack_counter = Math.floor(8 + Math.random() * 8);
							if( this.states.attack_type == 3 ) this.states.attack_counter = 1;
						} else { 
							this.force.x += this.speed * this.delta * (this.position.x - goto_position > 0 ? -1 : 1);
						}
					}
				}
			} else {
				this.states.recover -= this.delta;
				this.states.cooldown = Game.DELTASECOND * 3;
			}
		}
	}
	
	/* animation */
	if(this.states.recover > 0 ) {
		//Do nothing, hold the frame
	} else if(this.states.attack_type == 1) {
		this.frame = this.force.y > 0 ? 2 : 1;
		this.frame_row = 3;
		if( this.grounded ) this.frame = 0;
	}else if( this.states.attack_type == 2 ) {
		this.frame = this.states.attack > 0 ? 0 : 1;
		this.frame_row = 1;
	} else if( this.states.attack_type == 3 ) {
		this.frame = (this.states.attack_counter > 0 ? 0 : 1);
		this.frame_row = 2;
	} else {
		this.frame_row = 0;
		this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.1) % 3;
	}
}

Poseidon.prototype.render = function(g,c){
	if(!this.active || this.begin > 0 ) {
		if(this.begin < Game.DELTASECOND * 2 ) {
			this.sprite.render(g,this.position.subtract(c),2,1);
		}
		sprites.characters.render(g,this.position.subtract(c).add(new Point(0,32)),3,0);
	} else {
		GameObject.prototype.render.apply(this,[g,c]);
	}
}