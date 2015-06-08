var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.grounded = false;
		this._groundedTimer = 0;
		this.friction = 0.1;
		this.bounce = 0.0;
		this.collisionReduction = 0.0;
		this.pushable = true;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				this.grounded = true;
				this._groundedTimer = 2;
				if( this.force.y > 5.0 ) this.trigger("land");
			}
			this.force.y *= -this.bounce;
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) && this.pushable && obj.pushable ) {
				var dir = this.position.subtract( obj.position ).normalize();
				/*
				var b = this.bounds();
				var c = obj.bounds();
				var overlap = new Point(
					dir.x > 0 ? (c.end.x-b.start.x) : (b.end.x-c.start.x),
					dir.y > 0 ? (c.end.y-b.start.y) : (b.end.y-c.start.y)
				);
				var percent = new Point(
					Math.min(Math.abs(overlap.x) / Math.max(this.width*0.5,0.0001),1.0),
					Math.min(Math.abs(overlap.y) / Math.max(this.height*0.5,0.0001),1.0)
				);
				*/
				if( this.mass - obj.mass > 1.0 ){
					obj.force.x += this.force.x * 0.8;
				} else if( obj.mass > 0.5 ) {
					if( (this.force.x < 0 && dir.x > 0) || (this.force.x > 0 && dir.x < 0) ){
						this.force.x = dir.x;
					}
				} else { 
					this.force.x += dir.x * 0.2 * this.delta;
					this.force.y += dir.y * 0.2 * this.delta;
				}
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
		
		//Add just enough force to lock them to the ground
		if(this.grounded ) this.force.y += 0.1;
		
		//The timer prevents landing errors
		this._groundedTimer -= this.grounded ? 1 : 10;
		this.grounded = this._groundedTimer > 0;
		game.t_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
		var friction_x = 1.0 - this.friction * this.delta;
		this.force.x *= friction_x;
	},
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.lock_overwrite = false;
		this._lock_current = false;
		this.camerShake = new Point();
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
		
		var self = this;
		window.shakeCamera = function(p,y){
			if(!(p instanceof Point)) p = new Point(p,y);
			self.camerShake = p;
		};
	},
	'update' : function(){		
		var screen = game.resolution;
		game.camera.x = this.position.x - (game.resolution.x / 2);
		game.camera.y = this.position.y - (game.resolution.y / 2);
		//game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		
		game.camera.x += this.camerShake.x;
		this.camerShake = this.camerShake.scale(1-(0.07*game.deltaUnscaled));
		
		//Set up locks
		if( this.lock_overwrite instanceof Line ) {
			if( this._lock_current instanceof Line ) {
				var transition = this.delta * 0.1;
				this._lock_current.start.x = Math.lerp( this._lock_current.start.x, this.lock_overwrite.start.x, transition );
				this._lock_current.start.y = Math.lerp( this._lock_current.start.y, this.lock_overwrite.start.y, transition );
				this._lock_current.end.x = Math.lerp( this._lock_current.end.x, this.lock_overwrite.end.x, transition );
				this._lock_current.end.y = Math.lerp( this._lock_current.end.y, this.lock_overwrite.end.y, transition );
			} else {
				this._lock_current = this.lock_overwrite;
			}
		} else {
			if( this.lock instanceof Line ) {
				this._lock_current = new Line(this.lock.start.x, this.lock.start.y, this.lock.end.x, this.lock.end.y);
			} else {
				this._lock_current = false;
			}
		}
		
		if( this._lock_current instanceof Line ) {
			game.camera.x = Math.min( Math.max( game.camera.x, this._lock_current.start.x ), this._lock_current.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this._lock_current.start.y ), this._lock_current.end.y - screen.y );
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.criticalChance = 0.0;
		this.criticalMultiplier = 4.0;
		this.damage = 10;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = 10.0;
		this.death_time = 0;
		this._hurt_strobe = 0;
		this._death_clock = Number.MAX_VALUE;
		this._death_explosion_clock = Number.MAX_VALUE;
		this.damage_buffer = 0;
		this.buffer_damage = false;
		this._damage_buffer_timer = 0;
		this.xp_award = 0;
		
		this.attackEffects = {
			"slow" : [0,10],
			"poison" : [0,10],
			"cursed" : [0,25],
			"weaken" : [0,30],
			"bleeding" : [0,30],
			"rage" : [0,30]
		};
		this.statusEffects = {
			"slow" : 0,
			"poison" : 0,
			"cursed" : 0,
			"weaken" : 0,
			"bleeding" : 0,
			"rage" : 0
		};
		this.statusEffectsTimers = {
			"slow" : 0,
			"poison" : 0,
			"cursed" : 0,
			"weaken" : 0,
			"bleeding" : 0,
			"rage" : 0
		};
		this.statusResistance = {
			"slow" : 0.0,
			"poison" : 0.0,
			"cursed" : 0.0,
			"weaken" : 0.0,
			"bleeding" : 0.0,
			"rage" : 0.0
		};
		
		var self = this;
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false
		};
		this._shield = new GameObject();
		this._shield.life = 1;
		
		this.on("added",function(){ 
			for(var i in this.statusEffectsTimers )this.statusEffectsTimers[i] = -1;
			game.addObject(this._shield); 
		});
		this._shield.on("struck",function(obj,position,damage){
			if( obj != self ) 
				self.trigger("block",obj,position,damage);
		});
			
		this.strike = function(l,trigger,damage){
			trigger = trigger == undefined ? "struck" : trigger;
			damage = damage || this.damage;
			
			var out = new Array();
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			offset.correct();
			this.ttest = offset;
			
			var hits = game.overlaps(offset);
			for( var i=0; i < hits.length; i++ ) {
				if( hits[i].interactive && hits[i] != this && hits[i].life != null ) {
					this.trigger("struckTarget", hits[i], offset.center(), damage);
					
					if( trigger == "hurt" && hits[i].hurt instanceof Function ) {
						hits[i].hurt(this, damage);
						out.push(hits[i]);
					} else if( "_shield" in hits[i] && hits.indexOf( hits[i]._shield ) > -1 ) {
						//
					} else {
						hits[i].trigger(trigger, this, offset.center(), damage);
						out.push(hits[i]);
					}
				}
			}
			
			return out;
		}
		this.isDead = function(){
			if( this.life <= 0 ){
				//Remove effects
				for(var i in this.statusEffects ){
					this.statusEffects[i] = -1;
					this.statusEffectsTimers[i] = -1;
				}
				//Trigger death
				if( this.death_time > 0 ) {
					this.trigger("pre_death");
					this._death_clock = this.death_time;
					this._death_explosion_clock = this.death_time;
					this.interactive = false;
				} else {
					game.addObject(new EffectExplosion(this.position.x,this.position.y));
					this.trigger("death");
				}
			}
		}
		this.hasStatusEffect = function(){
			for(var i in this.statusEffects)
				if(this.statusEffects[i] > 0 )
					return true;
			return false;
		}
		this.addEffect = function(name, chance, time){
			var resistence = Math.random() + this.statusResistance[name];
			if( resistence < chance ){
				this.statusEffects[name] = Math.max( Game.DELTASECOND * time, this.statusEffects[name] );
				this.statusEffectsTimers[name] = Math.max( this.statusEffects[name] - Game.DELTASECOND * 0.5, this.statusEffectsTimers[name]);
				this.trigger("status_effect", name);
			}
		}
		this.hurt = function(obj, damage){
			if( this.statusEffects.bleeding > 0 ) damage *= 2;
			if( this.statusEffects.rage > 0 ) damage = Math.floor( damage * 1.5 );
			if( "statusEffects" in obj && obj.statusEffects.weaken > 0 ) damage = Math.ceil(damage/3);
			if( "statusEffects" in obj && obj.statusEffects.rage > 0 ) damage = Math.floor(damage*1.5);
			
			//Add effects to attack
			if( "attackEffects" in obj ){
				for( var i in obj.attackEffects ) {
					this.addEffect(i, obj.attackEffects[i][0], obj.attackEffects[i][1]);
				}
			}
			
			if( this.invincible <= 0 ) {
				//Determine if its a critical shot
				if( Math.random() < this.criticalChance ) {
					damage *= this.criticalMultiplier;
					audio.play("critical");
					game.slow(0.1, Game.DELTASECOND * 0.5 );
					this.trigger("critical",obj,damage);
					game.addObject(new EffectCritical(this.position.x, this.position.y));
				}
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.ceil( this.damageReduction * damage ), 1 );
				
				if( this.buffer_damage ) 
					this.damage_buffer += damage;
				else
					this.life -= damage;
				
				if(this.hasModule(mod_rigidbody)){
					var dir = this.position.subtract( obj.position ).normalize();
					var scale = ("knockbackScale" in obj) ? obj.knockbackScale : 1.0;
					this.force.x += dir.x * ( 3/Math.max(this.mass,0.3) ) * scale;
				}
				this.invincible = this.invincible_time;
				this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				this.isDead();
				obj.trigger("hurt_other",this,damage);
			}
		}
		this.calculateXP = function(scale){
			if(!this.filter && !(this instanceof Player) && !this.hasModule(mod_boss))
				this.filter = "t"+dataManager.currentTemple;
			
			scale = scale == undefined ? 1 : scale;
			this.xp_award = 0;
			this.xp_award += this.life / 8;
			this.xp_award += this.damage / 5;
			if( this.speed != undefined )
				this.xp_award += Math.max((this.speed-0.3)*3,0);
			this.xp_award += this.bounds().area() / 400;
			this.xp_award = Math.floor(this.xp_award * scale * this.deltaScale);
			return this.xp_award;
		}
		
		this.on("death", function(){
			this._shield.destroy();
		});
	},
	"update" : function(){
		if( this._base_filter == undefined ) {
			this._base_filter = this.filter;
		}
		if( this.invincible > 0 ) {
			this._hurt_strobe = (this._hurt_strobe + game.deltaUnscaled * 0.5 ) % 2;
			this.filter = this._hurt_strobe < 1 ? "hurt" : this._base_filter;
		} else {
			this.filter = this._base_filter;
		}
		
		this.deltaScale = this.statusEffects.slow > 0 ? 0.5 : 1.0;
		
		//Status Effects timers
		var j=0;
		for(var i in this.statusEffects ){
			if( this.statusEffects[i] > 0 ){
				this.statusEffects[i] -= this.deltaUnscaled;
				if( this.statusEffectsTimers[i] > this.statusEffects[i]/* || this.statusEffectsTimers[i] <= 0 */){
					this.statusEffectsTimers[i] = this.statusEffects[i] - Game.DELTASECOND * 0.5;
					if( i == "poison" ) {
						if( this instanceof Player ){
							if( this.life > 30 ) this.life -= 1;
						} else {
							this.life -= 3; this.isDead(); 
						}
					}
					var effect = new EffectStatus(this.position.x+(Math.random()-.5)*this.width, this.position.y+(Math.random()-.5)*this.height);
					effect.frame = j;
					game.addObject(effect);
				}
			}
			j++;
		}
		
		this._damage_buffer_timer -= this.deltaUnscaled;
		if( this.damage_buffer > 0 && this._damage_buffer_timer <= 0 ){
			this.life -= 1;
			this.damage_buffer -= 1;
			this._damage_buffer_timer = Game.DELTASECOND * 0.3;
			this.isDead();
		}
		
		if( this.life <= 0 ) this._death_clock -= game.deltaUnscaled;
		if( this._death_clock <= 0 ) this.trigger("death");
		if( this.life <= 0 && this._death_clock < this._death_explosion_clock) {
			//Create explosion
			game.addObject(new EffectExplosion(
				this.position.x + this.width*(Math.random()-.5), 
				this.position.y + this.height*(Math.random()-.5)
			));
			this._death_explosion_clock = this._death_clock - Game.DELTASECOND * .25;
		}
		
		this._shield.interactive = this.guard.active;
		this._shield.team = this.team;
		if( this.guard.active ) {
			this._shield.position.x = this.position.x+(this.flip?-1:1)*this.guard.x;
			this._shield.position.y = this.position.y+this.guard.y;
			this._shield.width = this.guard.w;
			this._shield.height = this.guard.h;
		} else {
			this._shield.position.x = -Number.MAX_VALUE;
			this._shield.position.y = -Number.MAX_VALUE;
		}
		
		this.invincible -= this.deltaUnscaled;
		this.stun -= this.delta;
	}
}

var mod_boss = {
	"init" : function(){
		this.active = false;
		var x = this.position.x;
		var y = this.position.y;
		this.boss_starting_position = new Point(x,y);
		
		var corner = new Point(256*Math.floor(x/256), 240*Math.floor(y/240));
		this.boss_lock = new Line(
			corner.x,
			corner.y,
			256 + corner.x,
			240 + corner.y
		);
		this.boss_doors = [
			new Point(corner.x-8,corner.y+168),
			new Point(corner.x-8,corner.y+184),
			new Point(corner.x-8,corner.y+200),
			
			new Point(corner.x+256,corner.y+168),
			new Point(corner.x+256,corner.y+184),
			new Point(corner.x+256,corner.y+200)
		];
		
		this.reset_boss = function(){
			this.position.x = this.boss_starting_position.x;
			this.position.y = this.boss_starting_position.y;
			this.active = false;
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
			_player.lock_overwrite = false;
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 64 && Math.abs( dir.y ) < 64 ){
					this.active = true;
					this.trigger("activate");
				}
			}
		}
		
		this.on("player_death", function(){
			this.reset_boss();
		});
		this.on("activate", function() {
			for(var i=0; i < this.boss_doors.length; i++ ) 
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, window.BLANK_TILE);
			_player.lock_overwrite = this.boss_lock;
			this.interactive = true;
		});
		this.on("death", function() {
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
			_player.lock_overwrite = false;
		});
	},
	"update" : function(){
		this._boss_is_active();
	}
}

var mod_talk = {
	"init" : function(){
		this.open = 0;
		this.canOpen = true;
		this._talk_is_over = 0;
		
		if(window._dialogueOpen == undefined){
			window._dialogueOpen = false;
		}
		
		this.close = function(){
			this.open = 0;
			window._dialogueOpen = false;
			this.trigger("close");
		}
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				this._talk_is_over = 2;
			}
		});
	},
	"update" : function(){
		if( !window._dialogueOpen && this.canOpen && this.delta > 0 && this._talk_is_over > 0 && input.state("up") == 1 ){
			this.open = 1;
			window._dialogueOpen = true;
			this.trigger("open");
		}
		this._talk_is_over--;
	},
	"render" : function(g,c){
		if( this.canOpen && this._talk_is_over > 0 && this.open < 1){
			var pos = _player.position.subtract(c);
			pos.y -= 24;
			sprites.text.render(g,pos,4,6);
		}
	}
}

SpecialEnemy = function(enemy){
	if(Math.random() > 0.05) return;
	var effects = 1 + Math.floor(Math.random()*3);
	enemy.life = Math.floor(8 + enemy.life * 1.5);
	
	for(var i=0; i < effects; i++){
		try{			
			if(Math.random() < 0.1){
				enemy.life *= 2;
			} else if(Math.random() < 0.1){
				if("damage" in enemy) enemy.damage = Math.floor(enemy.damage*1.5);
				enemy.collideDamage = Math.floor(enemy.damage*1.5);
			} else if(Math.random() < 0.1){
				enemy.deltaScale = 1.3333;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.slow[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.poison[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.cursed[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.weaken[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.bleeding[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.rage[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.invincible_time += Game.DELTASECOND;
			}
		} catch (err){
			console.error(err);
		}
	}
	enemy.filter = "special";
	console.log("SPECIAL: " + typeof(this));
}

EnemyStruck = function(obj,pos,damage){
	if( this.team == obj.team ) return;
	var clife = this.life;
	this.hurt( obj, damage );
	if(clife != this.life) game.addObject(new EffectBlood(
		pos.x, pos.y, this.position.subtract(obj.position).normalize(), clife - this.life)
	);
}