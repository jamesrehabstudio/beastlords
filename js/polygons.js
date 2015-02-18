/*
<!doctype html>
<html>
<head>
	<title>Polygon</title>
	<style>
		* {margin:0; padding:0 }
		
		#canvas {
			position:relative;
			background:#EEF;
			width:800px;
			height:800px;
		}
		
		#canvas div {
			position:absolute;
			width:4px;
			height:4px;
			
		}
	</style>
</head>
<body>
	<canvas id="canvas" width=800 height=800></canvas>
	
	<script>
	
function GameObject() {
	this.pos = new Point();
	this.hitbox = new Polygon();
	
	this.hitbox.addPoint( new Point(-4, -4 ) );
	this.hitbox.addPoint( new Point(4, -4 ) );
	this.hitbox.addPoint( new Point(4, 4 ) );
	this.hitbox.addPoint( new Point(-4, 4 ) );
}
GameObject.prototype.intersects = function( a ){
	return this.hitbox.intersects( a );
}
*/	
function Polygon(){
	this.points = new Array();
	this._lines = new Array();
}
Polygon.prototype.addPoint = function( p ){
	this.points.push ( p );
	this._rebuildLines();
}
Polygon.prototype._rebuildLines = function( ){
	this._lines = new Array();
	for( var i = 0; i < this.points.length; i++ ){
		var current = this.points[i];
		var next = this.points[ ( i + 1 ) % this.points.length ];
		
		this._lines.push( new Line( current, next ) );
	}
}
Polygon.prototype.transpose = function( x, y ){
	var p;
	if ( !( x instanceof Point ) ) {
		p = new Point( x, y );
	}
	
	for( var i = 0; i < this.points.length; i++ ){
		this.points[i].x += p.x;
		this.points[i].y += p.y;
	}
}
Polygon.prototype.intersects = function( p ){
	var lines;
	if ( p instanceof Point ){ 
		return this.pointInside( p );
	}
	if ( p instanceof Polygon ) {
		lines = p._lines;
	} else {
		lines = [ p ];
	}
	
	for( var i = 0; i < this._lines.length; i++ ) {
		for( var j = 0; j < lines.length; j++ ) {
			if ( this._lines[i].intersects( lines[j] ) ) {
				return true;
			}
		}
	}
	
	return false;
}

Polygon.prototype.pointInside = function( p ){
	var temp = new Line( new Point( -99999999999999999, p.y ),p	);
	var count = 0;
	
	for( var i = 0; i < this._lines.length; i++ ) {
		if ( this._lines[i].intersects( temp ) ) {
			count++;
		}
	}
	return ( count % 2 == 1 );
}
		
function Line ( p, q, r, s ) {
	if( p instanceof Point ) {
		this.start = p;
		this.end = q;
	} else {
		this.start = new Point(p,q);
		this.end = new Point(r,s);
	}
}

Line.renderNoramsl = false;

Line.prototype.length = function(){
	return this.start.distance(this.end);
}
Line.prototype.normal = function(){
	return new Point( -(this.end.y-this.start.y), -(this.start.x-this.end.x));
}
Line.prototype.center = function(){
	return new Point(
		.5 * (this.start.x + this.end.x), 
		.5 * (this.start.y + this.end.y)
	);
}
Line.prototype.top = function(){ return Math.min( this.start.y, this.end.y ); }
Line.prototype.left = function(){ return Math.min( this.start.x, this.end.x ); }
Line.prototype.bottom = function(){ return Math.max( this.start.y, this.end.y ); }
Line.prototype.right = function(){ return Math.max( this.start.x, this.end.x ); }

Line.prototype.transpose = function(pos,y){
	if(!(pos instanceof Point)) pos = new Point(pos,y);
	return new Line( this.start.add(pos), this.end.add(pos) );
}
Line.prototype.flip = function(){
	var x = this.start;
	this.start = this.end;
	this.end = x;
}
Line.prototype.correct = function(){
	//changes the end and start around so the start is always in the top left corner
	if( this.start.x > this.end.x ){
		var x = this.start.x;
		this.start.x = this.end.x;
		this.end.x = x;
	}
	if( this.start.y > this.end.y ){
		var y = this.start.y;
		this.start.y = this.end.y;
		this.end.y = y;
	}
}

Line.prototype.render = function(g, camera){
	var s = this.start.subtract(camera).scale(pixel_scale);
	var e = this.end.subtract(camera).scale(pixel_scale);
	g.strokeStyle = "#FF0000";
	g.beginPath();
	g.moveTo( s.x, s.y );
	g.lineTo( e.x, e.y );
	g.stroke();	
	g.closePath();
	
	if( Line.renderNormals || 1 ) {
		g.strokeStyle = "#FF7700";
		g.beginPath();
		var avr = this.center().subtract(camera).scale(pixel_scale);
		g.moveTo(avr.x, avr.y);
		var n = avr.add( this.normal().normalize(10) );
		g.lineTo( n.x, n.y );
		g.closePath();
		g.stroke();	
	}
}

Line.prototype.scale = function(s,y){
	if( s instanceof Point ){
		y = s.y;
		s = s.x;
	}
	if( typeof y == "number" ) {
		return new Line( 
			this.start.x * s, this.start.y * y,
			this.end.x * s, this.end.y * y
		);
	} else {
		return new Line( this.start.scale(s), this.end.scale(s) );
	}
}
Line.prototype.renderRect = function(g, camera){
	g.strokeStyle = "#FF0000";
	g.beginPath();
	g.rect( Math.min(this.start.x, this.end.x) - camera.x, Math.min(this.start.y, this.end.y) - camera.y, Math.abs(this.end.x - this.start.x), Math.abs(this.end.y - this.start.y) );
	g.stroke();	
	g.closePath();
}

Line.prototype.getIntersectionPoint = function( l ){
	var d =  
		(l.end.y - l.start.y) * (this.end.x - this.start.x) -
		(l.end.x - l.start.x) * (this.end.y - this.start.y);
	var a = 
		(l.end.x - l.start.x) * (this.start.y - l.start.y) -
		(l.end.y - l.start.y) * (this.start.x - l.start.x);
		
	var b = 
		(this.end.x - this.start.x) * (this.start.y - l.start.y) -
		(this.end.y - this.start.y) * (this.start.x - l.start.x);
	
	if ( d == 0 ) { 
		//Lines are parallel
		return false;
	}
	
	var p = new Point ( 
		this.start.x + ( (a/d) * ( this.end.x - this.start.x ) ),
		this.start.y + ( (a/d) * ( this.end.y - this.start.y ) )
	);
	
	return p;
}

Line.prototype.intersects = function( l ){
	//Returns false if no intersection, a point if there is a instersection
	p = this.getIntersectionPoint( l );
	
	var thres = 0.001;
	
	if (
		(p.x + thres) > Math.min( this.start.x, this.end.x ) &&
		(p.x - thres) < Math.max( this.start.x, this.end.x ) &&
		(p.y + thres) > Math.min( this.start.y, this.end.y ) &&
		(p.y - thres) < Math.max( this.start.y, this.end.y ) 
		&&
		(p.x + thres) > Math.min( l.start.x, l.end.x ) &&
		(p.x - thres) < Math.max( l.start.x, l.end.x ) &&
		(p.y + thres) > Math.min( l.start.y, l.end.y ) &&
		(p.y - thres) < Math.max( l.start.y, l.end.y ) 
	) {
		return p;
	}
	
	return false;
}
Line.prototype.overlaps = function( l ){
	if ( l instanceof Point ){
		var x1 = Math.min( this.start.x, this.end.x ); 	
		var y1 = Math.min( this.start.y, this.end.y );
		var x2 = Math.max( this.start.x, this.end.x );
		var y2 = Math.max( this.start.y, this.end.y );
		var out = 
			l.x > x1 && l.x < x2 &&
			l.y > y1 && l.y < y2;
		return out;	
	} else {
		var x1 = Math.min( this.start.x, this.end.x ); 	
		var x2 = Math.min( l.start.x, l.end.x );
		var y1 = Math.min( this.start.y, this.end.y );	
		var y2 = Math.min( l.start.y, l.end.y);
		var w1 = Math.abs( this.start.x - this.end.x );
		var w2 = Math.abs( l.start.x - l.end.x );
		var h1 = Math.abs( this.start.y - this.end.y );
		var h2 = Math.abs( l.start.y - l.end.y );
		if(x2<x1 || y1<y2){  
			t1 = x1; x1 = x2; x2 = t1;  
			t2 = y1; y1 = y2; y2 = t2;  
			t3 = w1; w1 = w2; w2 = t3;  
			t4 = h1; h1 = h2; h2 = t4;  
		}
		if( y2 + h2 < y1 || y1 + h1 < y2 ||  x2 + w2 < x1 || x1 + w1 < x2 )
			return false;  
		return true;  
	}
	return false;
}

Line.prototype.polyInstersects = function( pl ){
	for( var i=0; i < pl._lines.length; i++ ){
		if( this.intersects( pl._lines[i] ) ) {
			return true;
		}
	}
	return false;
}
Line.prototype.width = function(){ return Math.abs( this.start.x - this.end.x); }
Line.prototype.height = function(){ return Math.abs( this.start.y - this.end.y); }
Line.prototype.area = function(){ return this.width() * this.height(); }

function Point(x,y) {
	this.x = x || 0;
	this.y = y || 0;
}
Point.prototype.distance = function(b){
	return this.subtract(b).length();
}
Point.prototype.length = function(){
	return Math.sqrt(this.x * this.x + this.y * this.y);
}
Point.prototype.add = function(a){
	return new Point(this.x + a.x, this.y + a.y);
}
Point.prototype.subtract = function(a){
	return new Point(this.x - a.x, this.y - a.y);
}
Point.prototype.multiply = function(a){
	var scale = this.scale( this.x * a.x + this.y * a.y );
	return new Point(this.x * scale, a.y * scale);
}
Point.prototype.scale = function(scale){
	return new Point(this.x * scale, this.y * scale);
}
Point.prototype.normalize = function(scale){
	scale = scale || 1;
	var norm = this.length();
	if(norm != 0){
		return new Point( scale * this.x / norm, scale * this.y / norm );
	}
	return new Point(1,0);
}
Point.prototype.magnitude = function(){
	return Math.sqrt( Math.pow( this.x, 2 ) + Math.pow(this.y, 2 ) );
}
Point.magnitude = function(x,y){
	return Math.sqrt( Math.pow( x, 2 ) + Math.pow(y, 2 ) );
}
Point.prototype.dot = function(b){
	//dot is the sum of each axis multiplied together.
	return (this.x * b.x) + (this.y * b.y);
}
Point.fromAngle = function(a,scale){
	scale = scale || 1;
	return new Point(
		Math.cos( a ) * scale,
		Math.sin( a ) * scale
	);
}


//Data
/*
var a, b;
var canvas, g;
var mouse_x, mouse_y;
var zoom = 2;


function c_move( obj, x, y ){
	obj.hitbox.transpose( x, y );
	
	if ( obj.hitbox.intersects ( a ) ) {
		obj.hitbox.transpose( -x, -y );
	} else {
		obj.pos.x += x;
		obj.pos.y += y;
	}
}

function update() {	
	//var temp = a.intersects( b );
	var distance = 	
	Math.sqrt( 
		Math.pow( Math.abs( (mouse_x/zoom) - b.pos.x ), 2 ) +
		Math.pow( Math.abs( (mouse_y/zoom) - b.pos.y ), 2 ) 
	)
	
	var speed = 1.2;
	
	var angle = Math.atan2( 
		(mouse_x/zoom) - b.pos.x,
		(mouse_y/zoom) - b.pos.y
	);
	//console.log( angle );
	var goto_x = speed * Math.sin( angle );
	var goto_y = speed * Math.cos( angle );
	
	if ( distance > speed && !isNaN(goto_x) && !isNaN(goto_y) ){
		c_move( b, goto_x, goto_y );
	}
	render();

	-webkitRequestAnimationFrame( update );
}

function render() {
	g.clearRect(0,0,canvas.width,canvas.height);
	
	//render A 
	g.lineWidth = zoom;
	
	g.strokeStyle = "#FF0000";
	render_lines( g, a._lines );
	
	//render B
	g.strokeStyle = "#0000FF";
	render_go( g, b );
	
}

function render_go( g, go ) {
	render_lines( g, go.hitbox._lines );
	
}
function render_lines( g, lines ) {
	g.beginPath();
	for( var i = 0; i < lines.length; i++ ) {
		g.moveTo( lines[i].start.x * zoom, lines[i].start.y * zoom );
		g.lineTo( lines[i].end.x * zoom, lines[i].end.y * zoom );
		g.closePath();
		g.stroke();
	}
}

window.onload = function( e ) {
	canvas = document.getElementById( 'canvas' );
	g = canvas.getContext('2d');
	
	canvas.onmousemove = function ( e ) {
		mouse_x = e.clientX;
		mouse_y = e.clientY;
	}
	
	a = new Polygon( );
	b = new GameObject( );
	
	a.addPoint(new Point(32,32) );
	a.addPoint(new Point(64,64) );
	a.addPoint(new Point(64,96) );
	a.addPoint(new Point(96,96) );
	a.addPoint(new Point(96,64) );
	a.addPoint(new Point(128,32) );
	a.addPoint(new Point(144,32) );
	a.addPoint(new Point(144,112) );
	a.addPoint(new Point(16,112) );
	a.addPoint(new Point(16,32) );
	
	update();
}
		
		
	</script>
</body>
</html>*/