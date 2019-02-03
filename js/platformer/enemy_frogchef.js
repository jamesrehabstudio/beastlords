class FrogChef extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPosition = new Point(x,y);
		this.sprite = "frogchef";
		this.width = 36;
		this.height = 48;
		
		this.addModule(mod_combat);
		
		this.lifeMax = this.life = 1;
		this.damage = 12;
		this.death_time = 1.0;
		this.force = new Point();
		this.gravity = 0.5;
		this.wakeTime = 0.0;
		
		this.variable = ops.getString("variable", "killed_fog_chef");
		
		this._escaping = 0.0;
		this._attack = 0.0;
		this._toss = true;
		
		this.on("hurt", function(obj, damage){
			
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			
			this.visible = this.interactive = false;
			this.life = 1;
			NPC.set(this.variable, 1);
		});
		this.on("sleep", function(){
			this.visible = this.interactive = false;
			this.position = this.initPosition.scale(1);
			this.force.x = this.force.y = 0.0;
		});
		this.on("wakeup", function(){
			this.force.x = this.force.y = this._attack = 0.0;
			this.flip = false;
			this._toss = true;
			this._escaping = false;
			if( NPC.get(this.variable) ){
				this.visible = this.interactive = false;
			} else if(game.timeScaled > this.wakeTime){
				this.visible = this.interactive = true;
				this.life = this.lifeMax;
			} else {
				this.visible = this.interactive = false;
			}
		});
	}
	update(){
		if(!this.visible){
			//do nothing
		} else if(this.life > 0){
			let dir = this.target().position.subtract(this.position);
			let nerves = 56 + this.target().equip_sword.range * 2.0;
			let range = 56 + this.target().equip_sword.range * 1.5;
			
			if(this._escaping){
				//Escaping
				this.force.y += this.delta * this.gravity * UNITS_PER_METER;
				this.frame.x = 2 + Math.clamp( this.force.y * 0.25, -1, 1 );
				this.frame.y = 2;
				this.wakeTime = game.timeScaled + 60;
			} else if(this._attack > 0){
				//Throwing
				let _p = 1 - this._attack / FrogChef.ATTACK_TIME;
				this.frame.x = Math.min( _p * 8.0, 6);
				this.frame.y = 1;
				this.flip = dir.x < 0;
				
				if(_p < 0.8){
					this.force.x = this.forward() * -4.5;
				} else {
					this.force.x = 0.0;
				}
				
				if(this._toss && _p > 0.8 ){
					this.fire();
					this._toss = false;
				}
				
				this._attack -= this.delta;
				if(this._attack <= 0){
					this._escaping = true;
					this.force.y = -6.0;
					this.force.x = 0.0;
				}
			} else if( Math.abs(dir.x) < nerves ){
				//Nervous
				if( Math.abs(dir.x) < range ){
					this._attack = FrogChef.ATTACK_TIME;
				} else {
					this.frame.x = dir.x > 0 ? 1 : 0;
					this.frame.y = 3;
				}
			} else {
				//idle
				this.frame.x = (this.frame.x + this.delta * 4) % 4;
				this.frame.y = 0;
			}
			
			//Apply force
			this.position.x += this.force.x * this.delta * UNITS_PER_METER;
			this.position.y += this.force.y * this.delta * UNITS_PER_METER;
		
		} else {
			this.frame.x = 2;
			this.frame.y = 3;
		}
	}
	fire(){
		var bullet = new PhantomBullet(this.position.x, this.position.y + 12, [16,12]);
		bullet.sprite = this.sprite;
		bullet.frame = new Point(4, 0);
		bullet.flip = this.flip;
		bullet.gravity = 0.6;
		bullet.force.y = -4;
		bullet.force.x = this.forward() * 7.0;
		bullet.damage = this.damage;
		bullet.blockable = false;
		game.addObject( bullet );
	}
}
FrogChef.ATTACK_TIME = 0.9 * Game.DELTASECOND;

self["FrogChef"] = FrogChef;