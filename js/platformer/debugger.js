Debuger.prototype = new GameObject();
Debuger.prototype.constructor = GameObject;
function Debuger(x, y){	
	this.sprite = sprites.player;
	this.width = 14;
	this.height = 30;
	this.speed = 10;
	
	window._player = this;
	this.addModule( mod_camera );
	
	window.pixel_scale = 0.25;
}
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}