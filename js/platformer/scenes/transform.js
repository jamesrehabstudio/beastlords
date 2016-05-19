//transform

SceneTransform.prototype = new GameObject();
SceneTransform.prototype.constructor = GameObject;
function SceneTransform(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = "transform";
	
	_player.visible = false;
	_player.stun = Game.DELTAYEAR;
	
	this.frame = 0;
	this.progress = 0.32 * Game.DELTASECOND;
	this.sequence = [
		[0,0.32],
		[1,0.08],
		[2,0.32],
		[3,0.32],
		[4,0.08],
		[5,0.08],
		[6,0.08],
		[7,0.32],
		[8,0.32],
		[9,0.08],
		[10,0.08],
		[11,0.08],
		[12,0.32],
		[13,0.32],
		[14,0.66]
	];
}
SceneTransform.prototype.render = function(g,c){
	this.progress -= this.delta * 0.5;
	var f = 0;
	if( this.progress <= 0 ){
		this.frame++;
		if( this.frame < this.sequence.length ) {
			var seq = this.sequence[this.frame];
			f = seq[0];
			this.progress = seq[1] * Game.DELTASECOND;
		} else {
			_player.visible = true;
			_player.stun = 0;
			this.destroy();
		}
	}
	this.sprite.render(g,this.position.subtract(c),this.frame);
}