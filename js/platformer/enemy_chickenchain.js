class ChickenChain extends GameObject{
	constructor(x, y, d, o){
		super(x, y, d, o);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 30;
		this.sprite = "chickenchain";
		this.speed = 3.75;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.states = {
			"cooldown" : Game.DELTASECOND * 3,
			"attack" : 0.0,
			"direction" : 1.0,
			"attackstage" : 0,
			"duck" : 0
		};
		this.attacks = {
			"cooldown" : Game.DELTASECOND * 3,
			"distance" : 200,
			"speed" : 5.0,
			"rest" : 0
		}
		this.ball = new Point(0,0);
		
		this.difficulty = o.getInt("difficulty", Spawn.difficulty);
		
		this.lifeMax = this.life = Spawn.life(3,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(5,this.difficulty);
		this.mass = 1.0;
		
		this.on("collideHorizontal", function(x){
			this.force.x = 0;
			this.states.direction *= -1.0;
		});
		this.on("struck", EnemyStruck);
		this.on(["wakeup","added"], function(){
			this.states.attack = 0.0;
			this.states.attackstage = 0;
			this.states.cooldown = this.attacks.cooldown;
			
			if(_player instanceof Player){
				var dir = this.position.subtract(_player.position);
				this.states.direction = dir.x > 0 ? -1 : 1;
			}
		});
		
		this.on("struckTarget", function(obj){
			if(obj instanceof Player && this.attacks.rest <= 0){
				this.attacks.rest = Game.DELTASECOND * 0.3333;
				console.log("struckTarget");
			}
		});
		this.on("hurt", function(){
			audio.play("hurt",this.position);
		});
		
		this.on("pre_death", function(){
			this.states.attackstage = 0;
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			Item.drop(this);
			this.destroy();
		});
		
		SpecialEnemy(this);
		this.calculateXP();
	}
	update(){
		if ( this.life > 0 ) {
			var dir = this.position.subtract( _player.position );
			this.attacks.rest = Math.max(this.attacks.rest-this.delta, 0);
			
			if( this.states.attackstage ) {
				this.force.x = this.force.y = 0;
				var fireForward = this.states.attackstage == 1;
				
				if(fireForward){
					//Chain flies forward
					this.states.attack += this.attacks.speed * UNITS_PER_METER * this.delta;
					if(this.states.attack >= this.attacks.distance){
						this.states.attackstage = 2;
						this.states.duck = Math.round(Math.random());
					}
				} else{
					//Chain return
					this.states.attack -= this.attacks.speed * UNITS_PER_METER * this.delta;
					if(this.states.attack <= 0){
						this.states.attackstage = 0;
						this.states.duck = 0;
					}
				}
				this.ball = new Point(this.states.attack, (-4 + this.states.duck*16));
				if(this.attacks.rest <= 0){
					this.strike(
						new Line(this.ball,this.ball.add(new Point(4,4))),
						{"direction" : fireForward?this.flip:!this.flip}
					);
				}
				
				if( this.states.duck ) {
					var maxFrame = this.states.attackstage > 1 ? 5 : 3;
					this.frame.x = Math.min(this.frame.x + this.delta * 6.0, maxFrame);
					this.frame.y = 4;
				} else {
					var maxFrame = this.states.attackstage > 1 ? 4 : 2;
					this.frame.x = Math.min(this.frame.x + this.delta * 6.0, maxFrame);
					this.frame.y = 3;
				}
				
			} else {
				
				if(this.stun > 0){
					//Stop moving when hurt
					this.frame.x = 2;
					this.frame.y = 1;
					
				} else {
					//Walk back and forth
					
					if( this.atLedge() ){
						//Turn around, don't fall off the edge
						this.force.x = 0;
						this.states.direction *= -1.0;
					}
					
					if( Math.abs( dir.x ) > 24 ) {
						this.addHorizontalForce(this.speed * this.states.direction);
					}
					this.states.cooldown -= this.delta;
					this.flip = this.states.direction < 0;
					
					this.frame.y = 0;
					this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 6.0) % 4;
				}
				
				if( this.states.cooldown <= 0 && Math.abs( dir.x ) < this.attacks.distance ) {
					//Attack!!
					this.states.duck = Math.round(Math.random());
					this.states.attackstage = 1;
					this.states.cooldown = this.attacks.cooldown;
					this.flip = dir.x > 0;
					this.states.direction = this.forward();
					
				}
			}
		} else {
			this.frame.x = 2;
			this.frame.y = 1;
		}
	}
	render(g,c){
		if(this.states.attackstage){
			var b = new Point(
				this.ball.x * this.states.direction,
				this.ball.y
			);
			var links = Math.ceil(this.states.attack / 9);
			for(var i=0; i < links; i++){
				var b2 = b.add(new Point(i*-9*this.states.direction,0));
				g.renderSprite(this.sprite,b2.add(this.position).subtract(c),this.zIndex,new Point(0,2));
			}
			g.renderSprite(this.sprite,b.add(this.position).subtract(c),this.zIndex,new Point(1,2));
		}
		GameObject.prototype.render.apply(this,[g,c]);
	}
}

self["ChickenChain"] = ChickenChain;