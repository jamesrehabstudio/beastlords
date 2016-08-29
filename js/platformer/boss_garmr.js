Garmr.prototype = new GameObject();
Garmr.prototype.constructor = GameObject;
function Garmr(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "garmr";
	this.speed = 3.8;
	
	this.active = false;
	this.closeToBoss = false;
	this.track = null;
	
	this.projection = new Point(x,y);
	this.projectionFrame = new Point(2,0);
	this.projectionFlip = false;
	
	this.frame.x = 0;
	this.frame.y = 3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops["trigger"];
	}
	if("difficulty" in ops){
		this.difficulty = ops["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.lifeMax = this.life;
	this.mass = 5.0;
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("activate", function() {
		this.treads = Trigger.getTargets("bosstrack")[0];
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,40);
		this.destroy();
	});
	this.calculateXP();
	
	this._boss_is_active = function(){
		if( !this.active ) {
			this.interactive = false;
			var area = new Line(
				this.position.x - 160,
				this.position.y,
				this.position.x + 160,
				this.position.y + 960
			);
			
			if( area.overlaps(_player.position) ){
				game.slow(0.1, Game.DELTASECOND * 3);
				this.active = true;
				this.trigger("activate");
			}
		}
	}
	
	this.states = {
		"current" : Garmr.STATE_FIRECOLUMN,
		"time" : 0.0,
		"transition" : 0.0,
		"goto" : new Point(x,y)
	}
}

Garmr.STATE_FIRECOLUMN = 0;
Garmr.STATE_LIGHTNING = 1;
Garmr.STATE_ZOOMATTACK = 2;
Garmr.STATE_SMASHPLATFORM = 3;
Garmr.STATE_GUST = 4;
Garmr.STATE_BULLETHELL = 5;


Garmr.prototype.setState = function(s){
	this.states.current = s;
	
	if(this.states.current == Garmr.STATE_FIRECOLUMN){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y - 80;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
	if(this.states.current == Garmr.STATE_LIGHTNING){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x;
		this.states.goto.y = _player.position.y - 80;
	}
	if(this.states.current == Garmr.STATE_ZOOMATTACK){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
	if(this.states.current == Garmr.STATE_SMASHPLATFORM){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
	}
	if(this.states.current == Garmr.STATE_GUST){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
	}
	if(this.states.current == Garmr.STATE_BULLETHELL){
		this.states.time = Game.DELTASECOND * 4;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
}
Garmr.prototype.update = function(){
	if ( this.life > 0 && this.active ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.transition > 0){
			this.projectionFrame.x = (this.projectionFrame.x + this.delta * 0.1) % 4;
			this.projectionFrame.y = 0;
			
			this.projection.x = Math.lerp(this.projection.x,this.states.goto.x,this.delta*0.1);
			this.projection.y = Math.lerp(this.projection.y,this.states.goto.y,this.delta*0.1);
			this.states.transition -= this.delta;
		} else {
			if(this.states.current == Garmr.STATE_FIRECOLUMN){
				if(this.states.time > 0 ){
					//Drop flames
					if(Timer.isAt(this.states.time,Game.DELTASECOND,this.delta)){
						var xoff = 32;
						for(var i=0; i < 6; i++){
							var xpos = (this.projectionFlip?-1:1) * xoff;
							var ftower = new FlameTower(xpos+this.projection.x, this.projection.y);
							ftower.damage = this.damage;
							ftower.time = Game.DELTASECOND * i * -0.4;
							game.addObject(ftower);
							xoff += Math.random()>0.5 ?  40 : 80;
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_LIGHTNING);
				}
			}
			if(this.states.current == Garmr.STATE_LIGHTNING){
				if(this.states.time > Game.DELTASECOND){
					//Move to center of the screen
					this.projection.y = this.treads.position.y - 40;
					this.projectionFrame.x = 0;
					this.projectionFrame.y = 1;
				} else if(this.states.time > 0 ){
					//Drop lightening
					this.projectionFrame.x = 4;
					this.projectionFrame.y = 1;
					
					var xoff = this.position.x - 160;
					for(var i=0; i < 4; i++){
						if(Timer.isAt(this.states.time,Game.DELTASECOND,this.delta)){
							var lightning1 = new LightningBolt(xoff,this.projection.y);
							var lightning2 = new LightningBolt(xoff,this.projection.y);
							lightning1.speed = -2;
							lightning2.speed = 2;
							lightning1.damage = lightning2.damage = this.damage;
							game.addObject(lightning1);
							game.addObject(lightning2);
							xoff += 80;
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_ZOOMATTACK);
				}
			}
			if(this.states.current == Garmr.STATE_ZOOMATTACK){
				if(this.states.time > Game.DELTASECOND){
					//Move to edge of the screen
					this.projection.y = this.treads.position.y - 40;
				} else if(this.states.time > 0 ){
					//Zoom across
					var flytoright = this.states.goto.x < this.position.x;
					var flyto = this.position.x + (flytoright ? 160 : -160);
					if((flytoright && this.projection.x < flyto) || (!flytoright && this.projection.x > flyto)){
						this.projection.x += this.speed * this.delta * 5 * (flytoright?1:-1);
						var hits = game.overlaps(new Line(
							this.projection.x - 32,
							this.projection.y - 32,
							this.projection.x + 32,
							this.projection.y + 32
						));
						var playerIndexhits = hits.indexOf(_player);
						if(playerIndexhits>=0){
							hits[playerIndexhits].hurt(this,this.damage);
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_GUST);
				}
			}
			if(this.states.current == Garmr.STATE_GUST){
				if(this.states.time > 0 ){
					//blow player back
					this.projectionFrame.x = Math.max((this.projectionFrame.x+this.delta)%3,1);
					this.projectionFrame.y = 2;
					
					if(_player.position.x > this.projection.x){
						this.projectionFlip = false;
						_player.force.x += this.delta * 0.7;
					} else {
						this.projectionFlip = true;
						_player.force.x += this.delta * -0.7;
					}
					this.projection.y = _player.position.y - 40;
				} else {
					//Next state
					this.setState(Garmr.STATE_BULLETHELL);
				}
			}
			if(this.states.current == Garmr.STATE_BULLETHELL){
				if(this.states.time > 0 ){
					//Fire wave of bullets
					this.projection.y = this.treads.position.y - 40;
					this.projectionFrame.x = Math.max((this.projectionFrame.x+this.delta)%3,1);
					this.projectionFrame.y = 2;
					
					if(Timer.interval(this.states.time, Game.DELTASECOND*0.3, this.delta)){
						var xoff = 64 * this.projectionFlip ? -1 : 1;
						var yoff = Math.random() < 0.333  ? -8 : (Math.random() < 0.5 ? 14 : -32 );
						var bullet = new PhantomBullet(this.projection.x + xoff, this.projection.y + yoff);
						bullet.damage = Math.ceil(0.7 * this.damage);
						bullet.force.x = this.projectionFlip ? -4 : 4;
						game.addObject(bullet);
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_FIRECOLUMN);
				}
			}
			
			this.states.time -= this.delta;
		}
		
		Background.pushLight(this.projection, 240);
	}
}
Garmr.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	try {
		if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
			var flip = this.projection.x - _player.position.x > 0;
			g.renderSprite(this.sprite,this.projection.subtract(c),this.zIndex+1,this.projectionFrame, this.projectionFlip);
		}
	} catch (err){}
}
Garmr.prototype.idle = function(){}