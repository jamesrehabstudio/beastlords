Shockowl.prototype = new GameObject();
Shockowl.prototype.constructor = GameObject;
function Shockowl(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "shockowl";
	this.speed = 7.0;
	this.zIndex = 3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.damage = 0;
	this.damageLight = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.bounceCount = 3;
	this.mass = 1.0;
	
	this.rest = 0.0;
	this.beam = 0.0;
	this.beamTime = Game.DELTASECOND * 1.4;
	this.beamRelease = 0.0;
	this.beamReleaseTime = Game.DELTASECOND;
	this.attack = 0.0;
	this.attackTime = Game.DELTASECOND * 1.2;
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Shockowl.prototype.update = function(){
	this.gravity = 0.4;
	
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.rest > 0){
			this.frame.x = 0;
			this.frame.y = 3;
		} else if(this.beam > 0){
			this.beam -= this.delta;
			var progress = 1 - this.beam / this.beamTime;
			
			this.frame = Shockowl.anim_beam.frame(progress);
			this.force.y = progress > 0.5 ? 0 : -2.5;
			this.gravity = 0.0;
		} else if(this.beamRelease > 0){
			this.beamRelease -= this.delta;
			var progress = 1 - this.beamRelease / this.beamReleaseTime;
			var range = Math.min(progress * 5, 1) * 180;
			
			if(this.flip){
				Background.pushLightArea(new Line(this.position.add(new Point(-range,0)),this.position.add(new Point(0,12))),24,COLOR_LIGHTNING);
			} else {
				Background.pushLightArea(new Line(this.position,this.position.add(new Point(range,12))),24,COLOR_LIGHTNING);
			}
			
			this.strike(new Line(new Point(0,0),new Point(range,12)));
			
			this.frame.x = 4;
			this.frame.y = 4;
			this.force.y = 0;
			this.gravity = 0.0;
		} else if(this.attack > 0){
			this.attack -= this.delta;
			var progress = 1 - this.attack/this.attackTime;
			
			this.frame = Shockowl.anim_attack.frame(progress);
			
			if(Timer.isAt(this.attack,this.attackTime * 0.8, this.delta)){
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damageLight = lightning2.damageLight = this.damageLight;
				lightning1.force.x = lightning2.force.x = this.forward() * 6;
				lightning1.force.y = lightning2.force.y = -12;
				game.addObject(lightning1);
				game.addObject(lightning2);
			}
		} else {
			this.frame.x = Math.max(Math.min(1.2 + this.force.y * 0.2, 0),2);
			this.frame.y = 0;
			
			if(this.grounded){
				this.force.x = this.forward() * this.speed;
				this.force.y = -4;
				this.grounded = false;
				this.bounceCount--
				this.flip = dir.x > 0;
				
				if(!_player.grounded){
					this.beam = this.beamTime;
					this.beamRelease = this.beamReleaseTime;
					this.bounceCount = 4;
				} else if(this.bounceCount <= 0){
					this.attack = this.attackTime;
					this.bounceCount = 4;
				}
			}
		}
	} else{
		this.frame.x = 3;
		this.frame.y = 0;
	}
}
Shockowl.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	var progress = 1 - this.beamRelease / this.beamReleaseTime;
	var range = Math.min(progress * 5, 1) * 180;
	var flipOff = new Point(this.flip ? -range : 0,0);
	
	if(this.beamRelease > 0){
		g.renderSprite(
			"white",
			this.position.add(flipOff).subtract(c),
			this.zIndex - 1,
			new Point(),
			false,
			{
				scalex : range,
				scaley : 12
			}
		);
	}
}
Shockowl.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.3],
	[3,1,0.1],
	[4,1,0.1],
	[0,2,0.5],
]);
Shockowl.anim_beam = new Sequence([
	[1,3,0.1],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.1],
	[0,4,0.1],
	[1,4,0.1],
	[2,4,0.2],
	[3,4,0.1],
	[4,4,0.3],
]);