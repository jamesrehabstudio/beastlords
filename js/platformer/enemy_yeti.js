Yeti.prototype = new GameObject();
Yeti.prototype.constructor = GameObject;
function Yeti(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = "yeti";
	this.speed = 0.1;
	this.origin.y = 0.45;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND,
		"attack" : 0,
		"attack_type" : 0,
		"attack_release" : false
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.mass = 2.2;
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.collideDamage = Spawn.damage(2,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.stun_time = 0;
	
	this.attack_release = Game.DELTASECOND * 1.2;
	this.attack_time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			//obj.hurt( this, this.collideDamage );
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	SpecialEnemy(this);
	this.calculateXP();
}
Yeti.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ){
			if( !this.states.attack_release && this.states.attack < this.attack_release ) {
				this.states.attack_release = true;
				this.criticalChance = 0.0;
				if( this.states.attack_type > 0 ) {
					//missle
					var y_offset = this.states.attack_type == 1 ? 4 : 17;
					bullet = new Bullet(this.position.x, this.position.y+y_offset, (this.flip?-1:1));
					bullet.blockable = true;
					bullet.attackEffects.slow[0] = 1.0;
					bullet.team = this.team;
					bullet.damage = this.damage;
					game.addObject(bullet);
				} else {
					//Area of effect
					for(var i=0; i < 2; i++ ) {
						bullet = new Bullet(this.position.x, this.position.y+16, (i==0?-0.5:0.5));
						bullet.blockable = false;
						bullet.attackEffects.slow[0] = 1.0;
						bullet.team = this.team;
						bullet.damage = this.damage;
						bullet.frame_row = 2;
						bullet.frames = [4,5,6];
						bullet.range = 64;
						bullet.effect = EffectIce;
						game.addObject(bullet);
					}
				}
			}
			this.states.attack -= this.delta;
			if( this.states.attack <= 0 ) this.states.cooldown = Game.DELTASECOND * 1.5;
		} else {
			if(Math.abs(dir.x) > 32) this.force.x += this.delta * this.speed * (dir.x>0?-1:1);
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) {
				this.states.attack = this.attack_time;
				this.states.attack_type = Math.abs( dir.x ) < 64 ? 0 : (Math.random() > .5 ? 1 : 2);
				this.states.attack_release = false;
				this.criticalChance = 1.0;
			}
		}
	} 
	
	if( this.states.attack > 0 ){
		if( this.states.attack_type == 0 ) { this.frame = 0; this.frame_row = 2; }
		if( this.states.attack_type == 1 ) { this.frame = 0; this.frame_row = 1; }
		if( this.states.attack_type == 2 ) { this.frame = 2; this.frame_row = 1; }
		if( this.states.attack < this.attack_release ) this.frame++;
	} else {
		this.frame = (this.frame + (this.delta * 0.2  * Math.abs(this.force.x))) % 3;
		this.frame_row = 0;
	}
}