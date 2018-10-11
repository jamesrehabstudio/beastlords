Shooter.prototype = new GameObject();
Shooter.prototype.constructor = GameObject;
function Shooter(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.team = 0;
	this.start_x = x;
	this.sprite = "shooter";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(8,this.difficulty);
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.gravity = 0.5;
	this.friction = 0.2;
	
	this.bullet_y_pos = [-16,0,18];
	this.cooldown = Game.DELTASECOND;
	this.death_time = Game.DELTASECOND;
	this.max_distance = 360;
	
	this.aim_direction = 0;
	
	this.parts = {
		"body" : new Point(),
		"wing" : new Point(-16,0),
		"neck1" : new Point(),
		"neck2" : new Point(),
		"neck3" : new Point(),
		"head" : new Point(32,0)
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 128 ) {
		this.flip = dir.x > 0;
		if( Math.abs( dir.x ) < 112 ) {
			if( this.flip ) {
				//Move to the right
				if( this.position.x - this.start_x < this.max_distance ) {
					this.force.x += this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			} else {
				//Move to the left
				if( this.position.x - this.start_x > -this.max_distance ) {
					this.force.x -= this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			}
		} 
		
		//Attack
		if( this.cooldown <= 0 ) {
			//Fire
			var direction = this.flip ? 1 : -1;
			this.cooldown = Game.DELTASECOND * 0.6;
			var y = this.bullet_y_pos[ this.aim_direction ];
			var bullet = new Bullet(
				this.position.x,
				this.position.y + y, 
				-direction
			);
			bullet.damage = this.damage;
			game.addObject( bullet );
			
			//Choose next direction
			this.aim_direction = Math.floor( Math.random() * this.bullet_y_pos.length);
		}
		this.cooldown -= this.delta;
	} else if ( Math.abs( this.position.x - this.start_x ) < this.max_distance ){
		this.flip = dir.x > 0;
		var direction = this.flip ? -1 : 1;
		this.force.x += this.delta * this.speed * direction;
	}
	
	//Animation
	this.frame = (this.frame + this.delta * 0.1) % 3;
	
	//Move head position
	var head_y = this.bullet_y_pos[ this.aim_direction ];
	this.parts.head.y = Math.lerp(this.parts.head.y, head_y, this.delta * 0.1);
	var stem = new Point(8,-16);
	this.parts.neck1 = Point.lerp(stem, this.parts.head, 0.666);
	this.parts.neck2 = Point.lerp(stem, this.parts.neck1, 0.666);
	this.parts.neck3 = Point.lerp(stem, this.parts.neck2, 0.5);
}
Shooter.prototype.render = function(g,c){
	for(var i in this.parts ) {
		var pos = new Point(this.parts[i].x, this.parts[i].y);
		var f = 0; var fr = 0;
		if( i == "head" ) {
			f = 0; fr = 0;
		} else if ( i == "body" ){
			f = 0; fr = 1;
		} else if ( i == "wing" ){
			f = this.frame; fr = 2;
			if( f < 1 ) { 
				pos.y -= 48;
			} else if( f < 2 ) { 
				pos.y -= 8;
			} else {
				pos.y -= 32;
			}
		} else {
			f = 2; fr = 0;
		}
		if( this.flip ){
			pos.x *= -1;
		}
		this.sprite.render(g,this.position.add(pos).subtract(c),f,fr, this.flip, this.filter);
	}
}
Shooter.prototype.idle = function(){}