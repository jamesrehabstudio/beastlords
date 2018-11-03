class Biker extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPosition = this.position.scale(1);
		
		this.width = 64;
		this.height = 24;
		this.zIndex = 12;
		this.sprite = "biker";
		
		this.addModule(mod_block);
		this.addModule(mod_rigidbody);
		
		this.blockTopOnly = true;
		this.pushable = false;
		this.friction = 0.01;
		this.collisionReduction = -1.0;
		this.breaks = 0.8;
		this.acceleration = 0.25;
		this.speed = 8;
		this.active = false;
		
		this._onboardLastFrame = false;
		this._breaking = false;
		
		this.on("player_death", function(){
			this.position = this.initPosition.scale(1);
			this.force.x = this.force.y = 0;
			this.active = false;
		});
		this.on("blockLand", function(obj){
			if(obj instanceof Player){
				this.active = true;
			}
		});
		this.on("collideObject", function(obj){
			if(obj instanceof BreakableBlock){
				obj.life = 0;
				obj.isDead();
			}
		});
		this.on(["collideLeft", "collideRight"], function(obj){
			if( obj instanceof Player ){
				//obj.position.x = this.position.x;
				obj.position.y = this.position.y - (12 + obj.height * obj.origin.y );
			} else if( obj.hasModule( mod_combat ) ){
				if( Math.abs( this.force.x ) > Biker.TOP_SPEED ){
					obj.life = 0;
					obj.isDead();
				}
			}
		});
		this.on("collideHorizontal", function(h){
			if( Math.abs(this.force.x) > Biker.TOP_SPEED && !this._breaking ){
				if( this.block_isOnboard( _player ) ){
					_player.combat_knockback.x = this.force.x * -2.0;
					_player.force.y = Math.abs(this.force.x) * -1.0;
					_player.grounded = false;
				}
			}
			this.force.x *= 0.25;
		});
	}
	idle(){}
	update(){
		let rider = _player;
		this._breaking = false;
		
		if( this.active ){
		
			if( this.block_isOnboard(rider) ){
				this._onboardLastFrame = true;
				
				if(rider.states.duck){
					//this._breaking = true;
					//this.force.x *= 1 - this.breaks * this.delta;
					this._breaking = false;
					this.addHorizontalForce( this.speed * 2.0 * rider.forward(), this.acceleration * 2.0 );
				} else {
					this._breaking = this.flip != rider.flip;
					this.addHorizontalForce( this.speed * rider.forward(), this.acceleration );
				}
				
			} else {
				if( this._onboardLastFrame ){
					this._onboardLastFrame = false;
					rider.force.x += this.force.x * 1.2;
				}
				
				//Try to get to player
				if( Math.abs( this.position.x - rider.position.x ) > 48 ){
					if(this.position.x > rider.position.x ){
						this._breaking = !this.flip;
						this.addHorizontalForce( this.speed * -1, this.acceleration );
					} else {
						this._breaking = this.flip;
						this.addHorizontalForce( this.speed * 1, this.acceleration );
					}
				} else {
					this._breaking = true;
				}
			}
		
		}
		
		if(this._breaking){
			//Breaking
			this.frame.x = 3;
		} else if ( Math.abs( this.force.x ) > Biker.TOP_SPEED ){
			this.frame.x = 0;
		} else if ( Math.abs( this.force.x ) > Biker.TOP_SPEED * 0.5 ){
			this.frame.x = 1;
		} else {
			this.frame.x = 2;
		}
		
		this.flip = this.force.x < 0;
	}
	
}
Biker.TOP_SPEED = 1.25;
self["Biker"] = Biker;