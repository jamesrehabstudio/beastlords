function ajax(filepath, callback, caller){
	var xhttp = new XMLHttpRequest();
	caller = caller || window;
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4){
			callback.apply(caller, [xhttp.response]);
		}
	}
	xhttp.open("GET",filepath,true);
	xhttp.send();
}
mergeLists = function(a,b){ 
	var out = {};
	for(var i in a){
		out[i] = a[i];
	}
	for(var i in b){
		if(!(i in out)){
			out[i] = b[i];
		}
	}
	return out;
}
function Timer(time, interval){
	this.countdown = false;
	this.time = this.start = this.previous = this.interval = 0;
	if(time != undefined){
		this.set( time, interval );
	}
}

Timer.prototype.set = function(time, interval){
	this.start = time;
	this.time = time;
	this.countdown = time > 0;
	this.previous = time + (this.countdown?-1.0:1.0);
	if( interval != undefined ) {
		this.interval = interval;
	}
	if( this.interval instanceof Array ) {
		this.interval = this.interval.sort(function(a,b){return a-b;});
	} else {
		this.nextInterval = this.time;
	}
}
Timer.prototype.tick = function(delta){
	if( delta > 0 ) {
		this.previous = this.time;
		if(this.countdown){
			this.time -= delta;
		} else {
			this.time += delta;
		}
	}
}
Timer.prototype.status = function(delta){
	if( this.time <= 0 ) {
		return false;
	}
	this.tick(delta);
	if( this.interval instanceof Array ) {
		for(var i=0; i < this.interval.length; i++ ){
			if( this.time < this.interval[i] ) {
				return 1 + (this.interval.length - i);
			}
		}
		return 1;
	} else {
		if( this.time <= this.nextInterval ){
			this.nextInterval -= this.interval;
			return true;
		}
		return false;
	}
}

Timer.prototype.at = function(position){
	if(this.countdown){
		return position >= this.time && position < this.previous;
	} else {
		return position <= this.time && position > this.previous;
	}
}
Timer.prototype.progress = function(delta){
	if( this.interval instanceof Array ) {
		for(var i=this.interval.length-1; i >= 0; i-- ){
			if( this.time > this.interval[i] ) {
				var low = this.interval[i];
				var high = (i+1 in this.interval) ? this.interval[i+1] : this.start;
				return 1.0 - ((this.time-low) / (high-low));
			}
		}
		return 1.0 - (this.time / this.interval[0]);
	} else {
		return 1.0 - (this.time-this.nextInterval / this.interval);
	}
}
Timer.interval = function(time,interval,delta){
	return (time%interval)+delta > interval;
}
Timer.isAt = function(time,at,delta){
	return (at >= time && at < time + delta);
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
Array.prototype.peek = function() {
  if ( this.length > 0 ) return this[ this.length - 1 ];
  return undefined;
};
Array.prototype.intersection = function(a){
	var out = new Array();
	for(var i=0; i < a.length; i++)
		if(this.indexOf(a[i]) >= 0) 
			out.push(a[i]);
	return out;
}
Array.prototype.insertSort = function(a,func){
	if(func == undefined){
		func = function(a,b){return a-b;}
	}
	if(this.length == 0){
		this.push(a);
		return this;
	}
	if(this.length == 1){
		if(func(a,this[0])>0){
			this.push(a);
		} else {
			this.splice(0, 0, a);
		}
		return this;
	}
	var index = Math.floor(this.length / 2);
	var increment = Math.max(Math.floor(index/2),1);
	
	while(1){
		if(index >= this.length){
			index = this.length;
			break;
		}
		if(index == 0){
			if(func(a,this[index])<0){
				break;
			}
		}
		if(index == this.length-1){
			if(func(a,this[index])>=0){
				index+=1;
				break;
			}
		} else {
			if(func(a,this[index])>=0 && func(a,this[index+1])<0){
				index+=1;
				break;
			}
		}
		if(func(a,this[index])<0){
			index -= increment;
		} else {
			index += increment;
		}
		increment = Math.max(Math.floor(increment/2),1);
	}
	this.splice(index, 0, a);
	return this;
}

Math.angleTurnDirection = function(_a,_b){
	_a = _a % (2*Math.PI);
	_b = _b % (2*Math.PI);
	
	var a = (_a - _b);
	var b = ((_a-(2*Math.PI))-_b);
	var test = Math.abs(b) < Math.abs(a) ? b: a;
	return test > 0 ? -1 : 1;
	
}
Math.trunc = function(x){
	return x < 0 ? Math.ceil(x) : Math.floor(x);
}
Math.mod = function(x,n){
	if( x >= 0 ) return x % n;
	while(x < 0 ) {
		x += n;
	}
	return x;
}
Math.lerp = function(x,y,delta){
	return x + (y-x) * delta;
}
Math.roundTo = function(x,n){
	return Math.floor(x/n)*n; 
}

function Matrix2D() {
	this.data = [1,0,0,0,1,0,0,0,1];
}
Matrix2D.M00 = 0;
Matrix2D.M10 = 3;
Matrix2D.M20 = 6;
Matrix2D.M01 = 1;
Matrix2D.M11 = 4;
Matrix2D.M21 = 7;
Matrix2D.M02 = 2;
Matrix2D.M12 = 5;
Matrix2D.M22 = 8;

Matrix2D.prototype.multiply = function (m){
	var out = new Matrix2D();
	
	out.data = [
		m.data[Matrix2D.M00] * this.data[Matrix2D.M00] + m.data[Matrix2D.M01] * this.data[Matrix2D.M10] + m.data[Matrix2D.M02] * this.data[Matrix2D.M20],
		m.data[Matrix2D.M00] * this.data[Matrix2D.M01] + m.data[Matrix2D.M01] * this.data[Matrix2D.M11] + m.data[Matrix2D.M02] * this.data[Matrix2D.M21],
		m.data[Matrix2D.M00] * this.data[Matrix2D.M02] + m.data[Matrix2D.M01] * this.data[Matrix2D.M12] + m.data[Matrix2D.M02] * this.data[Matrix2D.M22],
		
		m.data[Matrix2D.M10] * this.data[Matrix2D.M00] + m.data[Matrix2D.M11] * this.data[Matrix2D.M10] + m.data[Matrix2D.M12] * this.data[Matrix2D.M20],
		m.data[Matrix2D.M10] * this.data[Matrix2D.M01] + m.data[Matrix2D.M11] * this.data[Matrix2D.M11] + m.data[Matrix2D.M12] * this.data[Matrix2D.M21],
		m.data[Matrix2D.M10] * this.data[Matrix2D.M02] + m.data[Matrix2D.M11] * this.data[Matrix2D.M12] + m.data[Matrix2D.M12] * this.data[Matrix2D.M22],
		
		m.data[Matrix2D.M20] * this.data[Matrix2D.M00] + m.data[Matrix2D.M21] * this.data[Matrix2D.M10] + m.data[Matrix2D.M22] * this.data[Matrix2D.M20],
		m.data[Matrix2D.M20] * this.data[Matrix2D.M01] + m.data[Matrix2D.M21] * this.data[Matrix2D.M11] + m.data[Matrix2D.M22] * this.data[Matrix2D.M21],
		m.data[Matrix2D.M20] * this.data[Matrix2D.M02] + m.data[Matrix2D.M21] * this.data[Matrix2D.M12] + m.data[Matrix2D.M22] * this.data[Matrix2D.M22]
	];
	return out;
}
Matrix2D.prototype.toFloatArray = function(){
	//return new Float32Array(this.data);
	return new Float32Array(this.data);
}
Matrix2D.prototype.transition = function(x,y){
	if(x instanceof Point){
		x = x.x;
		y = x.y;
	}
	var out = new Matrix2D();
	out.data[Matrix2D.M00] = this.data[Matrix2D.M00];
	out.data[Matrix2D.M01] = this.data[Matrix2D.M01];
	out.data[Matrix2D.M02] = this.data[Matrix2D.M02];
	
	out.data[Matrix2D.M10] = this.data[Matrix2D.M10];
	out.data[Matrix2D.M11] = this.data[Matrix2D.M11];
	out.data[Matrix2D.M12] = this.data[Matrix2D.M12];
	
	out.data[Matrix2D.M20] = x * this.data[Matrix2D.M00] + y * this.data[Matrix2D.M10] + this.data[Matrix2D.M20];
	out.data[Matrix2D.M21] = x * this.data[Matrix2D.M01] + y * this.data[Matrix2D.M11] + this.data[Matrix2D.M21];
	out.data[Matrix2D.M22] = x * this.data[Matrix2D.M02] + y * this.data[Matrix2D.M12] + this.data[Matrix2D.M22];
	
	return out;
}
Matrix2D.prototype.scale = function(x,y){
	if(x instanceof Point){
		y = x.y;
		x = x.x;
	}
	var out = new Matrix2D();
	out.data[Matrix2D.M00] = x * this.data[Matrix2D.M00];
	out.data[Matrix2D.M01] = x * this.data[Matrix2D.M01];
	out.data[Matrix2D.M02] = x * this.data[Matrix2D.M02];
	
	out.data[Matrix2D.M10] = y * this.data[Matrix2D.M10];
	out.data[Matrix2D.M11] = y * this.data[Matrix2D.M11];
	out.data[Matrix2D.M12] = y * this.data[Matrix2D.M12];
	
	out.data[Matrix2D.M20] = out.data[Matrix2D.M20]
	out.data[Matrix2D.M21] = out.data[Matrix2D.M21]
	out.data[Matrix2D.M22] = out.data[Matrix2D.M22]
	return out;
}
Matrix2D.prototype.rotate = function(a){
	var out = new Matrix2D();
	var s = Math.sin(a);
	var c = Math.cos(a);
	
	out.data[Matrix2D.M00] = c * this.data[Matrix2D.M00] + s * this.data[Matrix2D.M10];
	out.data[Matrix2D.M01] = c * this.data[Matrix2D.M01] + s * this.data[Matrix2D.M11];
	out.data[Matrix2D.M02] = c * this.data[Matrix2D.M02] + s * this.data[Matrix2D.M12];
	
	out.data[Matrix2D.M10] = c * this.data[Matrix2D.M10] - s * this.data[Matrix2D.M00];
	out.data[Matrix2D.M11] = c * this.data[Matrix2D.M11] - s * this.data[Matrix2D.M01];
	out.data[Matrix2D.M12] = c * this.data[Matrix2D.M12] - s * this.data[Matrix2D.M02];
	
	out.data[Matrix2D.M20] = this.data[Matrix2D.M20];
	out.data[Matrix2D.M21] = this.data[Matrix2D.M21];
	out.data[Matrix2D.M22] = this.data[Matrix2D.M22];
	
	return out;
}

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
/*	var s = this.start.subtract(camera).scale(pixel_scale);
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
	*/
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
Point.prototype.floor = function(nearest){
	if(!nearest) { nearest = 1;}
	return new Point(
		Math.floor(this.x / nearest) * nearest, 
		Math.floor(this.y / nearest) * nearest
	);
}
Point.prototype.ceil = function(nearest){
	if(!nearest) { nearest = 1;}
	return new Point(
		Math.ceil(this.x / nearest) * nearest, 
		Math.ceil(this.y / nearest) * nearest
	);
}
Point.prototype.round = function(nearest){
	if(!nearest) { nearest = 1;}
	return new Point(
		Math.round(this.x / nearest) * nearest, 
		Math.round(this.y / nearest) * nearest
	);
}
Point.prototype.normalize = function(scale){
	if(scale == undefined){
		scale = 1;
	}
	var norm = this.length();
	if(norm != 0){
		return new Point( scale * this.x / norm, scale * this.y / norm );
	}
	return new Point(1,0);
}
Point.prototype.magnitude = function(){
	return Math.sqrt( Math.pow( this.x, 2 ) + Math.pow(this.y, 2 ) );
}
Point.prototype.rotate = function(r,origin){
	if(r == 0) return new Point(this.x, this.y);
	if(origin == undefined) origin = new Point();
	var s = Math.sin(r); 
	var c = Math.cos(r);
	return new Point(
		origin.x + ((this.x - origin.x) * c) - ((this.y - origin.y) * s),
		origin.y + ((this.x - origin.x) * s) + ((this.y - origin.y) * c)
	);
}
Point.magnitude = function(x,y){
	return Math.sqrt( Math.pow( x, 2 ) + Math.pow(y, 2 ) );
}
Point.prototype.dot = function(b){
	//dot is the sum of each axis multiplied together.
	return (this.x * b.x) + (this.y * b.y);
}
Point.prototype.mod = function(l){
	this.x = l.start.x + Math.mod(this.x - l.start.x,l.width());
	this.y = l.start.y + Math.mod(this.y - l.start.y,l.height());
	return this;
}
Point.fromAngle = function(a,scale){
	scale = scale || 1;
	return new Point(
		Math.cos( a ) * scale,
		Math.sin( a ) * scale
	);
}
Point.lerp = function(a,b,d){
	return new Point(
		a.x + (b.x-a.x) * d,
		a.y + (b.y-a.y) * d
	);
}
getTileData = function(t){
	return {
		"original" : t,
		"hflip" : !!(t&0x80000000),
		"vflip" : !!(t&0x40000000),
		"dflip" : !!(t&0x20000000), 
		"tile" : t & 0x0FFFFFF
	};
}