class Chort extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "gatekeeper";
		this.swrap = spriteWrap["gatekeeper"];
		this.start = this.position.scale(1);
		this.width = 24;
		this.height = 30;
		this.speed = 12;
		
		this.addModule( mod_boss );
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(16, this.difficulty);
		this.spinLife = Math.floor( this.lifeMax * 0.125 );
		this.damage = Spawn.damage(5, this.difficulty);
		this.combat_player_combo_lock = false;
		this.combat_canbecomedeathbullet = false;
		this.flip = true;
		
		this._state = 0;
		this._time = 0.0;
		this._timeMax = 1.0;
		this._transition = 0.0;
		this._transitionMax = 1.0;
		this._blocked = 0.0;
		this._ducking = false;
		this._turntime = 1.0;
		this._count = 0;
		
		this._showText = false;
		this._playend = true;
		this._showFace = true;
		
		this._cutscene = false;
		
		this.on("player_death", function(){
			this.setState(Chort.STATE_IDLE);
			this._playend = true;
			this._showFace = true;
		});
		this.on( [ "hurt_other", "blocked" ], function(obj, damage){
			if( this._state == Chort.STATE_SPIN ){
				this.flip = obj.position.x > this.position.x;
			}
		});
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
			this.life = Math.max( this.life, this.spinLife );
			
			if( this._playend && this.life <= this.spinLife ){
				this.trigger("end_scene");
				this._playend = false;
			}
			
			if( this._blocked > 0){
				this._blocked = 0.0;
				this.setState( Chort.STATE_ESCAPE );
			}
			
		});
		this.on("end_scene", function() {
			DialogManager.set( i18n("boss_chort_02") );
			
			this._transition = 2.0;
			this._time = 8.0;
			this._cutscene = true;
			game.pause = true;
		});
		this.on("activate", function() {
			DialogManager.set( i18n("boss_chort_01") );
			
			if( Chort.play_intro ){
				Chort.play_intro = false;
				this._transition = 0.0;
				this._cutscene = true;
				game.pause = true;
			}
		});
		this.on("block", function(obj){
			audio.play("block", this.position);
			this._blocked = 1.0;
			this.force.x = this.forward() * -this.speed * 0.3;
		});
		this.on("collideHorizontal", function(h){
			if( this._state == Chort.STATE_SPIN ){
				this.flip = !this.flip;
				this.force.x = 0.0;
			}
		});
		this.on("death", function(obj, damage){
			this.destroy();
		});
		this.on("collideVertical", function(v){
			if( this.life <= this.spinLife && v < 0 ){
				this.trigger("death");
			}
		});
	}
	setState(n){
		this._state = n;
		if( n == Chort.STATE_IDLE ) {
			let plife = this.life / this.lifeMax;
			this._time = this._timeMax = 3.0 * plife;
		} else if( n == Chort.STATE_DASH ) {
			this._transition = this._transitionMax = 0.6;
			this._time = this._timeMax = 3.0;
		} else if( n == Chort.STATE_ATTACK1 ) {
			this._time = this._timeMax = 1.0;
		} else if( n == Chort.STATE_ATTACK2 ) {
			this._time = this._timeMax = 0.8;
		} else if( n == Chort.STATE_SPIN ) {
			this._transition = this._transitionMax = 0.6;
			this._time = this._timeMax = 5.0;
		} else if( n == Chort.STATE_ESCAPE ) {
			this._transition = this._transitionMax = 0.25;
			this._time = this._timeMax = 1.0;
		}
	}
	idle(){}
	update(){
		this._showText = false;
		
		if( this.active ) {
			
			if( this._cutscene ) {
				
				if( this._transition <= 0.0 ) {
					//Play dialog
					this._showText = true;
					
					if( !DialogManager.filling ){
						this.frame = this.swrap.frame("talk", Math.mod(game.time * 4, 1));
					} else {
						this.frame = this.swrap.frame("talk", 0);
					}
					
					if( !DialogManager.show ){
						this._cutscene = false;
						game.pause = false;
					}
				} else {
					this._transition -= game.deltaUnscaled;
					
					//Move player and boss
					if( this.target().position.x > this.position.x ){
						this.position.x = Math.lerp(this.position.x, this.start.x, game.deltaUnscaled);
						this.target().position.x = Math.lerp(this.target().position.x, this.start.x + 128, game.deltaUnscaled);
					} else{
						this.position.x = Math.lerp(this.position.x, this.start.x, game.deltaUnscaled);
						this.target().position.x = Math.lerp(this.target().position.x, this.start.x - 128, game.deltaUnscaled);
					}
					this.frame = this.swrap.frame("talk", 0);
				}
				
			} else if( this.life > this.spinLife ){
			
				let p = 1 - Math.clamp01( this._time / this._timeMax );
				let t = 1 - Math.clamp01( this._transition / this._transitionMax );
				let dir = this.target().position.subtract(this.position);
				
				this._transition -= this.delta;
				if( this._transition <= 0){
					this._time -= this.delta;
				}
				
				if( this._showFace ){
					game.addObject( new BossIntro(3) );
					this._showFace = false;
				}
				
				if( this._blocked > 0.0 ) {
					this._blocked -= this.delta;
					let anim = this._ducking ? "blockdown" : "blockup";
					this.frame = this.swrap.frame( anim, 0);
					
				} else if( this._state == Chort.STATE_IDLE ) {
					this.frame = this.swrap.frame("idle", t);
					this.flip = dir.x < 0;
					
					if( this._time <= 0 ){
						let roll = Math.random();
						
						if( roll > 0.5 ){
							if( Math.abs( dir.x ) < 72 ) {
								this.setState(Chort.STATE_ATTACK1);
							} else {
								this.setState(Chort.STATE_DASH);
							}
						} else {
							this.setState(Chort.STATE_SPIN);
						}
					} else if( this.target().isAttacking && Math.abs(dir.x) < 72 ){
						//Try to block player
						this._ducking = this.target().states.duck;
						this._blocked = 1.0;
					}
					
				} else if( this._state == Chort.STATE_DASH ) {
					if( t < 1) {
						this.frame = this.swrap.frame("hop", t);
					} else {
						this.frame = this.swrap.frame("run", Math.mod( game.timeScaled * 2.0, 1 ) );
						this.addHorizontalForce(this.forward() * this.speed);
						
						if( Math.abs( dir.x ) < 64 ) {
							this.setState(Chort.STATE_ATTACK1);
						} else if( this._time <= 0 ){
							this.setState(Chort.STATE_IDLE);
						}
					}
				} else if( this._state == Chort.STATE_ATTACK1 ) {
					this.frame = this.swrap.frame("attack1", p);
					
					if( this._time <= 0 ){
						if( Math.random() > 0.5 ){
							this.setState(Chort.STATE_ATTACK2);
						} else {
							this.setState(Chort.STATE_IDLE);
						}
					}
					
				} else if( this._state == Chort.STATE_ATTACK2 ) {
					this.frame = this.swrap.frame("attack2", p);
					
					if( this._time <= 0 ){
						this.setState(Chort.STATE_IDLE);
					}
					
				} else if( this._state == Chort.STATE_SPIN ) {
					if( t < 1) {
						this.frame = this.swrap.frame("prespin", t);
					} else {
						this.frame = this.swrap.frame("spin", Math.mod( game.timeScaled * 3.0, 1 ) );
						this.addHorizontalForce(this.forward() * this.speed);
						
						if( this.forward() * dir.x < 0 ){
							this._turntime -= this.delta;
							if( this._turntime <= 0) {
								this.flip = !this.flip;
							}
						} else {
							this._turntime = 0.6;
						}
						
						if( this._time <= 0 ){
							this.setState(Chort.STATE_IDLE);
						}
					}
				} else if( this._state == Chort.STATE_ESCAPE ) {
					if( t < 1) {
						this.frame = this.swrap.frame("hop", t);
					} else {
						this.frame = this.swrap.frame("hop", 1 );
						if( this._time > 0 && this.grounded ) {
							this.force.y = -8;
							this.force.x = this.forward() * -this.speed;
						} else if( this.grounded ) {
							this.setState(Chort.STATE_IDLE);
							this._time = 0.125;
						} else {
							this.force.y -= 0.7 * UNITS_PER_METER * this.delta;
						}
					}
				}
			} else {
				//Nearly dead
				this.frame = this.swrap.frame("spin", Math.mod( game.timeScaled * 3.0, 1 ) );
				this._time -= this.delta;
				
				if( this._time <= 0 && Math.abs(this.position.x - this.start.x) < 48 ){
					//Take off
					this.gravity = 0.0;
					this.grounded = false;
					this.force.y = -3;
				} else {
					//Move towards the center
					this.flip = this.target().position.x < this.position.x;
					this.addHorizontalForce(this.forward() * this.speed);
				}
			}
			
		} else {
			this.flip = true;
			this.frame = this.swrap.frame("idle", 0);
		}
	}
	hudrender(g,c){
		if ( this._showText ){
			DialogManager.render(g);
		}
	}
}
Chort.play_intro = true;
Chort.STATE_IDLE = 0;
Chort.STATE_DASH = 1;
Chort.STATE_ATTACK1 = 2;
Chort.STATE_ATTACK2 = 3;
Chort.STATE_SPIN = 4;
Chort.STATE_ESCAPE = 5;

self["Chort"] = Chort;