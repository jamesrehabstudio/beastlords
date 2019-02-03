class Flederknife extends GameObject{
	constructor(x, y, d, o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 30;
		this.sprite = "flederknife";
		this.speed = 6.0;
		this.blockKnockback = 8.0;
		this.collideKnockback = 3.0;
		this.turndelay = 0.0;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		this.addModule( mod_creep );
		
		this.states = {
			"jump" : 0,
			"down" : 0,
			"jump_tick" : 1
		};
		
		o = o || {};
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in o){
			this.difficulty = o["difficulty"] * 1;
		}
		
		this.life = this.lifeMax = Spawn.life(3,this.difficulty);
		this.lifeMax = Spawn.life(3,this.difficulty);
		this.damage = Spawn.life(1,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		this.xpDrop = Spawn.xp(3,this.difficulty);
		this.mass = 1.0;
		
		this.checkAttackArea = function(ops){
			if(this.life > 0 && this.grounded){
				
				let strike = new Line(0, -6, 12, -4);
				if(this.states.duck){
					strike = new Line(0, 6, 12, 8);
				}
				Combat.attackCheck.apply(this,[ strike.scale(this.forward(),1).transpose(this.position).correct() ]);
			}
		}
		this.on("hurt", function(){
			this.force.x = 0;
		});
		this.on(["blocked","hurt_other"], function(obj){
			this.flip = !this.flip;
			this.force.x = 0;
		});
		this.on("hurt", function(){
			
		});
		this.on("collideObject", function(obj){
			if(this.life > 0){
				if(obj.hasModule(mod_combat) && obj.hasModule(mod_rigidbody)){
					this.flip = obj.position.x > this.position.x;
					this.force.x = this.forward();
				}
			}
		});
		this.on("collideHorizontal", function(dir){
			if(this.life > 0){
				this.flip = !this.flip;
				this.force.x = 0.0;
			}
		});
		this.on(["added","wakeup"], function(){
			var dir = this.position.subtract( _player.position );
			this.faceTarget();
			this.states.jump_tick = 1;
			
			if(this.difficulty > 0){
				this.states.duck = Math.round(Math.random());
			}
			if(this.difficulty > 1){
				this.states.jump_tick = Math.floor(Math.random()*3);
			}
		});
		this.on("death", function(){
			
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.creep_hide();
		});
		
	}
	update(){
		if ( this.stun <= 0 && this.life > 0 ) {
			var dir = this.position.subtract( _player.position );
			
			this.addHorizontalForce(this.speed * this.forward());
			
			if(this.atLedge()){
				this.force.x = 0;
				this.flip = !this.flip;
			}
			
			if(this.states.jump && this.grounded){
				this.states.jump = 0;
				this.faceTarget();
				this.force.y -= this.delta * 3;
			} 

			
			
			if(this.states.jump_tick <= 0 && this.grounded && Math.abs(dir.x) < 80){
				//Jump behind the player
				this.states.jump = 1;
				this.grounded = false;
				this.force.y = -12;
				this.force.x = this.forward() * 300;
				this.states.jump_tick = 2 + Math.floor(Math.random()*3);
			}
			this.turndelay -= this.delta; 
			
			
			/* Animation */
			
			if( this.states.jump ){
				this.frame.x = (this.frame.x + this.delta * 0.4) % 3;
				this.frame.y = 2;
			} else {
				this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 6.0) % 4;
				if(this.states.duck){
					this.frame.y  = 0;
				} else {
					this.frame.y  = 1;
				}
			}
			
		} else {
			this.frame.x = 3;
			this.frame.y  = 2;
		}
	}
	faceTarget(){
		this.flip = this.target().position.x < this.position.x;
	}
}
self["Flederknife"] = Flederknife;