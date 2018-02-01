var physicsLayer = {
	"default" : 0,
	"item" : 1,
	"particles" : 2,
	"groups" : {
		0 : [0],
		1 : [1],
		2 : [2]
	}
}
var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.airtime = 0.0;
		this.grounded = false;
		this._groundedTimer = 0;
		this.friction = 0.1;
		this.bounce = 0.0;
		this.collisionReduction = 0.0;
		this.resistObjects = 0.0;
		this.rigidbodyActive = true;
		this.preventPlatFormSnap = false;
		this.pushable = true;
		this.physicsLayer = physicsLayer.default;
		this.currentlyStandingBlock = false;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				if(!this.grounded && this.force.y > 0.2){
					this.trigger("land", this.force.y);
				}
				this.grounded = true;
				this._groundedTimer = 2;
			}
			if((this.force.y > 0 && dir > 0) || (this.force.y < 0 && dir < 0 )){
				this.force.y *= -this.bounce;
			}
		});
		this.atLedge = function(f){
			if(f == undefined){
				f = this.forward();
			}
			var c = this.corners();
			var p = new Point(
				f > 0 ? c.right : c.left,
				c.bottom + 16
			);
			return game.getTile(p) == 0;
			
		}
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) && this.pushable && obj.pushable ) {
				if(physicsLayer.groups[this.physicsLayer].indexOf(obj.physicsLayer) >= 0){
					var dir = this.position.subtract( obj.position ).normalize();
					
					if(this.resistObjects){
						this.force = this.force.add(dir.normalize(this.resistObjects * this.delta));
					} else {
						var obj_corners = obj.corners();
						var ths_corners = this.corners();
						
						if(dir.x < -.3){
							this.position.x = obj_corners.left - this.width * this.origin.x;
							this.force.x = Math.min(this.force.x, 0);
						} else if(dir.x > .3){
							this.position.x = obj_corners.right + this.width * this.origin.x;
							this.force.x = Math.max(this.force.x, 0);
						} else if(this.mass <= obj.mass){
							this.force.x += (dir.x > 0 ? 1 : -1) * this.delta;
						}
					}
					
					
					
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
					*/
				}
			}
		});
	},
	'update' : function(){
		if(this.delta > 0 && this.rigidbodyActive){
			var inair = !this.grounded;
			if(this.airtime <= 0 || this.force.y < 0.0){
				this.force.y += this.gravity * this.delta;
			}
			//Max speed 
			this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
			this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
			
			if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
			if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
			
			//Add just enough force to lock them to the ground
			if(this.grounded ) this.force.y += 0.01;
			//if(this.grounded ) this.force.y = 0.0;
			
			//The timer prevents landing errors
			this._groundedTimer -= this.grounded ? 1 : 10;
			this.grounded = this._groundedTimer > 0;
			var limits = game.t_move( this, this.force.x * this.delta, this.force.y * this.delta );
			
			if(this.preventPlatFormSnap <= 0){
				if(this.grounded && limits[1] > this.position.y && limits[1] - this.position.y < 16 ){
					this.position.y = limits[1];
					this.trigger("collideVertical", 1);
				}
			}
			
			if(this.currentlyStandingBlock){
				this.position = this.position.add(this.currentlyStandingBlock.blockChange);
				if(!this.currentlyStandingBlock.interactive){
					this.currentlyStandingBlock = false;
				} else if(this.isStuck){
					this.currentlyStandingBlock = false;
				} else if(this.grounded && this.currentlyStandingBlock.block_isWithinX(this)){
					this.force.y = 0.0;
					var c = this.currentlyStandingBlock.corners();
					this.position.y = c.top - 0.1 - this.height * this.origin.y;
					this.trigger("collideVertical", 1);
					this.currentlyStandingBlock.trigger("ontop", this);
				} else {
					this.currentlyStandingBlock = false;
				}
			}
			
			var friction_x = 1.0 - this.friction * this.delta;
			var friction_y = 1.0 - 0.02 * this.delta;
			this.force.x *= friction_x;
			this.force.y *= friction_y;
			this.preventPlatFormSnap -= this.delta;
			this.airtime -= this.delta;
		}
	},
}

var mod_block = {
	'init' : function(){
		this.blockCollide = true;
		this.blockKillStuck = true;
		this.blockTopOnly = false;
		this.blockStuck = new Array();
		this.blockPrevious = new Point(this.position.x, this.position.y);
		this.blockChange = new Point(0,0);
		this.blockCollideCriteria = function(obj){ return obj.hasModule(mod_rigidbody); }
		this.zIndex = 20;
		
		this.block_isWithinX = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.right >= d.left && c.left <= d.right;
		}
		this.block_isWithinY = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.bottom >= d.top && c.top <= d.bottom;
		}
		this.block_isWithin = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.right >= d.left && c.left <= d.right && c.bottom >= d.top && c.top <= d.bottom;
		}
		this.block_isOnboard = function(obj){
			if(obj.hasModule(mod_rigidbody)){
				return obj.currentlyStandingBlock === this;
			}
			return false;
		}
		this.block_handleStuck = function(obj){
			//obj.position = obj.position.add(this.blockChange);
			
			this.trigger("objectStuck", obj);
			obj.trigger("blockStuck", this);
			if(obj.position.y < this.position.y){
				this.trigger("collideTop", obj);
			} else if(obj.position.x > this.position.x + this.width * this.origin.x){
				//obj.position.x += obj.delta;
				obj.trigger( "collideHorizontal", 1);
			} else {
				//obj.position.x -= obj.delta;
				obj.trigger( "collideHorizontal", -1);
			}
		}
		
		this.on("collideTop", function(obj){
			var c = this.corners();
			let wg = obj.grounded;
			if(obj.force.y > 0){
				obj.position.y = (c.top - 0.1) - obj.height * obj.origin.y;
				obj.trigger( "collideVertical", 1);
				obj.trigger( "blockCollideVertical", 1, this);
			}
			if(obj.gravity > 0){
				this.trigger("blockLand",obj);
				if(obj.currentlyStandingBlock !== this && !wg){
					//obj.trigger("land");
				}
				//this.blockOnboard.push(obj);
				obj.currentlyStandingBlock = this;
				obj.preventPlatFormSnap = Game.DELTAFRAME30;
			}
		});
		this.on("collideBottom", function(obj){
			var c = this.corners();
			obj.position.y = c.bottom + obj.height * obj.origin.y;
			if(obj.force.y < 0){
				obj.trigger( "collideVertical", -1);
				obj.trigger( "blockCollideVertical", -1, this);
			}
		});
		this.on("collideLeft", function(obj){
			var c = this.corners();
			obj.position.x = c.left - obj.width * obj.origin.x;
			if(obj.force.x > 0){
				obj.trigger( "collideHorizontal", 1);
				obj.trigger( "blockCollideHorizontal", 1, this);
			}
		});
		this.on("collideRight", function(obj){
			var c = this.corners();
			obj.position.x = c.right + obj.width * obj.origin.x;
			if(obj.force.x < 0){
				obj.trigger( "collideHorizontal", -1);
				obj.trigger( "blockCollideHorizontal", -1, this);
			}
		});
		
		this.on("collideObject", function(obj){
			if(this.blockCollide && this.width > 0 && this.height > 0){
				if( this.blockCollideCriteria(obj) ) {
					var prepos = obj.position.subtract(obj.force.scale(obj.delta));
					var d = this.corners(this.blockPrevious);
					//var b = obj.corners();
					var c = obj.corners(prepos);
					
					if(!this.block_isWithin(obj)){
						//Object outside of bounds, do nothing
					} else if(c.bottom <= d.top){
						//Top
						this.trigger("collideTop", obj);
					} else if(c.top >= d.bottom){
						//Bottom
						this.trigger("collideBottom", obj);
					} else if(c.right <= d.left){
						//left
						this.trigger("collideLeft", obj);
					} else if(c.left >= d.right){
						//right
						this.trigger("collideRight", obj);
					} else {
						//Stuck inside
						this.blockStuck.push(obj);
					}
				}
			}
		});
	},
	'update' : function(){
		for(var i=0; i < this.blockStuck.length; i++){
			this.block_handleStuck(this.blockStuck[i]);
		}
		this.blockStuck = new Array();
		
		this.blockChange = this.position.subtract(this.blockPrevious);
		this.blockPrevious = new Point(this.position.x,this.position.y);
	}
}

var mod_camera = {
	'init' : function(){
		this.cameraLock = false;
		this.cameraYTween = false;
		this.camerShake = new Point();
		this.camera_target = new Point();
		this.camera_unlockTime = 0.0;
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
		
		var that = this;
		shakeCamera = function(duration,strength){
			if(duration instanceof Point){
				that.camerShake = duration;
			} else {
				strength = strength || 4;
				that.camerShake = new Point(duration,strength);
			}
		};
		
		this.camera_lock = function(){
			var mapwidth = Math.floor(game.map.width / 16);
			var map_index = (
				( Math.floor(this.position.x / 256) - 0 ) + 
				( Math.floor(this.position.y / 240) - 0 ) * mapwidth
			);
			
			var map_tile = game.map.map[map_index];
			
			if(map_tile != undefined){
				//If map tile is valid, change camera locks
				var lock;
				var h = 256;
				var v = 240;
				var hlimit = 1024;
				var vlimit = 960;
				switch( Math.abs(map_tile) % 16 ){
					case 0: lock = new Line(0,0,h,v+vlimit); break;
					case 1: lock = new Line(0,0,h+hlimit,v+vlimit); break;
					case 2: lock = new Line(-hlimit,0,h,v+vlimit); break;
					case 3: lock = new Line(-hlimit,0,h+hlimit,v+vlimit); break;
					case 4: lock = new Line(0,0,h,v); break;
					case 5: lock = new Line(0,0,h+hlimit,v); break;
					case 6: lock = new Line(-hlimit,0,h,v); break;
					case 7: lock = new Line(-hlimit,0,h+hlimit,v); break;
					case 8: lock = new Line(0,-vlimit,h,v+vlimit); break;
					case 9: lock = new Line(0,-vlimit,h+hlimit,v+vlimit); break;
					case 10: lock = new Line(-hlimit,-vlimit,h,v+vlimit); break;
					case 11: lock = new Line(-hlimit,-vlimit,h+hlimit,v+vlimit); break;
					case 12: lock = new Line(0,-vlimit,h,v); break;
					case 13: lock = new Line(0,-vlimit,h+hlimit,v); break;
					case 14: lock = new Line(-hlimit,-vlimit,h,v); break;
					case 15: lock = new Line(-hlimit,-vlimit,h+hlimit,v); break;
					default: lock = new Line(-hlimit,-vlimit,h,v+vlimit); break;
				}
				lock = lock.transpose( 
					Math.floor(this.position.x / 256)*256,  
					Math.floor(this.position.y / 240)*240 
				);
				return lock;
			}
		}
	},
	'update' : function(){
		game.camera.x = this.position.x - (game.resolution.x / 2);
		var yCenter = this.position.y - (game.resolution.y / 2);
		
		if(this.grounded || this.states.ledge){
			if(this.cameraYTween){
				game.camera.y = Math.lerp(game.camera.y, yCenter, this.delta * 0.3);
				this.camera_unlockTime -= this.delta;
				if(Math.abs(game.camera.y-yCenter) < 2 || this.camera_unlockTime <= 0){
					this.cameraYTween = false;
				}
			} else {
				game.camera.y = yCenter;
			}
		} else {
			this.camera_unlockTime = Game.DELTASECOND;
			this.cameraYTween = true;
			game.camera.y = Math.min(Math.max(
				game.camera.y,
				yCenter
				), yCenter + 72
			);
		}
		
		//Set up locks
		var lock = this.camera_lock();
		if( lock ) { this.cameraLock = lock; }
		
		if(this.cameraLock){
			game.camera.x = Math.min( Math.max( game.camera.x, this.cameraLock.start.x ), this.cameraLock.end.x - game.resolution.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this.cameraLock.start.y ), this.cameraLock.end.y - game.resolution.y );
			if( this.cameraLock.width() < game.resolution.x ){
				var excess = game.resolution.x - this.cameraLock.width();
				game.camera.x = this.cameraLock.start.x - excess * 0.5;
			}
		}
		
		if(this.camerShake.x > 0){
			game.camera.x += Math.floor((Math.random() * this.camerShake.y) - this.camerShake.y*0.5);
			game.camera.y += Math.floor((Math.random() * this.camerShake.y) - this.camerShake.y*0.5);
			this.camerShake.x -= game.deltaUnscaled;
		}
	},
	"postrender" : function(g,c){
		if(this.cameraLock){
			var viewWidth = this.cameraLock.width();
			if( viewWidth < game.resolution.x ){
				var excess = game.resolution.x - viewWidth;
				g.color = [0,0,0,1];
				g.scaleFillRect(0,0,excess*0.5, game.resolution.y);
				g.scaleFillRect(game.resolution.x-excess*0.5,0,excess*0.5, game.resolution.y);
			}
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.lifeMax = this.life = 100;
		this.difficulty = 0;
		this.team = 0;
		this.criticalChance = 0.0;
		this.hurtByDamageTriggers = true;
		this.moneyDrop = Spawn.money(3,0);
		
		this.damage = 10;
		this.damageFire = 0;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		this.damageFixed = 0;
		
		this.defencePhysical = 0;
		this.defenceFire = 0;
		this.defenceSlime = 0;
		this.defenceIce = 0;
		this.defenceLight = 0;
		
		this.criticalMultiplier = 4.0;
		
		//Counters
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.stun = 0;
		this.stun_time = Game.DELTASECOND;
		this.combat_stuncount = 0;
		this.death_time = 0;
		this._hurt_strobe = 0;
		this._death_confirmed = false;
		this._death_clock = new Timer(Number.MAX_VALUE, Game.DELTASECOND * 0.25);
				
		this.showDamage = true;
		this._damageCounter = new EffectNumber(0,0,0);
		this.hitIgnoreList = new Array();
		
		this.ragdoll = false;
		
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false,
			"life" : 99999,
			"lifeMax" : 99999,
			"restore" : 0.5,
			"invincible" : 0.0,
			"omidirectional" : false
		};
		
		
			
		this.strike = Combat.strike;
		this.shieldArea = Combat.shieldArea;
		
		this.combatFinalDamage = function(damage){
			this.life -= damage;
		}
		
		this._combatTarget;
		this.target = function(){
			if(this._combatTarget == undefined){
				this._combatTarget = _player;
			}
			return this._combatTarget;
		}
		
		this.isDead = function(){
			if(this.life <= 0){
				//Remove effects
				this.buffer_damage = 0;
				this.hurtByDamageTriggers = false;
				
				if(!this._death_confirmed){
					game.addObject(new EffectExplosion(this.position.x,this.position.y));
				}
				
				//Trigger death
				if( this.death_time > 0 ) {
					//Stand in place and explode
					this.trigger("pre_death");
					this._death_clock.set(this.death_time);
					this.interactive = false;
				} else if( this.hasModule(mod_rigidbody)){
					if( !this.ragdoll ){
						//Rag doll and explode
						this.trigger("pre_death");
						game.addObject(new EffectExplosion(this.position.x,this.position.y));
						this.physicsLayer = physicsLayer.particles;
						this.ragdoll = true;
					}
				} else {
					this.trigger("death");
					
				}
				this._death_confirmed = true;
			} else {
				this.ragdoll = false;
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
				this.trigger("status_effect", name);
			}
		}
		this.displayDamage = function(damage){
			if(damage > 0 && this.life > 0 && this.showDamage){
				//Show damage taken
				this._damageCounter.value = Math.round(this._damageCounter.value + damage * 1);
				this._damageCounter.progress = 0.0;
				this._damageCounter.position.x = this.position.x;
				this._damageCounter.position.y = this.position.y - 16;
				if(this._damageCounter.sleep){
					game.addObject(this._damageCounter);
				}
			}
		}
		
		this.getDamage = Combat.getDamage;
		
		this.calcDamage = Combat.calcDamage;
		
		this.hurt = function(obj, damage){
			
			if(damage == undefined){
				//If no damage is supplied, get it
				damage = Combat.getDamage.apply(obj);
			}
			
			//Turns damage object into a flat damage number
			damage = this.calcDamage(damage);
			
			
			if( this.invincible <= 0 ) {
				//Increment number of hits
				this.combat_stuncount++;
				this.trigger("stun", obj, damage, this.combat_stuncount);
				
				if( Math.random() < this.criticalChance && damage > 0) {
					//Determine if its a critical shot
					damage *= obj.criticalMultiplier || 2.0;
					audio.play("critical",this.position);
					game.slow(0.1, Game.DELTASECOND * 0.5 );
					this.trigger("critical",obj,damage);
					game.addObject(new EffectCritical(this.position.x, this.position.y));
				}
				
				if(damage > 0){
					//damage = Math.max( damage - Math.ceil( this.defencePhysical * damage ), 1 );
					
					damage = obj.useBuff("prehurt_other",damage,this);
					damage = this.useBuff("hurt",damage,obj);
					
					this.displayDamage(damage);
					
					this.combatFinalDamage(damage);
					
					this.isDead();
					
					this.invincible = this.invincible_time;
					//this.stun = this.stun_time;
					this.trigger("hurt",obj,damage);
					obj.trigger("hurt_other",this,damage);
					
					this.useBuff("posthurt",damage,obj);
					obj.useBuff("hurt_other",damage,this);
					
					
					if(this.ragdoll && this.hasModule(mod_rigidbody)){
						this.grounded = false;
						this.gravity = 0.6;
						this.criticalChance = 0;
						this.force.y = -7;
						this.force.x = (this.position.x-obj.position.x<0?-1:1) * 2;
					}
				} else {
					this.invincible = this.invincible_time;
				}
			}
		}
		
		this.calculateXP = function(){}
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
		if(this.stun <= 0){
			this.combat_stuncount = 0;
		}
		
		//this.deltaScale = this.statusEffects.slow > 0 ? 0.5 : 1.0;
		
		
		//Handle death
		if(this.life <= 0 ){
			if(this.ragdoll){
				if(this.grounded){
					this.trigger("death");
				}
			} else {
				if(this.death_time > 0) {
					if( this._death_clock.status(game.deltaUnscaled) ) {
						game.addObject(new EffectExplosion(
							this.position.x + this.width*(Math.random()-.5), 
							this.position.y + this.height*(Math.random()-.5)
						));
					}
					if( this._death_clock.time <= 0 ) this.trigger("death");
				}
			}
		}
		
		
		this.invincible -= this.deltaUnscaled;
		this.guard.invincible -= this.deltaUnscaled;
		this.stun -= this.delta;
	},
	"postrender" : function(g,c){
		if(self.debug){
			if(this.guard.active){
				var shield = this.shieldArea();
				g.color = [0.2,0.3,1.0,1.0];
				g.scaleFillRect(
					shield.start.x - c.x,
					shield.start.y - c.y,
					shield.width(),shield.height()
				);
			}
			
			if(this.ttest instanceof Line){
				g.color = [0.8,0.0,0.0,1.0];
				g.scaleFillRect(
					this.ttest.start.x - c.x,
					this.ttest.start.y - c.y,
					this.ttest.width(),this.ttest.height()
				);
			}
		}
	}
}

var Combat = {
	"strike" : function(rect, ops){
		var offset = new Line( 
			this.position.add( new Point( rect.start.x * (this.flip ? -1.0 : 1.0), rect.start.y) ),
			this.position.add( new Point( rect.end.x * (this.flip ? -1.0 : 1.0), rect.end.y) )
		);
		
		offset.correct();
		this.ttest = offset;
		var hits = game.overlaps(offset);
		for(var i=0; i < hits.length; i++){
			if(hits[i].interactive){
				hits[i].trigger("struck",this)
				Combat.hit.apply(this, [hits[i], ops, offset]);
			}
		}
	},	
	"hit"  : function(obj, ops, rect){
		if(this.hitIgnoreList instanceof Array){
			if(this.hitIgnoreList.indexOf(obj) >= 0){
				//Object is ignore list, terminate hit
				return false;
			}
		}
		
		ops = ops || {};
		var multiplier = 1.0;
		var blockable = true;
		var direction = this.flip;
		
		if("multiplier" in ops){
			multiplier = ops["multiplier"] * 1;
		}
		
		var damage = Combat.getDamage.apply(this, [multiplier]);
		
		if("blockable" in ops){
			blockable = ops["blockable"] * 1;
		}
		if("damage" in ops){
			damage = ops["damage"];
		}
		
		if("direction" in ops){
			direction = !!ops["direction"];
		}
		
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !blockable || !obj.hasModule(mod_combat) ) {
				obj.hurt( this, damage );
			} else {
				var flip = obj.flip ? -1:1;
				var shield = obj.shieldArea();
				var flatDamage = obj.calcDamage(damage);
				
				if( obj.guard.active && (obj.guard.omidirectional||(direction!=obj.flip)) && shield.overlaps(rect) ){
					if(obj.guard.invincible <= 0){
						obj.guard.invincible = Game.DELTASECOND * 0.5;
						
						this.trigger("blocked",obj);
						obj.trigger("block",this,rect,flatDamage);
						
						this.useBuff("blocked", flatDamage, obj);
						obj.useBuff("block", flatDamage, this);
					}
				} else {
					//this.trigger("hurt_other",obj, damage);
					obj.hurt( this, damage );
				}
				
			}
			this.trigger("struckTarget", obj);
		}
	},
	"shieldArea" : function(){
		shield = new Line( 
			this.position.add( 
				new Point( 
					this.guard.x * this.forward(), 
					this.guard.y
				) 
			),
			this.position.add( 
				new Point( 
					(this.guard.x+this.guard.w) * this.forward(),
					this.guard.y+this.guard.h
				) 
			)
		);
		shield.correct();
		return shield;
	},
	"getDamage" : function(multiplier){
		if(multiplier == undefined){
			multiplier = 1.0;
		}
		
		this.damage = this.damage || 0;
		this.damageFire = this.damageFire || 0;
		this.damageSlime = this.damageSlime || 0;
		this.damageIce = this.damageIce || 0;
		this.damageLight = this.damageLight || 0;
		this.damageFixed = this.damageFixed || 0;
		
		return {
			"physical" : this.damage * multiplier,
			"fire" : this.damageFire * multiplier,
			"slime" : this.damageSlime * multiplier,
			"ice" : this.damageIce * multiplier,
			"light" : this.damageLight * multiplier,
			"fixed" : this.damageFixed * multiplier
		};
	},
	"calcDamage" : function(damage){
		if(damage instanceof Object){
			var fdamage = 0;
			if(damage.physical > 0){
				fdamage += Math.max(damage.physical - this.defencePhysical, 1);
			}
			if(damage.fire > 0){
				fdamage += Math.max(damage.fire - this.defenceFire, 1);
			}
			if(damage.slime > 0){
				fdamage += Math.max(damage.slime - this.defenceSlime, 1);
			}
			if(damage.ice > 0){
				fdamage += Math.max(damage.ice - this.defenceIce, 1);
			}
			if(damage.light > 0){
				fdamage += Math.max(damage.light - this.defenceLight, 1);
			}
			fdamage += damage.fixed;
			damage = Math.round(fdamage);
		} else {
			damage = Math.max(damage - this.defencePhysical, 1);
		}
		return Math.min(damage, 9999);
	}
}

var mod_boss = {
	"init" : function(){
		this.active = false;
		var x = this.position.x;
		var y = this.position.y;
		this.boss_starting_position = new Point(x,y);
		this.boss_intro = 0.0;
		this.bossface_frame = 0;
		this.bossface_frame_row = 0;
		this.boss_shutdoors = true;
		this.boss_showintro = true;
		this.bossdeatheffect = false;
		this.boss_id = "boss_"+game.newmapName+"_"+Math.floor(x)+"_"+Math.floor(y);
		
		var corner = new Point(256*Math.floor((x-16)/256), 240*Math.floor(y/240));
		this.boss_lock = new Line(
			corner.x,
			corner.y,
			512 + corner.x,
			240 + corner.y
		);
		
		this.reset_boss = function(){
			if(this.active){
				this.position.x = this.boss_starting_position.x;
				this.position.y = this.boss_starting_position.y;
				this.active = false;
				this.life = this.lifeMax;
				this.boss_intro = 0.0;
				
				_player.lock_overwrite = false;
				if(this.boss_shutdoors){
					Trigger.activate("boss_door");
				}
			}
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 120 && Math.abs( dir.y ) < 64 ){
					this.trigger("activate");
				}
			}
		}
		
		if(NPC.get(this.boss_id)){
			this.on("added", function(){
				this.destroy();
			})
		}
		
		this.on("player_death", function(){
			this.reset_boss();
		});
		this.on("activate", function() {
			if(this.boss_shutdoors){
				Trigger.activate("boss_door");
			}
			if(this.boss_showintro){
				game.slow(0.1, Game.DELTASECOND * 3);
			}
			
			//for(var i=0; i < this.boss_doors.length; i++ ) 
			//	game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, window.BLANK_TILE);
			//_player.lock_overwrite = this.boss_lock;
			this.active = true;
			this.interactive = true;
		});
		this.on("death", function() {
			if(this.boss_shutdoors){
				Trigger.activate("boss_door");
			}
			Trigger.activate("boss_death");
			
			NPC.set(this.boss_id, 1);
			
			//for(var i=0; i < this.boss_doors.length; i++ )
			//	game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
			_player.lock_overwrite = false;
		});
	},
	"update" : function(){
		this._boss_is_active();
		if( this._death_clock.at(Game.DELTASECOND*0.7) ){
			game.addObject(new EffectItemPickup(this.position.x, this.position.y));
			this.bossdeatheffect = true;
		}
	},
	"hudrender" : function(g,c){
		if( this.active && this.life > 0 ){
			var width = 160;
			var height = 8;
			var start = game.resolution.x * 0.5 - width * 0.5;
			var lifePercent = this.life / this.lifeMax;
			
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(start-1, game.resolution.y-25, width+2, height+2);
			g.color = [0.0,0.0,0.0,1.0];
			g.scaleFillRect(start, game.resolution.y-24, width, height);
			g.color = [1.0,0.0,0.0,1.0];
			g.scaleFillRect(start, game.resolution.y-24, width*lifePercent, height);
			
		}
		if(this.boss_showintro){
			if( this.active && this.boss_intro < 1.0){
				this.boss_intro += game.deltaUnscaled / (Game.DELTASECOND * 3);
				g.color = [0.0,0.0,0.0,0.3];
				
				var slide = Math.min(Math.sin(Math.PI*this.boss_intro)*4, 1);
				var border = Math.min(Math.sin(Math.PI*this.boss_intro)*3, 1) * 64;
				g.scaleFillRect(0, 0, game.resolution.x, border);
				g.scaleFillRect(0, game.resolution.y-border, game.resolution.x, border);
				
				var porta = Point.lerp(new Point(-90,60), new Point(40,60), slide);
				var portb = Point.lerp(new Point(game.resolution.x+90,60), new Point(game.resolution.x-40,60), slide);
				
				g.renderSprite("bossface",porta,this.zIndex,new Point(1,0),false);
				g.renderSprite("bossface",portb,this.zIndex,new Point(this.bossface_frame,this.bossface_frame_row),true);
			}
		}
	}
}

var mod_talk = {
	"init" : function(){
		this.open = 0;
		this.canOpen = true;
		this._talk_is_over = 0;
		
		this.close = function(){
			this.open = 0;
			DialogManger.dialogOpen = false;
			this.trigger("close");
		}
		
		this.talkMovePlayer = function(distance){
			var speed = 0.1;
			if(distance == undefined){
				distance = 40;
			}
			
			if(this.position.x > _player.position.x){
				this.flip = true;
				_player.flip = false;
				_player.position.x = Math.lerp(_player.position.x, this.position.x - distance, game.deltaUnscaled * speed);
			} else {
				this.flip = false;
				_player.flip = true;
				_player.position.x = Math.lerp(_player.position.x, this.position.x + distance, game.deltaUnscaled * speed);
			}
		}
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				this._talk_is_over = 2;
			}
		});
	},
	"update" : function(){
		if( !DialogManger.dialogOpen && this.canOpen && this.delta > 0 && this._talk_is_over > 0 && input.state("up") == 1 ){
			this.open = 1;
			DialogManger.dialogOpen = true;
			this.trigger("open");
		}
		this._talk_is_over--;
	},
	"render" : function(g,c){
		if( this.canOpen && this._talk_is_over > 0 && this.open < 1){
			var pos = _player.position.subtract(c);
			pos.y -= 24;
			g.renderSprite("text",pos,9999,new Point(4,6));
		}
	}
}

SpecialEnemy = function(enemy){
	/*
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
	*/
}

EnemyStruck = function(obj,pos,damage){
	/*
	if( this.team == obj.team ) return;
	var clife = this.life;
	this.hurt( obj, damage );
	if(clife != this.life) game.addObject(new EffectBlood(
		pos.x, pos.y, this.position.subtract(obj.position).normalize(), clife - this.life)
	);
	*/
}