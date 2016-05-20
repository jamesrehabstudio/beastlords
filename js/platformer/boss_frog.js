FrogBoss.prototype = new GameObject();
FrogBoss.prototype.constructor = GameObject;
function FrogBoss(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 120;
	this.height = 180;
	this.team = 0;
	this.sprite = "frogmonster";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.life = Spawn.life(35,this.difficulty);
	this.gravity = 0.5;
	this.friction = 0.2;
	this.mass = 20.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.damage = Spawn.damage(5,this.difficulty);
	
	this.times = {
		"stump" : Game.DELTASECOND * 1.1,
		"flySpawn" : Game.DELTASECOND * 1.5,
		"jump" : Game.DELTASECOND * 9.0,
		"rockSpawn" : Game.DELTASECOND * 3.0,
	};
	this.states = {
		"stump" : 0.0,
		"flySpawn" : 0.0,
		"jump" : 0.0,
		"rockSpawn" : Game.DELTASECOND * 3.0,
		"ceilingCollapse" : false
		
	};
	
	//Find rock spawning limits
	this.rockBox = new Line(this.position.x, this.position.y, this.position.x, this.position.y);
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x, this.position.y - i*16, game.tileCollideLayer) > 0 ){
			this.rockBox.start.y = this.position.y - i * 16 + 24;
			break;
		}
	}
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x - i*16, this.rockBox.start.y, game.tileCollideLayer) > 0 ){
			this.rockBox.start.x = this.position.x - i * 16 + 24;
			break;
		}
	}
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x + i*16, this.rockBox.start.y, game.tileCollideLayer) > 0 ){
			this.rockBox.end.x = this.position.x + i * 16 - 24;
			break;
		}
	}
	this.rockBox.end.y = this.rockBox.start.y + 64;
	
	//Array for tracking flies
	this.flies = new Array();
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});

	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
}
FrogBoss.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		this.flip = dir.x > 0;
		
		this.states.stump += this.delta;
		this.states.flySpawn += this.delta;
		this.states.jump += this.delta;
		
		this.states.rockSpawn -= this.delta;
		
		if( this.states.ceilingCollapse && this.grounded ){
			audio.play("explode1");
			shakeCamera(new Point(0,8));
			for(var i=0; i < 8; i++ ) {
				var rock = new FallingRock( 
					this.rockBox.start.x + this.rockBox.width() * Math.random(),
					this.rockBox.start.y + this.rockBox.height() * Math.random()
				);
				rock.damage = Math.round(this.damage * 0.25);
				game.addObject( rock );
			}
			this.states.ceilingCollapse = false;
		}
		if( this.states.jump > this.times.jump && this.grounded) {
			this.force.y = -6;
			this.states.jump = 0;
			this.grounded = false;
			this.states.ceilingCollapse = true;
		}
		if( this.states.flySpawn > this.times.flySpawn ) {
			this.states.flySpawn = -Game.DELTASECOND * 2;
			//Spawn some flies
			for(var i=0; i < 3; i++ ){
				if( i < this.flies.length && this.flies[i].life > 0 ) {
					//Don't spawn a fly
				} else {
					var fly = new Fly( this.position.x, this.position.y - 64);
					fly.itemDrop = false;
					this.flies[i] = fly;
					game.addObject( fly );
					break;
				}
			}
		}
		if( this.states.stump > this.times.stump ) {
			audio.play("explode2");
			this.states.stump = -Game.DELTASECOND * 2;
			this.strike( new Line(-72, 60, 72, 90) );
		}
	}
	
	this.frame = (this.frame + this.delta * 0.05) % 1.0;
}
FrogBoss.prototype.render = function(g,c){
	var llegFrame = this.frame < 0.33 ? 1 : 0;
	var rlegFrame = this.frame >= 0.5 && this.frame < 0.833  ? 1 : 0;
	var headFrame = 0;
	
	var bob1 = new Point(0, 4*Math.sin(this.frame * Math.PI + 3.0 ));
	var bob2 = new Point(0, 2*Math.sin(this.frame * Math.PI + 1.5 ));
	var bob3 = new Point(0, 3*Math.sin(this.frame * Math.PI));
	
	var larm = FrogBoss.pos.larm.add(bob2);
	var lleg = FrogBoss.pos.lleg.add(new Point());
	var body = FrogBoss.pos.body.add(bob3);
	var head = FrogBoss.pos.head.add(bob1);
	var rleg = FrogBoss.pos.rleg.add(new Point());
	var rarm = FrogBoss.pos.rarm.add(bob2);
	
	var flySpawnProgress = this.states.flySpawn / this.times.flySpawn;
	headFrame = Math.max( Math.floor(flySpawnProgress * 3), 0);
	
	var stumpProgress = this.states.stump / this.times.stump;
	if( stumpProgress > 0 ) {
		llegFrame = 2;
		rlegFrame = 0;
		larm.x += Math.lerp(0,-8,stumpProgress); larm.y += Math.lerp(0,-12,stumpProgress);
		rarm.x += Math.lerp(0,-8,stumpProgress); rarm.y += Math.lerp(0,-12,stumpProgress);
		head.x += Math.lerp(0,-8,stumpProgress); head.y += Math.lerp(0,-12,stumpProgress);
		body.x += Math.lerp(0,-8,stumpProgress); body.y += Math.lerp(0,-12,stumpProgress);
		lleg.x += Math.lerp(0,-6,stumpProgress); lleg.y += Math.lerp(0,-16,stumpProgress);
	}
	
	if( this.force.y < 0 && !this.grounded ) {
		llegFrame = 1;
		rlegFrame = 1;
		lleg.y += Math.max( 2 * this.force.y, -8);
		rleg.y += Math.max( 2 * this.force.y, -8);
	}
	
	if( this.flip ) {
		larm.x *= -1; lleg.x *= -1; body.x *= -1;
		head.x *= -1; rleg.x *= -1; rarm.x *= -1;
	}
	
	g.renderSprite(this.sprite,this.position.add(larm).subtract(c),this.zIndex,new Point(0,4),this.flip,this.filter);
	g.renderSprite(this.sprite,this.position.add(lleg).subtract(c),this.zIndex,new Point(llegFrame,5),this.flip,this.filter);
	g.renderSprite(this.sprite,this.position.add(body).subtract(c),this.zIndex,new Point(0,1),this.flip,this.filter);
	g.renderSprite(this.sprite,this.position.add(head).subtract(c),this.zIndex,new Point(headFrame,0),this.flip,this.filter);
	g.renderSprite(this.sprite,this.position.add(rleg).subtract(c),this.zIndex,new Point(rlegFrame,2),this.flip,this.filter);
	g.renderSprite(this.sprite,this.position.add(rarm).subtract(c),this.zIndex,new Point(0,3),this.flip,this.filter);
	
	//pupils
	/*
	if( window._player instanceof Player ) {
		var dir = window._player.position.normalize(4)
		this.sprite.render(g,this.position.add(head).subtract(c).subtract(dir), 0, 6, this.flip);
	}
	*/
}

FrogBoss.pos = {
	"head" : new Point(36,-70),
	"body" : new Point(0,8),
	"larm" : new Point(56,8),
	"rarm" : new Point(-28,-20),
	"lleg" : new Point(40,18),
	"rleg" : new Point(-32,18)
}