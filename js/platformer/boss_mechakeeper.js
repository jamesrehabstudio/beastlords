class MechaKeeper extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 64;
		
		this.wheelYOffset = 56;
		this.wheels = game.addObject(new MechaKeeperWheels(x,y + this.wheelYOffset));
		
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.damageContact = 0.0;
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(40, this.difficulty);
		this.damage = Spawn.damage(9, this.difficulty);
		this.force = new Point();
		this.speed = 16;
		
		this._state = 0;
		this._time = 0.0;
		this._timeMax = 1.0;
		this._subtime = 0.0;
		this._count = 1;
		this._goto = false;
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
		});
	}
	fireBullet(){
		let dif = this.target().position.subtract(this.position);
		let dir = dif.normalize();
		let angle = Math.randomRange(-0.2,0.2) - dif.toAngle();
		
		audio.play("bullet1", this.position);
					
		var bullet = new Bullet(this.position.x, this.position.y - 32);
		bullet.team = this.team;
		bullet.frame.x = 4;
		bullet.force = Point.fromAngle(angle).scale(4).add(this.wheels.force);
		bullet.rotation = angle * Math.rad2deg;
		bullet.damage = this.damage;
		game.addObject(bullet);
	}
	fireMissile(){
		let ops = new Options();
		ops["team"] = this.team;
		ops["damage"] = this.damage;
		ops["rotation"] = -90;
		let missile = Bullet.createHomingMissile(this.position.x + this.forward() * 16, this.position.y, ops);
		game.addObject(missile);
	}
	idle(){}
	setState(s){
		this._state = s;
		if(this._state == MechaKeeper.STATE_BULLETS ){
			this._time = 3.0;
			this._count = 16;
			this._subtime = 0.0;
		} else if( this._state == MechaKeeper.STATE_MISSILES ){
			this._count = 3;
			this._subtime = 0.0;
		}
	}
	update(){
		if( this.life > 0 && this.active){
			
			if(this._state == MechaKeeper.STATE_IDLE ){
				this.setState(MechaKeeper.STATE_MISSILES);
			} else if(this._state == MechaKeeper.STATE_BULLETS ){
				//Fire bullet
				this._subtime -= this.delta;
				
				if(this._time > 0){
					this._time -= this.delta;
				} else if(this._subtime <= 0){
					if(this._count > 0){
						this._count--;
						this._subtime = 0.25;
						this.fireBullet();
					} else {
						this.setState(MechaKeeper.STATE_MISSILES);
					}
				}
				
			} else if( this._state == MechaKeeper.STATE_MISSILES ){
				//Fire Missiles
				this._subtime -= this.delta;
				
				if(this._subtime <= 0){
					if(this._count > 0){
						this._count--;
						this._subtime = 1.0;
						this.fireMissile();
					} else {
						this.setState(MechaKeeper.STATE_BULLETS);
					}
				}
			}
			
			this.updatePosition();
			
		} else {
			this.wheels.force.x = this.wheels.force.y = 0.0;
		}
	}
	updatePosition(){
		let target = this.target().position.scale(1);
		if(this._goto instanceof Point){ target = this._goto; }
		
		this.flip = target.x < this.position.x;
		this.wheels.force.x += this.forward() * this.delta * this.speed;
		this.wheels.force = this.wheels.force.scale(1.0 - this.delta * 0.2 * UNITS_PER_METER);
		this.wheels.position.x += this.wheels.force.x * this.delta * UNITS_PER_METER;
		
		this.force.x = Math.lerp(this.force.x, this.wheels.force.x, this.delta);
		this.force.x = 1 - this.delta * 0.2 * UNITS_PER_METER;
		this.position.x += this.force.x * this.delta * UNITS_PER_METER;
		
		if(this.position.x - this.wheels.position.x > MechaKeeper.SLIDE_LIMIT) {
			this.force.x = this.wheels.force.x;
			this.position.x = this.wheels.position.x + MechaKeeper.SLIDE_LIMIT;
		} else if(this.position.x - this.wheels.position.x < -MechaKeeper.SLIDE_LIMIT) {
			this.force.x = this.wheels.force.x;
			this.position.x = this.wheels.position.x - MechaKeeper.SLIDE_LIMIT;
		}
	}
	render(g,c){
		let topleft = this.position.subtract(new Point(this.width, this.height).scale(0.5));
		g.color = [1.0,0.5,0.0,1.0];
		g.drawRect(
			topleft.x - c.x, topleft.y - c.y, this.width, this.height, this.zIndex
		);
	}
}
MechaKeeper.STATE_IDLE = 0;
MechaKeeper.STATE_MISSILES = 1;
MechaKeeper.STATE_BULLETS = 2;
MechaKeeper.SLIDE_LIMIT = 16;

class MechaKeeperWheels extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 160;
		this.height = 48;
		
		this.addModule(mod_block);
		this.blockTopOnly = true;
		this.riders = new Array();
		this.force = new Point(4,0);
		
		this.on("blockOnTop",function(obj){
			if(this.riders.indexOf(obj) < 0){
				this.riders.push(obj);
			}
		});
	}
	idle(){}
	update(){
		for(let i=0; i < this.riders.length; i++){
			if(this.block_isOnboard(this.riders[i])){
				this.riders[i].position.x += this.force.x * this.delta * UNITS_PER_METER;
			} else {
				this.riders.remove(i);
				i--;
			}
		}
	}
	render(g,c){
		let topleft = this.position.subtract(new Point(this.width, this.height).scale(this.origin.x, this.origin.y));
		g.color = [1.0,0.25,0.0,1.0];
		g.drawRect(
			topleft.x - c.x, topleft.y - c.y, this.width, this.height, this.zIndex
		);
	}
}

self["MechaKeeper"] = MechaKeeper;