Ghoul.prototype = new GameObject();
Ghoul.prototype.constructor = GameObject;
function Ghoul(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 48;
	this.sprite = sprites.ghoul;
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 0,
		"backwards" : 0,
		"upwards" : 0
	}
	
	this.life = dataManager.life(2);
	this.mass = 0.2;
	this.collideDamage = dataManager.damage(2);
	this.inviciple_tile = this.stun_time;
	this.gravity = 0;
	this.attackEffects.weaken = [1.0,20];
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			obj.hurt( this, this.collideDamage );
			this.states.cooldown = Game.DELTASECOND * 5;
		}
	});
	this.on("collideVertical", function(x){
		if( x > 0 ) {
			this.states.upwards = Game.DELTASECOND * 3;
		} else {
			this.states.upwards = 0;
		}
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = Game.DELTASECOND * 3;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Ghoul.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		if( this.states.upwards > 0 ){
			this.force.y -= this.speed * this.delta;
		} else if( Math.abs( dir.y ) > 16 ) {
			this.force.y += this.speed * this.delta * (dir.y > 0 ? -1 : 1);
		}
		var backwards = this.states.cooldown > 0 || this.states.backwards > 0;
		this.force.x += (dir.x > 0 ? -1 : 1) * (backwards ? -1 : 1) * this.delta * this.speed;
		this.flip = this.force.x < 0;
		
		this.states.cooldown -= this.delta;
		this.states.backwards -= this.delta;
		this.states.upwards -= this.delta;
	} 
	
	this.frame = (this.frame + (this.delta * 0.2)) % 3;
	this.frame_row = 0;
}