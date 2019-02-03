class FireKeeper extends GameObject {
	get activeBlockCount(){ let out=0; for(let i=0; i < this._blocks.length; i++) if(!this._blocks[i].dropped){ out++; }; return out; }
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 64;
		
		//this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this._mapremoved = false;
		this._lava = new Array();
		this._blocks = new Array();
		this._btoponly = new Array();
		
		this._blockRotation = 0.0;
		this._blockSpeed = 0.25;
		this._blockOffset = new Point(32,32);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(64, this.difficulty);
		this.startTrigger = ops.getString("deathtrigger", "firekeeperstart");
		this.deathTrigger = ops.getString("deathtrigger", "firekeeperdeath");
		this.damageContact = 0.0;
		this.damage = Spawn.damage(5, this.difficulty);
		this.death_time = 2.0;
		
		this._state = 0;
		this._state_previous = -1;
		this._time = 3;
		this._timeMax = 3;
		this._subTime = 0;
		this._count = 0;
		
		this._pendulum = {r:0.0,speed:0.0,ext:0.0};
		this._gun = {p:new Point(), flip:false, active:false};
		
		this.force = new Point();
		
		this.on("pendulum_hit", function(obj){
			if( obj instanceof Player ){
				obj.hurt(this, this.getDamage());
			}
		});
		this.on("hurt", function(obj, damage){
			
			
			let expectedBlocks = Math.clamp( Math.floor(this.life / this.lifeMax * 5), 0, 4);
			if(expectedBlocks < this.activeBlockCount){
				this.dropLargeBlock();
				
				if(this.activeBlockCount <= 0){
					this.setState(FireKeeper.STATE_DRILL);
				}
			}
		});
		
		this.on("activate", function(){
			Trigger.activate(this.startTrigger);
		});
		this.on("added", function(){
			this.setMap(false);
		});
		this.on("destroy", function(){
			let mappos = this.position.scale(1/256,1/240).floor();
			let tileindex = mappos.x + mappos.y * Math.floor(game.map.width/16);
			this.setMap(true);
		});
		this.on("pre_death", function(){
			this._lava.setLevel(8);
		});
		this.on("death", function(){
			Trigger.activate(this.deathTrigger);
			
			for(let i=0; i < this._btoponly.length; i++){
				this._btoponly[i].active = false;
				this._btoponly[i].position = this.boss_starting_position.add(new Point(-512,0));
			}
			this.destroy();
		});
	}
	setMap(open){
		if( this._mapremoved ) { return; }
		if( open ) { this._mapremoved = true; }
		
		let tile = open ? 146 : 22;
		let pos = this.boss_starting_position.add(new Point(128,-80)).scale(1/256,1/240).floor();
		let index = pos.x + pos.y * Math.floor(game.map.width/16);
		game.map.map[index] = tile;
	}
	getObjects(){
		this._lava = Trigger.getTargets("firekeeper_lava")[0];
		this._blocks = Trigger.getTargets("firekeeper_block");
		this._btoponly = Trigger.getTargets("firekeeper_blocktop");
		
		for(let i=0; i < this._blocks.length; i++){
			this._blocks[i].force = new Point();
			this._blocks[i].dropped = false;
		}
		
		for(let i=0; i < this._btoponly.length; i++){
			this._btoponly[i].parent = this;
			this._btoponly[i].active = false;
			this._btoponly[i].force = new Point();
			
			
			this._btoponly[i].on("collideTop", function(obj){
				if( obj instanceof Player ){
					this.force.y += this.delta * UNITS_PER_METER * 3;
				}
			});
		}
	}
	
	setGunPosition(home=false){
		//Move gun
		let gunSpeed = 8;
		this._gun.active = true;
		if(Math.abs(this._gun.p.x) < 64){
			//In middle
			let direction = this.target().position.x > this.boss_starting_position.x ? -1 : 1;
			let speed = direction * this.delta * UNITS_PER_METER * gunSpeed;
			
			if(home){
				direction = this._gun.p.x > 0 ? -1 : 1;
				speed = direction * this.delta * UNITS_PER_METER * gunSpeed;
				
				if(Math.abs(speed) >= Math.abs(this._gun.p.x) ){
					this._gun.p.x = 0;
					this._gun.active = false;
				} else {
					this._gun.p.x = Math.clamp(this._gun.p.x + speed, -64,64);
				}
			} else {			
				this._gun.p.x = Math.clamp(this._gun.p.x + speed, -64,64);
			}
			this._gun.p.y = 0;
		} else {
			let tdif = this.target().position.x - this.boss_starting_position.x;
			if(tdif * this._gun.p.x > 0 || home){
				//Move towards zero
				let direction = this._gun.p.y > 0 ? -1 : 1;
				let speed = direction * this.delta * UNITS_PER_METER * gunSpeed;
				
				if(Math.abs(this._gun.p.y) <= Math.abs(speed) ){
					this._gun.p.x = this._gun.p.x > 0 ? 63.5 : -63.5;
					this._gun.p.y = 0;
				} else {
					this._gun.p.y += speed;
				}
			} else {
				//Move towards target
				let direction = (this.boss_starting_position.y + this._gun.p.y) > this.target().position.y ? -1 : 1;
				let speed = this.delta * UNITS_PER_METER * gunSpeed;
				let tdif = Math.abs( this.target().position.y - (this._gun.p.y + this.boss_starting_position.y) );
				
				this._gun.p.y += direction * Math.min(tdif, speed);
			}
		}
	}
	setBlockLocations(){
		
		if(this._state == FireKeeper.STATE_DRILL){
			//Smash body into ceiling
			let ceilPos = this.boss_starting_position.y - 144;
			if( this.position.y > ceilPos ){ 
				this.force.y -= this.delta * UNITS_PER_METER;
				this.position.y += this.force.y * this.delta * UNITS_PER_METER;
				
				if( this.position.y <= ceilPos ){ 
					//Hit ceiling
				}
			} else {
				this.force.y = 0;
				this.position.y = ceilPos;
			}
		} else if( this._state == FireKeeper.STATE_IDLE ){
			//Return to mid
			this.position.y += this.delta * UNITS_PER_METER * 3;
			this.position.y = Math.min(this.position.y, this.boss_starting_position.y);
			this.force.y = 0;
		}
		
		for(let i=0; i < this._blocks.length; i++){
			let p = Math.mod(this._blockRotation + i, 4);
			let d = Math.mod(p,1);
			let block = this._blocks[i];
			
			if( block.dropped ){
				let floor = this.boss_starting_position.y + 160;
				block.force.y += this.delta * UNITS_PER_METER;
				block.position.y = Math.min( block.position.y + block.force.y * this.delta * UNITS_PER_METER, floor );
			} else {
				
				if(p<1){ 
					block.position.x = this.boss_starting_position.x + Math.lerp(-112,112,d);
					block.position.y = this.boss_starting_position.y - 112;
				} else if(p<2){ 
					block.position.x = this.boss_starting_position.x + 112;
					block.position.y = this.boss_starting_position.y + Math.lerp(-112,112,d);
				} else if(p<3){ 
					block.position.x = this.boss_starting_position.x + Math.lerp(112,-112,d);
					block.position.y = this.boss_starting_position.y + 112;
				} else {
					block.position.x = this.boss_starting_position.x - 112;
					block.position.y = this.boss_starting_position.y + Math.lerp(112,-112,d);
				}
				block.position = block.position.subtract(this._blockOffset);
			}
		}
		
		for(let i=0; i < this._btoponly.length; i++){
			if(this._btoponly[i].active ) {
				let blk = this._btoponly[i];
				
				blk.position = blk.position.add(blk.force.scale(this.delta * UNITS_PER_METER));
				//blk.force = blk.force.scale(1 - this.delta * 0.9);
				//blk.force.y += this.delta * blk.gravity * UNITS_PER_METER;
				
				if(blk.position.y > this.boss_starting_position.y + 192){
					blk.active = false;
					blk.position = this.boss_starting_position.add(new Point(-512,0));
					//blk.position.y = this.boss_starting_position.y - 208;
					//blk.position.x = this.boss_starting_position.x + Math.floor(Math.randomRange(-12,12)) * 16;
				}
				
			}
		}
	}
	dropLargeBlock(){
		shakeCamera(0.3,4);
		
		let order = [0,2,1,3];
		for(let i=0; i < this._blocks.length; i++){
			let j = order[i];
			if( !this._blocks[j].dropped ){
				this._blocks[j].dropped = true;
				this._lava.setLevel(48 + (i+1) * 16);
				this._blocks[j].blockCollide = false;
				return;
			}
		}
	}
	dropSmallBlock(){
		for(let i=0; i < this._btoponly.length; i++){
			if( !this._btoponly[i].active ){
				
				this._btoponly[i].position.x = this.boss_starting_position.x + Math.floor(Math.randomRange(-10,10)) * 16;
				this._btoponly[i].position.y = this.boss_starting_position.y - 192;
				this._btoponly[i].force.y = 2.0;
				this._btoponly[i].active = true;				

				return;
			}
		}
	}
	dropBolder(){
		let x = this.boss_starting_position.x + Math.randomRange(-128,128);
		let y = this.boss_starting_position.y - 224;
		
		let parts = game.addObject( new ParticleSystem(x,y,[6,6],Options.convert({
			"frame_x" : 1,
			"frame_y" : 2,
			"gravity" : 0.5,
			"time" : 1,
			"loop" : true,
			"count" : 12,
			"startForce" : 1,
			"allowIdle" : false
		})) );
		
		let bolder = new GameObject();
		bolder.parts = parts;
		bolder.position.x = x;
		bolder.position.y = y;
		bolder.widht = bolder.height = 28;
		bolder.force = new Point();
		bolder.sprite = "bullets";
		bolder.wait = 2;
		bolder.frame = new Point(3,0);
		bolder.damage = this.damage;
		bolder.idle = function(){};
		bolder.update = function(){
			this.wait -= this.delta;
			this.parts.loop = this.wait > 0;
			
			if(this.wait > 0){
				this.position.y += this.delta * 32;
			} else if(this.wait <= -3) {
				this.destroy();
				this.parts.loop = false;
			} else {
				this.force.y += this.delta * 0.25 * UNITS_PER_METER;
				this.position = this.position.add(this.force.scale(this.delta * UNITS_PER_METER));
			}
		}
		bolder.on("struck", function(obj){
			this.destroy();
			this.parts.loop = false;
		});
		bolder.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt(this, Combat.getDamage.apply(this));
				this.destroy();
				this.parts.loop = false;
			}
		});
		
		game.addObject(bolder.parts);
		game.addObject(bolder);
	}
	dropFlame(){
		let fire = game.addObject(new Fire(this.position.x, this.position.y));
		fire.idle = function(){};
		fire.friction = 0.1;
		fire.force.x = Math.randomRange(-4,4);
		fire.force.y = -8;
	}
	fireGun(targetPosition){
		let org = this.boss_starting_position.add(this._gun.p);
		let dif = targetPosition.subtract(org);
		let dir = dif.normalize();
		let angle = dif.toAngle();
		
		audio.play("bullet1", org);
					
		for(let i=0; i < 2; i++){
			let offset = i < 1 ? -1 : 1;
			let perp = new Point(-dir.y, dir.x).scale(offset * 8);
			var bullet = new Bullet(org.x + perp.x, org.y + perp.y);
			bullet.team = this.team;
			bullet.frame.x = 4;
			bullet.force = dir.scale(8);
			bullet.rotation = -angle * Math.rad2deg;
			bullet.damage = this.damage;
			game.addObject(bullet);
		}
	}
	nextState(){
		//return FireKeeper.STATE_DRILL;
		if(this.activeBlockCount <= 0){
			return FireKeeper.STATE_DRILL;
		} else {
			let rl = new RandomList();
			rl.add(FireKeeper.STATE_DRILL);
			rl.add(FireKeeper.STATE_BULLET);
			rl.add(FireKeeper.STATE_FLAMES);
			rl.add(FireKeeper.STATE_GUNS);
			if( this.activeBlockCount > 1 ) { rl.add(FireKeeper.STATE_PENDULUM); }
			
			rl.remove(this._state_previous);
			this._state_previous = rl.pick();
			return this._state_previous;
		}
	}
	setState(s){
		this._state = s;
		
		if(s == FireKeeper.STATE_IDLE){
			this._time = this._timeMax = 2.0;
		} else if(s == FireKeeper.STATE_DRILL){
			this._gun.active = false;
			this._pendulum.ext = 0.0;
			this._time = this._timeMax = 3.0;
			this._count = 12;
		} else if(s == FireKeeper.STATE_FLAMES){
			this._time = this._timeMax = 2.0;
			this._count = 24;
		} else if(s == FireKeeper.STATE_PENDULUM){
			this._time = this._timeMax = 2.0;
			this._pendulum.r = 0.0;
			this._count = 2;
		} else if(s == FireKeeper.STATE_GUNS){
			this._time = this._timeMax = 4.0;
			this._count = 32;
		} else if(s == FireKeeper.STATE_BULLET){
			this._time = this._timeMax = 3.0;
			this._count = 6;
		}
	}
	idle(){}
	update(){
		this.setBlockLocations();
		
		if(this.life > 0){
			
			if(this._blocks.length <= 0){
				this.getObjects();
			}
			
			
			if(this.active){
				
				this._blockRotation = (this._blockRotation + this.delta * this._blockSpeed) % 4;
				
				this._time -= this.delta;
				let d = 1 - this._time / this._timeMax;
				
				if(this._state == FireKeeper.STATE_IDLE) {
					
					this.position.y = Math.min(this.position.y + this.delta * UNITS_PER_METER, this.boss_starting_position.y);
					this.setGunPosition(true);
					
					if(this._time <= 0){
						this.setState(this.nextState());
					}
				} else if(this._state == FireKeeper.STATE_DRILL) {
					if(this._time > 0){
						//
					} else if(this._subTime <= 0){
						this.dropSmallBlock();
						this._count--;
						
						if(this._count % 4 == 2){
							this.dropBolder();
						}
						
						if(this._count > 0){
							this._subTime = 0.6;
						} else if(this.activeBlockCount <= 0){
							//Just keep drilling until death
							this._count = 99;
						} else {
							this.setState(FireKeeper.STATE_IDLE);
						}
					} else {
						this._subTime -= this.delta;
						shakeCamera(0.125,1);
					}
				} else if(this._state == FireKeeper.STATE_FLAMES) {
					
					if(this._time > 0){
						//building flames and moving
						this.position = Point.lerp(this.boss_starting_position, this.boss_starting_position.add(new Point(0,-64)), d);
					} else if(this._count <= 0){
						//Move back to home
						this.position.y += this.delta * 8 * UNITS_PER_METER;
						if(this.position.y >= this.boss_starting_position.y){
							this.position.y = this.boss_starting_position.y;
							this.setState(FireKeeper.STATE_IDLE);
						}
					} else if(this._subTime <= 0){
						//Drop flame
						this.dropFlame();
						this._count--;
						this._subTime = 0.25;
					} else {
						this._subTime -= this.delta;
					}
					
				} else if(this._state == FireKeeper.STATE_PENDULUM) {
					let poly = FireKeeper.PENDULUM_POLY.scale(new Point(1,this._pendulum.ext)).rotate(this._pendulum.r * -Math.rad2deg).translate(this.position);
					let hits = game.polyOverlaps(poly);
					for(let i=0; i < hits.length; i++){ this.trigger("pendulum_hit", hits[i] ); }
					
					if(this._time > 0){
						this._pendulum.ext = Math.lerp(0.0, 256.0, d);
						this._blockSpeed = 0.0;
					} else if(this._subTime > 0) {
						let pen_dir = this._pendulum.speed > 0 ? 1 : -1;
						this._pendulum.speed = Math.clamp(this._pendulum.speed + this.delta * 1.5 * pen_dir, -1, 1);
						this._pendulum.r += this.delta * this._pendulum.speed;
						this._subTime -= this.delta;
					} else if( this._count > 0 ){
						this._count--;
						this._pendulum.speed = this._pendulum.speed > 0 ? -0.01 : 0.01;
						this._blockSpeed = this._pendulum.speed > 0 ? 0.25 : -0.25;
						this._subTime = Math.randomRange(8,14);
					} else {
						this._pendulum.ext -= this.delta * 256;
						if(this._pendulum.ext <= 0.0){
							this._pendulum.ext = 0.0;
							this.setState(FireKeeper.STATE_IDLE);
						}
					}
				} else if(this._state == FireKeeper.STATE_GUNS) {
					if(this._time > 0){
						//Aim
						this.setGunPosition();
					} else if(this._subTime <= 0 ){
						this.fireGun(new Point(this.boss_starting_position.x, this.boss_starting_position.y + this._gun.p.y) );
						this._count--;
						
						if(this._count > 0){
							this._subTime = FireKeeper.TIME_BULLET * 0.5;
						} else {
							this.setState(FireKeeper.STATE_IDLE);
						}
					} else {
						//Find new location
						this._subTime -= this.delta;
					}
				} else if(this._state == FireKeeper.STATE_BULLET) {
					
					if(this._time > 0){
						//
					} else if(this._subTime <= 0 ){
						this.fireGun(this.target().position);
						this._count--;
						
						if(this._count > 0){
							this._subTime = FireKeeper.TIME_BULLET;
						} else {
							this.setState(FireKeeper.STATE_IDLE);
						}
					} else {
						this._subTime -= this.delta;
					}
				}
			}
			
		}
		
	}
	render(g,c){
		g.color = [1.0,0.8,0.0,1.0];
		g.drawRect(
			this.position.x - 32 - c.x,
			this.position.y - 32 - c.y,
			this.width,
			this.height,
			this.zIndex
		);
		
		if(this._state == FireKeeper.STATE_BULLET || this._gun.active){
			g.color = [1.0,0.2,0.0,1.0];
			g.drawRect(
				this.position.x + this._gun.p.x - c.x - 16,
				this.position.y + this._gun.p.y - c.y - 16,
				32, 32,
				this.zIndex + 1
			);
		}
		
		if(this._pendulum.ext > 0){
			let org = new Point(-16,0).rotate(this._pendulum.r);
			g.renderSprite("white", this.position.add(org).subtract(c), this.zIndex-1, new Point(), false, {
				"rotation" : this._pendulum.r * Math.rad2deg,
				"scalex" : 32,
				"scaley" : this._pendulum.ext
			});
		}
	}
}
FireKeeper.STATE_IDLE = 0;
FireKeeper.STATE_BULLET = 1;
FireKeeper.STATE_DRILL = 2;
FireKeeper.STATE_FLAMES = 3;
FireKeeper.STATE_PENDULUM = 4;
FireKeeper.STATE_GUNS = 5;

FireKeeper.TIME_BULLET = 0.3;

FireKeeper.PENDULUM_POLY = new Polygon([
	new Point(-16,0.125), new Point(16,0.125),
	new Point(16,1), new Point(-16,1)
]);


self["FireKeeper"] = FireKeeper;