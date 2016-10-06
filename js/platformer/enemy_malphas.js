Malphas.prototype = new GameObject();
Malphas.prototype.constructor = GameObject;
function Malphas(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "malphas";
	this.speed = 0.3;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	
	this.states = {
		"active" : false,
		"direction" : -1,
		"combo_timer" : Game.DELTASECOND * 2,
		"cooldown" : 0,
		"combo" : 0,
		"attack" : 0
	}
	this.attack_time = Game.DELTASECOND * 0.6;
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.cooldown -= 10;
		this.states.active = true
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		_player.addXP(this.xp_award);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Malphas.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 64 ) this.states.active = true;
	
	if( this.stun <= 0 && this.states.active ) {
		if( this.states.combo > 0 ) {
			//Attack
			this.states.attack -= this.delta;
			this.states.combo -= this.delta;
			this.criticalChance = 1.0;
			if( this.states.attack <= 0 ) {
				this.states.attack_low = Math.random() < 0.75 ? !this.states.attack_low : this.states.attack_low;
				this.states.attack = this.attack_time;
			}
			if( this.states.combo <= 0 ) {
				//End combo
				this.states.cooldown = Game.DELTASECOND * 2;
				this.states.combo_timer = Game.DELTASECOND * 4;
				this.states.attack_low = false;
				this.criticalChance = 0.0;
			}
			this.force.x += (dir.x > 0 ? -1 : 1) * this.delta * this.speed * 0.3;
		} else if ( this.states.cooldown > 0 ) {
			//Do nothing, recover
			this.states.cooldown -= this.delta;
		} else { 
			//Move
			if( (this.position.x - this.start_x) < -48 ) this.states.direction = 1;
			if( (this.position.x - this.start_x) > 48 ) this.states.direction = -1;
			
			this.force.x += this.states.direction * this.delta * this.speed;
			this.states.combo_timer -= this.delta;
			
			if( this.states.combo_timer <= 0 && Math.abs(dir.x) < 48 ) {
				this.states.combo = this.attack_time * (4 + Math.floor(Math.random()*4));
			}
			this.strike( new Line(0,-12,32,-8) );
		}
		this.flip = dir.x > 0;
		
		if( this.states.attack > this.attack_time * 0.333 && this.states.attack < this.attack_time * 0.6666 ) {
			this.strike( new Line(
				0, this.states.attack_low ? 8 : -12,
				32, this.states.attack_low ? 12 : -8
			) );
		}
	}
	
	if(!this.states.active || this.states.cooldown > 0) {
		this.frame = 0;
		this.frame_row = 0;
	} else {
		if( this.states.combo > 0 ) {
			this.frame_row = this.states.attack_low ? 3 : 2;
			this.frame = 2 - Math.min( Math.floor( 3 * (this.states.attack / this.attack_time) ), 2 );
		} else {
			this.frame_row = 1;
			this.frame = (this.frame+(this.delta*0.2*Math.abs(this.force.x))) % 3;
		}
	}
	
}