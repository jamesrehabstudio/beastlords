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
	return n + (x + Math.floor(x/-n)*n);
}
Math.lerp = function(x,y,delta){
	return x + (y-x) * delta;
}
Math.slerp = function(x,y,delta){
	let dif = Math.abs(x-y);
	if(Math.abs((x+360)-y) < dif){
		return Math.lerp(x+360,y,delta);
	} else if(Math.abs(x-(y+360)) < dif){
		return Math.lerp(x,y+360,delta);
	}
	return Math.lerp(x,y,delta);
}
Math.sdif = function(a,b){
	let d = a - b;
	let e = a - (b+360);
	let f = (a+360) - b;
	
	if(Math.abs(d) < Math.abs(e) && Math.abs(d) < Math.abs(f)){
		return d;
    } else if(Math.abs(e) < Math.abs(d) && Math.abs(e) < Math.abs(f)){
		return e;
	}
	return f;
}
Math.roundTo = function(x,n){
	return Math.floor(x/n)*n; 
}
Math.subtractToZero = function(x,y){
	if(y < 0 ){
		return x;
	} else if(x > y){
		return x - y;
	} else if(x < -y){
		return x + y;
	}
	return 0;
}
Math.rad2deg = 180 / Math.PI;
Math.deg2rad = 1 / Math.rad2deg;
Math.clamp = function(x,a,b){return Math.max(Math.min(x,b),a);}
Math.clamp01 = function(x){return Math.max(Math.min(x,1),0);}

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
Matrix2D.prototype.apply = function(v){
	var out = new Point();
	out.x = this.data[Matrix2D.M00] * v.x + this.data[Matrix2D.M10] * v.y + this.data[Matrix2D.M20];
	out.y = this.data[Matrix2D.M01] * v.x + this.data[Matrix2D.M11] * v.y + this.data[Matrix2D.M21];
	out.z = this.data[Matrix2D.M02] * v.x + this.data[Matrix2D.M12] * v.y + this.data[Matrix2D.M22];
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
Matrix2D.prototype.rotate = function(x=0,y=0,z=0){
	var out = new Matrix2D();
	var s = Math.sin(x);
	var c = Math.cos(x);
	
	var a = new Matrix2D();
	a.data[Matrix2D.M00] = c;
	a.data[Matrix2D.M10] = -s;
	a.data[Matrix2D.M01] = s;
	a.data[Matrix2D.M11] = c;
	
	//return this;
	return this.multiply(a);
}
Matrix2D.prototype.convert4x4 = function(){
	var out = new Matrix4x4();
	out.data[Matrix4x4.M00] = this.data[Matrix2D.M00];
	out.data[Matrix4x4.M10] = this.data[Matrix2D.M10];
	out.data[Matrix4x4.M30] = this.data[Matrix2D.M20];
	
	out.data[Matrix4x4.M01] = this.data[Matrix2D.M01];
	out.data[Matrix4x4.M11] = this.data[Matrix2D.M11];
	out.data[Matrix4x4.M31] = this.data[Matrix2D.M21];
	
	out.data[Matrix4x4.M02] = this.data[Matrix2D.M02];
	out.data[Matrix4x4.M12] = this.data[Matrix2D.M12];
	return out;
}

class Matrix4x4 {
	constructor(){
		this.data = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];
	}
	multiply(m){
		var out = new Matrix4x4();
		
		for(let y=0; y < 4; y++){
			for(let x=0; x < 4; x++){
				let index = Matrix4x4.getIndex(x, y);
				
				out.data[index] = 0 + 
					m.data[Matrix4x4.getIndex(x, 0)] * this.data[Matrix4x4.getIndex(0, y)] + 
					m.data[Matrix4x4.getIndex(x, 1)] * this.data[Matrix4x4.getIndex(1, y)] + 
					m.data[Matrix4x4.getIndex(x, 2)] * this.data[Matrix4x4.getIndex(2, y)] + 
					m.data[Matrix4x4.getIndex(x, 3)] * this.data[Matrix4x4.getIndex(3, y)];
			}
		}
		return out;
	}
	static getIndex(x,y){
		return x + y * 4;
	}
	transition(x=0,y=0,z=0){
		var a = new Matrix4x4();
		a.data[Matrix4x4.M30] = x;
		a.data[Matrix4x4.M31] = y;
		a.data[Matrix4x4.M32] = z;
		return this.multiply(a);
	}
	rotate(x=0,y=0,z=0){
		var _x = new Matrix4x4();
		let s = Math.sin(x);
		let c = Math.cos(x);
		
		_x.data[Matrix4x4.M11] = c;
		_x.data[Matrix4x4.M21] = s;
		_x.data[Matrix4x4.M12] = -s;
		_x.data[Matrix4x4.M22] = c;
		
		var _y = new Matrix4x4();
		s = Math.sin(y);
		c = Math.cos(y);
		
		_y.data[Matrix4x4.M00] = c;
		_y.data[Matrix4x4.M20] = s;
		_y.data[Matrix4x4.M02] = -s;
		_y.data[Matrix4x4.M22] = c;
		
		var _z = new Matrix4x4();
		s = Math.sin(z);
		c = Math.cos(z);
		
		_z.data[Matrix4x4.M00] = c;
		_z.data[Matrix4x4.M10] = -s;
		_z.data[Matrix4x4.M01] = s;
		_z.data[Matrix4x4.M11] = c;
		//_z.data[Matrix4x4.M11] = c;
		//_z.data[Matrix4x4.M21] = s;
		
		return this.multiply(_z).multiply(_x).multiply(_y);
	}
	scale(x=1,y=1,z=1){
		var a = new Matrix4x4();
		a.data[Matrix4x4.M00] = x;
		a.data[Matrix4x4.M11] = y;
		a.data[Matrix4x4.M22] = z;
		return this.multiply(a);
	}
	apply(v){
		var out = new Vector();
		out.x = this.data[Matrix4x4.M00] * v.x + this.data[Matrix4x4.M10] * v.y + this.data[Matrix4x4.M20] * v.z + this.data[Matrix4x4.M30];
		out.y = this.data[Matrix4x4.M01] * v.x + this.data[Matrix4x4.M11] * v.y + this.data[Matrix4x4.M21] * v.z + this.data[Matrix4x4.M31];
		out.z = this.data[Matrix4x4.M02] * v.x + this.data[Matrix4x4.M12] * v.y + this.data[Matrix4x4.M22] * v.z + this.data[Matrix4x4.M32];
		out.w = this.data[Matrix4x4.M03] * v.x + this.data[Matrix4x4.M13] * v.y + this.data[Matrix4x4.M23] * v.z + this.data[Matrix4x4.M33];
		return out;
	}
	toFloatArray(){
		return new Float32Array(this.data);
	}
}
Matrix4x4.M00 = 0;
Matrix4x4.M10 = 4;
Matrix4x4.M20 = 8;
Matrix4x4.M30 = 12;

Matrix4x4.M01 = 1;
Matrix4x4.M11 = 5;
Matrix4x4.M21 = 9;
Matrix4x4.M31 = 13;

Matrix4x4.M02 = 2;
Matrix4x4.M12 = 6;
Matrix4x4.M22 = 10;
Matrix4x4.M32 = 14;

Matrix4x4.M03 = 3;
Matrix4x4.M13 = 7;
Matrix4x4.M23 = 11;
Matrix4x4.M33 = 15;

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

Polygon.prototype.rotate = function( deg, origin ){
	if(origin == undefined){
		origin = new Point(0,0);
	}
	
	var out = new Polygon();
	let m = new Matrix2D().rotate(deg * Math.deg2rad);
	
	for(let i=0; i < this.points.length; i++){
		let p = this.points[i].subtract(origin);
		p = m.apply(p).add(origin);
		out.addPoint(p);
	}
	return out;
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
	return this;
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
Line.prototype.toPolygon = function(){
	var out = new Polygon();
	out.addPoint(new Point(this.start.x, this.start.y));
	out.addPoint(new Point(this.end.x, this.start.y));
	out.addPoint(new Point(this.end.x, this.end.y));
	out.addPoint(new Point(this.start.x, this.end.y));
	return out;
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
Point.prototype.flip = function(f=true){
	let fm = f ? -1 : 1;
	return new Point(this.x * fm,this.y);
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
Point.prototype.scale = function(x,y){
	if(x instanceof Point){
		y = x.y;
		x = x.x;
	} else if (y == undefined){
		y = x;
	}
	return new Point(this.x * x, this.y * y);
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
Point.prototype.toAngle = function(){
	return Math.atan2(-this.y, this.x);
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
class Vector{
	constructor(x=0,y=0,z=0){
		this.x = x;
		this.y = y;
		this.z = z;
	}
	get xy(){
		return new Point(this.x, this.y);
	}
	set xy(p){
		this.x = p.x;
		this.y = p.y;
	}
	add(pos=0,y=0,z=0){
		var out = new Vector();
		if(pos instanceof Vector){
			out.x = this.x + pos.x;
			out.y = this.y + pos.y;
			out.z = this.z + pos.z;
		} else if(pos instanceof Point){
			out.x = this.x + pos.x;
			out.y = this.y + pos.y;
			out.z = this.z;
		} else {
			out.x = this.x + pos;
			out.y = this.y + y;
			out.z = this.z + z;
		}
		return out;
	}
	subtract(pos=0,y=0,z=0){
		var out = new Vector();
		if(pos instanceof Vector){
			out.x = this.x - pos.x;
			out.y = this.y - pos.y;
			out.z = this.z - pos.z;
		} else if(pos instanceof Point){
			out.x = this.x - pos.x;
			out.y = this.y - pos.y;
			out.z = this.z;
		} else {
			out.x = this.x - x;
			out.y = this.y - y;
			out.z = this.z - z;
		}
		return out;
	}
	static lerp(a,b,d){
		var out = new Vector();
		out.x = Math.lerp(a.x, b.x, d);
		out.y = Math.lerp(a.y, b.y, d);
		
		if("z" in b){
			out.z = Math.lerp(a.z, b.z, d);
		} else {
			out.z = a.z;
		}
		
		return out;
	}
	static rotate(v,x,y,z){
		var m = new Matrix4x4().rotate(x,y,z);
		return m.apply(v);
	}
}
class Seed{
	constructor(s){
		this.seed = "" + s;
		var seedAsNumber = "0.";
		for(var i=0; i < this.seed.length; i++ ) {
			seedAsNumber += "" + Math.abs( this.seed[i].charCodeAt(0) );
		}
		this.prev = seedAsNumber - 0.0;
		this.constant1 = Math.PI * 1551651.0;
		this.constant2 = Math.E * 21657.0;
		this.random();
	}
	random(){
		this.prev = (this.prev * 1.0 * this.constant1 + this.constant2) % 1.0;
		return this.prev;
	}
	randomBool(oods){
		odds = odds == undefined ? 0.5 : odds;
		return this.random() < odds;
	}
	shuffle(arr){
		let currentIndex = arr.length;
		
		while(currentIndex > 0){
			var randomIndex = Math.floor(this.random()*currentIndex);
			currentIndex--;
			
			var temp = arr[currentIndex];
			arr[currentIndex] = arr[randomIndex];
			arr[randomIndex] = temp;
		}
		return arr;
	}
}


getTileData = function(t){
	return {
		"original" : t,
		"flags" : Math.abs(t>>29),
		"hflip" : !!(t&0x80000000),
		"vflip" : !!(t&0x40000000),
		"dflip" : !!(t&0x20000000), 
		"tile" : t & 0x0FFFFFF
	};
}

class Options{
	constructor(ops){
		for(let i in ops){
			this[i] = ops[i];
		}
	}
	getString(name, defaultValue){
		if(name in this) {
			return this[name];
		}
		return defaultValue;
	}
	getFloat(name, defaultValue){
		if(name in this) {
			return this[name] * 1;
		}
		return defaultValue;
	}
	getInt(name, defaultValue){
		if(name in this) {
			return Math.floor(this[name] * 1);
		}
		return Math.floor(defaultValue);
	}
	getBool(name, defaultValue){
		if(name in this) {
			if(this[name].toLowerCase().trim() == "true"){return true;}
			if(this[name].toLowerCase().trim() == "false"){return false;}
			return !!this[name] * 1;
		}
		return !!defaultValue;
	}
}