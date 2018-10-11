class Skeleton extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "skele";
		this.swrap = spriteWrap["skele"];
		this.width = 20;
		this.height = 32;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.life = this.lifeMax = Spawn.life(6, this.difficulty);
		this.xpDrop = Spawn.xp(6,this.difficulty);
		this.damage = Spawn.damage(5, this.difficulty);
		this.moneyDrop = Spawn.money(5,this.difficulty);
		this.combat_player_combo_lock = false;
		this.speed = 4.0;
		
		this.on("hurt", function(obj){
			audio.play("hurt",this.position);
			
			this._escape = Skeleton.TIME_ESCAPE;
			this._cooldown = 0.0;
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
		
		this._counterPrep = 0.0;
		this._attack = 0.0;
		this._jumpattack = 0.0;
		this._uppercut = 0.0;
		this._escape = 0.0;
		this._anim = 0.0;
		this._cooldown = 0.0;
		this._retreat = 0.0;
	}
	update(){
		if(this.life > 0){
			let dir = this.target().position.subtract(this.position);
			
			if(this._attack > 0){
				//attack
				this._attack -= this.delta;
				
				let p = 1 - this._attack / Skeleton.TIME_ATTACK;
				this.frame = this.swrap.frame("attack", p);
				
				if(p > 0.4 && p < 0.6){
					this.addHorizontalForce(this.speed * 4 * this.forward());
				}
			} else if(this._jumpattack > 0){
				//jump attack
				if(this._jumpattack >= Skeleton.TIME_JUMPATTACK){
					this.grounded = false;
					this.force.y = -6;
				} else if(!this.grounded){
					this.force.y -= UNITS_PER_METER * this.gravity * 0.5 * this.delta;
					this.addHorizontalForce(this.speed * this.forward());
				}
				this._jumpattack -= this.delta;
				
				let p = 1 - this._jumpattack / Skeleton.TIME_JUMPATTACK;
				this.frame = this.swrap.frame("jumpattack", p);
			} else if(this._uppercut > 0){
				//Uppercut
				this._uppercut -= this.delta;
				
				if( Timer.isAt(this._uppercut, Skeleton.TIME_UPPERCUT*0.66, this.delta) ){
					this.grounded = false;
					this.force.y = -8;
				} else if(this._uppercut < Skeleton.TIME_UPPERCUT * 0.66){
					this.force.y -= UNITS_PER_METER * this.gravity * 0.5 * this.delta;
				}
				
				let p = 1 - this._uppercut / Skeleton.TIME_UPPERCUT;
				this.frame = this.swrap.frame("uppercut", p);
			} else if(this._counterPrep > 0){
				//Prep counter
				this._counterPrep -= this.delta;
				this.frame.x = 0;
				this.frame.y = 2;
				
				if( Math.abs(dir.x) < 64 ){
					this._counterPrep = 0.0;
					this._uppercut = Skeleton.TIME_UPPERCUT;
					this._cooldown = 2.5;
				}
			} else if(this._escape > 0){
				//Escape
				if(this._escape >= Skeleton.TIME_ESCAPE){
					this.grounded = false;
					this.force.y = -3.0;
					this.force.x = this.speed * 2 * -this.forward();
				} else {
					this.force.y -= UNITS_PER_METER * this.gravity * 0.5 * this.delta;
				}
				
				this._escape -= this.delta;
				
				if(!this.grounded && this._escape <= 0){
					this._escape = this.delta;
				}
				
				let p = this._escape / Skeleton.TIME_ESCAPE;
				this.frame = this.swrap.frame("escape", p);
			} else {
				//Move
				this._anim = ( this._anim + this.delta * Math.abs(this.force.x) ) % 1.0;
				this.frame = this.swrap.frame("walk", this._anim);
				
				this.flip = dir.x < 0;
				if( Math.abs(dir.x) < 48) { this._retreat = 1.0;}
				let direction = this.forward() * (this._retreat > 0 ? -1 : 1);
				this.addHorizontalForce(this.speed * direction);
				
				this._cooldown -= this.delta;
				this._retreat -= this.delta;
				
				if(this._cooldown <= 0){
					if(this.atLedge() && this.grounded){
						this._jumpattack = Skeleton.TIME_JUMPATTACK;
					} else if(!this.target().grounded && dir.y < 32){
						this._counterPrep = Skeleton.TIME_COUNTERPREP;
						this._cooldown = 1.5;
					} else if( Math.abs(dir.x) < 64 ){
						this.flip = dir.x < 0;
						this._attack = Skeleton.TIME_ATTACK;
						this._cooldown = 2.0;
					}
				}
			}
		} else {
			this.frame.x = 4;
			this.frame.y = 4;
		}
	}
}
Skeleton.TIME_ATTACK = 1.0;
Skeleton.TIME_JUMPATTACK = 1.0;
Skeleton.TIME_UPPERCUT = 1.0;
Skeleton.TIME_COUNTERPREP = 2.0;
Skeleton.TIME_ESCAPE = 0.5;

self["Skeleton"] = Skeleton;
