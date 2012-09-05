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
		
function Line ( p, q ) {
	this.start = p;
	this.end = q;
}

Line.prototype.length = function(){
	return Math.sqrt( 
		Math.pow( Math.abs( this.start.x - this.end.x ), 2 ) +
		Math.pow( Math.abs( this.start.y - this.end.y ), 2 )
	);
}

Line.prototype.render = function(g, camera){
	g.strokeStyle = "#FF0000";
	g.beginPath();
	g.moveTo( this.start.x - camera.x, this.start.y - camera.y );
	g.lineTo( this.end.x - camera.x, this.end.y - camera.y );
	g.closePath();
	g.stroke();	
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
	
	var thres = 0.2;
	
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

function Point(x,y) {
	this.x = x || 0;
	this.y = y || 0;
}
Point.prototype.distance = function(d){
	return Math.sqrt (
		Math.pow( Math.abs( this.x - d.x ), 2 ) +
		Math.pow( Math.abs( this.y - d.y ), 2 )
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