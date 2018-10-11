class RhinoWrestler extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 64;
		this.sprite = "rhinowrestler";
		this.swrap = spriteWrap["rhinowrestler"];
		this.initPosition = new Point(x,y);
		
		this.speed = 8.0;
		this.gravity = 1.0;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.combat_player_combo_lock = false;
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.range = ops.getFloat("range", 176.0);
		this.moveLimit = this.range - 32;
		
		this.life = this.lifeMax = Spawn.life(20, this.difficulty);
		this.defenceNormal = Spawn.defence(1, this.difficulty);
		this.defenceBlocking = Spawn.defence(3, this.difficulty);
		this.damage = Spawn.damage(5, this.difficulty);
		this.mass = 4.0;
		this.combat_knockback_speed = 1.0;
		this.damageContactNormal = 0.5;
		this.damageContact = this.damageContactNormal;
		
		this.introanim = new RhinoWrestlerIntro(this);
		this.referee = new RhinoWrestlerReferee(x,y,d,ops);
		this.referee.parent = this;
		game.addObject(this.referee);
		
		
		this._suplex = 0.0;
		this._hop = false;
		this._dive = false;
		this._anim = 0.0;
		this._stomp = 0.0;
		this._spin = 0.0;
		this._dash = 0.0;
		this._rush = 0.0;
		this._escape = 0.0;
		this._jump = false;
		this._uppercut = false;
		this._prepuppercut = false;
		this._moveAway = false;
		this._blocking = 0.0;
		this._cooldown = RhinoWrestler.TIME_COOLDOWN;
		this._spotlight = new Point(x,y);
		this._afterimage = 0.0;
		this._stunlock = 0.0;
		this._stunhitcount = 0;
		
		this._uppercut_counter = 0.0;
		this._out_of_ring = RhinoWrestler.TIME_OUTOFRING;
		
		this.on("activate", function(){
			this.resetStates();
			
			if(RhinoWrestler.introduction){
				game.pause = true;
				RhinoWrestler.introduction = false;
				this.introanim.time = 0;
			}
		});
		this.on("intro_complete", function(){
			audio.playAs("music_boss01","music");
			game.pause = false;
		});
		this.on("land", function(){
			audio.play("burst1",this.position);
			shakeCamera(Game.DELTASECOND*0.25,3);
		});
		this.on("hurt", function(obj){
			if( this.defencePhysical >= this.defenceBlocking ){
				audio.play("block", this.position);
				this._cooldown -= 1.25;
				if( Math.random() > 0.75){
					console.log("Punch");
					this._anim = 0;
					this._dash = 0.0;
					this._spin = RhinoWrestler.TIME_SPIN;
				} else {
					this._blocking = RhinoWrestler.TIME_BLOCKING;
				}
			} else {
				audio.play("hurt", this.position);
				this._cooldown -= 0.75;
			}
			if(this._stunlock > 0){
				this._stunlock = RhinoWrestler.TIME_STUNLOCK;
				this._stunhitcount++;
			}
		});
		this.on("critical", function(obj, damage){
			this._stunlock = RhinoWrestler.TIME_STUNLOCK;
			this._stunhitcount = 0.0;
			this.criticalChance = 0.0;
			this.referee.shock();
		});
		this.on("hurt_other", function(obj, damage){
			this.referee.shock();
		});
		this.on("targetStomped", function(obj){
			this.resetStates();
			this.force.x = this.force.y = 0.0;
			this._dash = RhinoWrestler.TIME_STOMP;
			this._prepuppercut = true;
		});
		this.on("downstabbed", function(obj){
			this._uppercut_counter = 4.0;
		});
		this.on("collideObject", function(obj){
			if(this._dash > 0 && obj instanceof RhinoWrestlerEdge){
				if( (obj.position.x - this.boss_starting_position.x) * this.forward() > 0){
					this._ropes = RhinoWrestler.TIME_ROPES;
					this.flip = obj.position.x > this.position.x;
					this.force.x = 0;
				}
			} else if(obj instanceof Player){
				if(this.frame.x == 5 && this.frame.y == 0){
					this._rush = 0.0;
					this._suplex = RhinoWrestler.TIME_SUPLEX;
				} else if(this._dash > 0){
					/*
					if(this._dash < RhinoWrestler.TIME_DASH - Game.DELTASECOND * 0.5) {
						//Player has half a second to react before it hits him
						this._anim = 0;
						this._dash = 0.0;
						//this._spin = RhinoWrestler.TIME_SPIN;
						obj.hurt( this, this.getDamage() );
					}
					*/
				}
			}
		});
		this.on("player_death", function(){
			this.resetStates();
			this._out_of_ring = RhinoWrestler.TIME_OUTOFRING;
		});
		this.on("collideHorizontal", function(h){
			//this._dash = Math.min( this._dash, this.delta * 0.5);
		});
		
	}
	resetStates(){
		this._suplex = 0.0;
		this._hop = false;
		this._dive = false;
		this._stomp = 0.0;
		this._spin = 0.0;
		this._dash = 0.0;
		this._rush = 0.0;
		this._escape = 0.0;
		this._jump = false;
		this._uppercut = false;
		this._prepuppercut = false;
		this._moveAway = false;
		this._blocking = 0.0;
		this._stunlock = 0.0;
		this._stunhitcount = 0;
		this.gravity = 1.0;
	}
	update(){
		this._spotlight = Point.lerp(this._spotlight, this.position, this.delta * 2.2);
		Background.pushLight(this._spotlight, 200);
		
		if(this.life > 0){
			if(this.active){
				let dir = this.target().position.subtract(this.position);
				let init = this.initPosition.subtract(this.position);
				
				this._uppercut_counter -= this.delta;
				this.damageContact = this.damageContactNormal;
				this.criticalChance = 0.0;
				this.pushable = true;
				
				if(this._out_of_ring <= 0 && this.target().life > 0){
					this.target().life = 0;
					this.target().isDead();
				}
				
				if( this.targetOutsideRing() ){
					//Count down player
					this._anim += this.delta * 0.5;
					if( this._anim >= 1.0){ 
						this._anim = this._anim - 1;
						this.flip = !this.flip;
					}
					
					this.frame = this.swrap.frame("pose1", this._anim);
					
					this._out_of_ring -= this.delta;
					this.resetStates();
					
					let f = init.x < 0 ? -1 : 1;
					
					if( Math.abs( init.x ) > this.range * 0.5 ){
						this.addHorizontalForce( this.speed * f);
					}
					
				} else if(this._suplex > 0){
					this.damageContact = 0.0;
					let p = 1 - this._suplex / RhinoWrestler.TIME_SUPLEX;
					let smashPoint = this.position.add( new Point(this.forward() * -48, 16) );
					this.frame = this.swrap.frame("suplex", p);
					this._suplex -= this.delta;
					
					this.target().pause = true;
					this.target().showplayer = this.target().interactive = false;
					this.target().position = Point.lerp(this.target().position, smashPoint, this.delta * 4.0 );
					
					if( this._suplex <= 0){
						this._anim = 0;
						this._hop = true;
						this.grounded = false;
						this.force.y = -8;
						this.position.x = this.position.x + this.forward() * -48;
						this.frame.x = 0;
						this.frame.y = 3;
						
						this.target().invincible = 0.0;
						this.target().hurt( this, this.getDamage() );
						this.target().pause = false;
						this.target().showplayer = this.target().interactive = true;
					}
				} else if( this._hop ) {
					//Exit suplex
					this._anim = Math.clamp01(this._anim + this.delta * 1.1);
					this.frame = this.swrap.frame("hop", this._anim);
					this.force.y -= this.delta * UNITS_PER_METER * 0.7;
					if(this.grounded){
						this._hop = false;
					}
				} else if( this._stunlock > 0){
					let d = 1 - this._stunlock / RhinoWrestler.TIME_STUNLOCK;
					this.frame = this.swrap.frame("hurt", d * 7.5);
					
					this._stunlock -= this.delta;
					if(this._stunlock <= 0 || this._stunhitcount >= 3) {
						this.resetStates();
						this._escape = RhinoWrestler.TIME_ESCAPE;
					}
				} else if( this._rush > 0){
					//Rush at player for suplex
					this._rush -= this.delta;
					this.damageContact = 0.0;
					this._dash = this._ropes = 0.0;
					
					if( this._rush > RhinoWrestler.TIME_RUSH - 0.5) {
						//Wait
						this.frame = this.swrap.frame("pose2", 0);
						this.force.x = 0.0;
					} else if(this._rush > 0.4) {
						this.frame = this.swrap.frame("rush", 0);
						this.addHorizontalForce(this.forward() * this.speed * 2);
					} else {
						this.frame = new Point(2, 5);
						this.criticalChance = 1.0;
					}
					
					this._afterimage -= this.delta;
					if(this._afterimage <= 0 ){
						let ef = new EffectAfterImage(this.position.x, this.position.y, [], Options.convert({
							"sprite" : this.sprite,
							"frame_x" : this.frame.x,
							"frame_y" : this.frame.y,
							"flip" : this.flip,
							"z_index" : this.zIndex -1
						}));
						game.addObject(ef);
						this._afterimage += 0.25;
					}
					
				} else if( this._uppercut ){
					//Uppercut
					this._prepuppercut = false;
					this._dash = this._ropes = 0.0;
					let p = Math.clamp01( 1 - this._anim / RhinoWrestler.TIME_UPPERCUT );
					
					if( p < 1 || this.force.y < 0) {
						this.frame = this.swrap.frame("uppercut", p);
						this.addHorizontalForce(this.forward() * this.speed * 0.65);
					} else {
						//falling back down
						this.criticalChance = 1.0;
						this.frame.x = 3; this.frame.y = 3;
					}
					
					this._anim -= this.delta;
					
					if(this.grounded && this._anim <= 0){
						if(this._anim > 0 - this.delta){
							this.grounded = false;
							this.force.y = -8;
						} else {
							this._uppercut = false;
						}
					} else {
						this.force.y -= this.delta * UNITS_PER_METER * 0.7;
					}
					
				} else if( this._stomp > 0 ){
					//Stamp foot on canvas
					let p = 1 - this._stomp / RhinoWrestler.TIME_STOMP;
					this.frame = this.swrap.frame("stomp", p);
					this._stomp -= this.delta;
					this._dash = this._ropes = 0.0;
					
					if(Timer.isAt(this._stomp, RhinoWrestler.TIME_STOMP * 0.4, this.delta ) ) {
						shakeCamera(Game.DELTASECOND*0.3,2);
						this.stomp();
					}
				} else if( this._ropes > 0 ){
					let d = this._ropes / RhinoWrestler.TIME_ROPES;
					this.position.x += this.forward() * -9.0 * d * this.delta;
					this.frame = this.swrap.frame("ropes", 0);
					this._ropes -= this.delta;
				} else if( this._dash > 0 ){
					//Dash
					this._anim = Math.mod(this._anim + this.delta * 1.2, 1.0);
					this.frame = this.swrap.frame("dash", this._anim);
					this._dash -= this.delta;
					if( this._dash > RhinoWrestler.TIME_DASH - 0.8) {
						//Run on spot
						this.force.x = 0;
						if(Timer.interval(this._dash, 0.24, this.delta)){
							audio.play("swing",this.position);
							Background.pushSmoke(this.position.add(new Point(0,32)), 12, new Point(this.forward()*-8, -2), 0);
						}
					} else {
						this.addHorizontalForce(this.speed * 3.0 * this.forward());
						this.damageContact = 0.75;
						this.pushable = false;
					}					
					
					if( this._prepuppercut ){
						if( Math.abs(this.position.x - this.target().position.x ) < 80 ){
							this._dash = this._ropes = 0.0;
							this._uppercut = RhinoWrestler.TIME_UPPERCUT;
						}
					}
					if( this._dash <= 0){
						this._anim = 0;
						this._spin = RhinoWrestler.TIME_SPIN;
						this._prepuppercut = false;
					}
				} else if( this._spin > 0 ){
					this.defencePhysical = this.defenceNormal;
					this._anim = Math.clamp01(this._anim + this.delta * 1.5);
					this.frame = this.swrap.frame("punch", this._anim);
					this._spin -= this.delta;
					
					if( this._anim < 0.6 ){
						this.criticalChance = 1.0;
					}
				} else if (this._escape > 0){
					if( this._escape >= RhinoWrestler.TIME_ESCAPE * 0.5){
						//wait
						this.frame = new Point(2, 5);
						this._escape -= this.delta;
					} else if ( this._escape > 0.125 ) {
						//Jump
						this.grounded = false;
						this.force.y = -8; 
						this.flip = this.position.x > this.boss_starting_position.x;
						this.force.x = this.forward() * this.speed;
						this.frame = new Point(3, 3);
						this._escape = 0.125;
					} else if( this.grounded ){
						//Land
						this._escape = 0.0;
					} else {
						this.force.y -= this.delta * UNITS_PER_METER * 0.7;
					}
				} else if (this._jump){
					//Jump into the air
					this.addHorizontalForce(this.speed * this.forward());
					this.force.y -= this.delta * UNITS_PER_METER * 0.7;
					this.frame.x = this.frame.y = 3;
					
					if( Math.abs(dir.x) < 80 && Math.abs(this.force.y) < 3.0 ){
						this._jump = false;
						this._dive = RhinoWrestler.TIME_DIVE;
					}
					if( this.grounded ){
						this._jump = false;
					}
				} else if (this._dive > 0.0){
					//Dive with elbow
					this.damageContact = 0.0;
					this.frame = this.swrap.frame("elbow", 0);
					this.force.y -= this.delta * UNITS_PER_METER * 0.7;
					
					if( this.grounded ){
						if( this.frame.x == 3 ){ shakeCamera(Game.DELTASECOND*0.3,2); }
						this.frame = this.swrap.frame("elbow_land", 0);
						this._dive -= this.delta;
						this.criticalChance = 1.0;
					}
				} else if( this._blocking > 0 ) {
					//Blocking
					this._blocking -= this.delta;
					this.frame = this.swrap.frame("block", 0);
				} else {
					this._cooldown -= this.delta;
					this.defencePhysical = this.defenceBlocking;
					this._out_of_ring = RhinoWrestler.TIME_OUTOFRING;
					
					if( this._uppercut_counter > 0 && this.target().position.y < this.position.y ){
							//Defensive uppercut
							this._uppercut = true; 
							this._anim = RhinoWrestler.TIME_UPPERCUT;
							this.defencePhysical = this.defenceNormal;
							this._uppercut_counter = 0.0;
							
					} else if( Math.abs( init.x ) < this.moveLimit && this._cooldown < 0  ) {
						
						
						this._cooldown = RhinoWrestler.TIME_COOLDOWN * (this.life/this.lifeMax);
						this.defencePhysical = this.defenceNormal;
						this.flip = dir.x < 0;
						
						 if( Math.abs(dir.x) < 64 ) {
							//Near
							this._anim = 0;
							let r = Math.floor( Math.random() * 4 );
							switch( r ){
								case 0: this._rush = RhinoWrestler.TIME_RUSH; break;
								case 1: this._stomp = RhinoWrestler.TIME_STOMP; break;
								case 2: this._dash = RhinoWrestler.TIME_DASH; break;
								case 3: this._uppercut = true; this._anim = RhinoWrestler.TIME_UPPERCUT; break;
							}
						} else {
							//Far
							this._anim = 0;
							let r = Math.floor( Math.random() * 4 );
							switch( r ){
								case 0: this._rush = RhinoWrestler.TIME_RUSH; break;
								case 1: this._stomp = RhinoWrestler.TIME_STOMP; break;
								case 2: this._dash = RhinoWrestler.TIME_DASH; break;
								case 3: this._jump = true; this.grounded = false; this.force.y = -8; this.force.x = this.forward() * this.speed; break;
							}
						}
					
					} else {
						//too far from center
						this._anim = Math.mod( this._anim + this.delta * this.force.x * this.forward(), 1.0 );
						this.frame = this.swrap.frame("walk", this._anim );
						this.flip = dir.x < 0;
						
						let f = init.x < 0 ? -1 : 1;
						
						if(this._moveAway && Math.abs(this.position.x - this.boss_starting_position.x) > 96 ) {
							this._moveAway = false;
						} else if(!this._moveAway && Math.abs(this.position.x - this.boss_starting_position.x) < 8 ) {
							this._moveAway = true;
						}
						
						if( Math.abs( init.x ) > 16 ){
							this.addHorizontalForce( this.speed * f);
						}
					}
				}
			} else {
				//Waiting for player
				this.frame.x = this.frame.y = 0;
			}
		} else {
			//Dead
			if( this.grounded ){
				this.frame.x = 4;
				this.frame.y = 6;
				if(!this.isOnscreen()){
					this.destroy();
				}
			} else {
				this.frame.x = 4;
				this.frame.y = 5;
			}
			
		}
	}
	targetOutsideRing(){
		let t = this.target();
		
		if( this._out_of_ring >= RhinoWrestler.TIME_OUTOFRING){
			return t.position.y > this.initPosition.y+20 && t.grounded && Math.abs(t.position.x - this.initPosition.x) > this.range;
		} else {
			return !(t.position.y <= this.initPosition.y+20 && t.grounded && Math.abs(t.position.x - this.initPosition.x) <= this.range);
		}
		
	}
	render(g,c){
		super.render(g,c);
		if( this.frame.y in RhinoWrestler.SUPLEX_PLAYER ){
			if( this.frame.x in RhinoWrestler.SUPLEX_PLAYER[this.frame.y] ){
				
				let data = RhinoWrestler.SUPLEX_PLAYER[this.frame.y][this.frame.x];
				let hurt = new Point(10, 1);
				let p = new Point( this.forward() * data.p.x, data.p.y );
				
				g.renderSprite( "player", this.position.add(p).subtract(c), this.zIndex+data.z, hurt, !this.flip, {"rotation":data.r} );
				
			}
		}
		
	}
	hudrender(g,c){
		if(this.active){
			if(!this.introanim.complete) {
				this.introanim.render(g);
			} else if( this._out_of_ring < RhinoWrestler.TIME_OUTOFRING){
				let s = "Out of ring forfeit: " + Math.max( Math.floor(this._out_of_ring), 0 );
				let p = (game.resolution.x * 0.5) - (s.length * 4);
				textArea(g, s, p, 56, game.resolution.x, 64);
			}
		}
	}
	stomp(){
		let b = new GroundBolt(this.position.x, this.position.y);
		b.parent = this;
		b.force.x = this.forward() * 12;
		b.damage = Math.floor( this.damage * 0.5 );
		b.damageLight = 0;
		b.lightRadius = 0;
		b.speed = this.forward() * 24;
		b.on("struckTarget", function(obj){
			if( obj.hasModule(mod_rigidbody) ){
				obj.grounded = false;
				obj.force.y = -10;
			}
			if( obj.hasModule(mod_combat) ){
				obj.combat_knockback.x = 0.0;
				obj.combat_knockback.y = -2.0;
				this.parent.trigger("targetStomped", obj);
			}
		});
		game.addObject(b);
	}
	idle(){}
}
RhinoWrestler.introduction = true;
RhinoWrestler.TIME_SUPLEX = 1.0;
RhinoWrestler.TIME_STOMP = 1.25;
RhinoWrestler.TIME_DASH = 2.5;
RhinoWrestler.TIME_SPIN = 1.5;
RhinoWrestler.TIME_UPPERCUT = 0.7;
RhinoWrestler.TIME_ESCAPE = 1.0;
RhinoWrestler.TIME_RUSH = 1.8;
RhinoWrestler.TIME_DIVE = 0.8;
RhinoWrestler.TIME_COOLDOWN = 2.5;
RhinoWrestler.TIME_BLOCKING = 0.5;
RhinoWrestler.TIME_ROPES = 1.25;
RhinoWrestler.TIME_OUTOFRING = 10.95;
RhinoWrestler.TIME_STUNLOCK = 3.0;
RhinoWrestler.SUPLEX_PLAYER = {
	"4" : {"3": {p:new Point(32,16), r:0, z:-1 } },
	"5" : {"3": {p:new Point(-16,-32), r:-90, z:-1 } },
	"6" : {"3": {p:new Point(-48,16), r:-140, z:-1 } },
	
	"0" : { "4" : {p:new Point(-48,16), r:-140, z:-1 } }
	//"2" : {"0" : {p:new Point(32,16), r:0, z:-1 }, "1" : {p:new Point(-16,-32), r:-90, z:-1 }, "2" : {p:new Point(-48,16), r:-140, z:-1 }, "3" : {p:new Point(-48,16), r:-140, z:-1 } }
};

class RhinoWrestlerEdge extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.visible = false;
		this.width = d[0];
		this.height = d[1];
		
		this.addModule(mod_block);
		
		this.blockCollideCriteria = function(obj){ 
			if( obj.hasModule(mod_rigidbody) ){
				if( obj instanceof RhinoWrestler) {
					return obj._ropes <= 0 && obj._dash <= 0;
				} else {
					return true;
				}
			} 
			return false;
		}
	}
	idle(){}
}

self["RhinoWrestler"] = RhinoWrestler;
self["RhinoWrestlerEdge"] = RhinoWrestlerEdge;

class RhinoWrestlerIntro {
	get complete(){ return this.time >= this.scene.duration + 16; }
	
	constructor(parent){
		this.scene = cutscenes["rhino"];
		this.time = 99999;
		this.parent = parent;
		this.zIndex = 999;
	}
	render(g){
		if(this.time < this.scene.duration){
			cutscenes["rhino"].render(g,new Point, this.time );
			if( input.state("pause") == 1 ){ this.time = this.scene.duration; }
		} else if(this.time < this.scene.duration + 15 ){
			audio.stopAs("music");
			let time = this.time - this.scene.duration;
			
			let centerx = game.resolution.x * 0.5;
			let text1 = "\"Don't let this guy intimidate you.\"";
			let text2 = "\"I'll smash your puny body to pieces.\"";
			let t1_prog = Math.clamp01((time-4)/2);
			let t2_prog = Math.clamp01((time-8)/2);
			
			g.color = [0,0,0,1];
			g.drawRect(0,0,game.resolution.x, game.resolution.y, this.zIndex-1);
			//cop
			g.renderSprite("cutscene_punchout", new Point(centerx-96,160), this.zIndex, new Point(1,(game.time*3.5)%2), false);
			//Mac
			g.renderSprite("cutscene_punchout", new Point(centerx-96,160), this.zIndex+1, new Point(2,0), false);
			textArea(g,"Lil Rex",centerx-136,208,80,80);
			textArea(g,text1.substring(0, text1.length*t1_prog),centerx-136,64,80,80);
			//Rhino
			g.renderSprite("cutscene_punchout", new Point(centerx+96,96), this.zIndex, new Point(0,(game.time*0.8)%2), false);
			textArea(g,"Champion",centerx+56,40,80,80);
			textArea(g,text2.substring(0, text2.length*t2_prog),centerx+56,148,80,80);
			
			textArea(g,"VS",centerx-8,116,80,80);
			
			//Play talk sounds
			if(time > 4 && time < 6){
				if(Timer.interval(game.time, 0.1, game.deltaUnscaled)){
					audio.play("text01");
				}
			}
			if(time > 8 && time < 10){
				if(Timer.interval(game.time, 0.1, game.deltaUnscaled)){
					audio.play("text01");
				}
			}
			
			if( input.state("pause") == 1 ){ 
				//player skip
				if(time < 6 ) { this.time = this.scene.duration + 6; }
				else if(time < 10 ) { this.time = this.scene.duration + 10; }
				else {this.time = 99999;}
			}
		} else {
			//Pause for a moment
		}
		
		this.time += game.deltaUnscaled;
		if(this.complete){ 
			this.parent.trigger("intro_complete");
		}
	}
}

class RhinoWrestlerReferee extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 32;
		this.sprite = "referee";
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		this.friction = 0.05;
		this.speed = 6;
		this.tint = [0.4,0.5,0.6,1];
		
		this._idle = 0.0;
		this._shock = 0.0;
		this._goto = new Point(x,y);
		
		this.parent = null;
	}
	shock(){
		this._shock = 2.0;
	}
	idle(){}
	update(){
		this.visible = true;
		if(this.parent.life <= 0 || !this.parent.active){
			this.visible = false;
		} else if(this._shock > 0){
			//Put hands over face
			let d = 1 - (this._shock / 2.0);
			this.frame.x = 1;
			this.frame.y = Math.min(d * 12, 3);
			this._shock -= this.delta;
		} else if(this._idle > 0 ){
			if(Math.abs(this.force.x) < 0.1 ){
				this.frame.x = 0;
				this.frame.y = (game.timeScaled * 4) % 4;
			} else {
				this.frame.x = 3;
				this.frame.y = 3;
			}
			this._idle -= this.delta;
			if(this._idle <= 0 ){
				this._goto = Point.lerp(this.parent.position, this.parent.target().position, 0.5);
			}
		} else {
			this.frame.x = 0
			let dis = Math.abs(this.position.x - this._goto.x);
			this.flip = this.position.x > this._goto.x;
			this.frame = RhinoWrestlerReferee.ANIM_RUN.frame((game.timeScaled * 1.6) % 1);
			this.addHorizontalForce(this.forward() * this.speed);
			if(dis < 16) {
				this._idle = Math.randomRange(1.5,2.5);
			}
		}
	}
}
RhinoWrestlerReferee.ANIM_RUN = new Sequence([ [2,0,0.1],[2,1,0.1],[2,2,0.1],[2,3,0.1],[3,0,0.1],[3,1,0.1] ]);