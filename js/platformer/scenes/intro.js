SceneIntro.prototype = new GameObject();
SceneIntro.prototype.constructor = GameObject;
function SceneIntro(x,y){
	this.progress = 0.0;
	this.phase = 0;
	
	this.father = {"pos":new Point(160, 160), "frame":0, "frame_row":0, "flip":false};
	this.player = {"pos":new Point(160, 160), "frame":3, "frame_row":1, "flip":true};
}
SceneIntro.prototype.update = function(){
	//_player.position = game.getObject(SceneEndIntro).position.scale(1.0);
	//this.destroy();
	
	if( this.phase == 0 ) {
		if( _player instanceof Player ) { 
			_player.visible = false;
			_player.stun = Game.DELTAYEAR;
			_player.sprite = "playerhuman";
		}
		
		this.player.pos.y = this.father.pos.y = 160;
		this.father.pos.x += this.delta;
		this.player.pos.x = this.father.pos.x + 16;
		if( this.father.pos.x > 352 ) {
			this.phase = 1;
		}
		this.father.frame = (this.father.frame + this.delta * 0.2) % 3;
	} else if( this.phase == 1 ){
		this.father.pos.x += this.delta;
		if( this.father.pos.x > 432 ) {
			this.phase = 2;
		}
		this.player.frame_row = 2;
		this.player.flip = this.player.pos.x > this.father.pos.x;
		
	} else if( this.phase == 2 ){
		this.father.pos.x += this.delta;
		this.player.pos.x += this.delta * 2;
		if( this.player.pos.x > 400 ) {
			this.phase = 3;
		}
		this.player.flip = false;
	} else if( this.phase == 3 ){
		var velocity = Math.max( 1.0 - this.progress / (Game.DELTASECOND * 1), 0 );
		var fall = -1.0 + (this.progress / (Game.DELTASECOND * 0.5)); 
		
		this.player.pos.x -= this.delta * 6 * velocity;
		this.player.pos.y = Math.min(this.player.pos.y+fall*2, 160);
		this.father.pos.x += this.delta;
		this.progress += this.delta;
		if( this.progress >= Game.DELTASECOND * 3 ) {
			_player.visible = true;
			_player.stun = 0;
			_player.life = 1;
			_player.heal = 1000;
			game.getObject(BigBones).active = true
			this.destroy();
		}
	}

	if( _player instanceof Player ) {
		_player.position.x = this.player.pos.x;
		_player.position.y = this.player.pos.y;
	}
}
SceneIntro.prototype.render = function(g,c){
	"characters".render(g, this.father.pos.subtract(c), this.father.frame, this.father.frame_row, this.father.flip);
	"characters".render(g, this.player.pos.subtract(c), this.player.frame, this.player.frame_row, this.player.flip);
}
SceneIntro.prototype.idle = function(){}