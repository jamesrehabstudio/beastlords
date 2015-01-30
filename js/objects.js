/* GAME OBJECTS */

Hud.prototype = new GameObject();
Hud.prototype.constructor = GameObject;

function Hud(){
	this.constructor();
	window._hud = this;
	this.zIndex = 9999;
}
Hud.prototype.render = function(g, camera){	
	var health = _player.health || 0;
	health = Math.max( 10 - Math.floor( health / 10 ) , 0 );
	sprites.health_bar.render(g, new Point(0,224), 0, health );
}

Node.prototype = new GameObject();
Node.prototype.constructor = GameObject;

function Node(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = this.height = 32;
	
	this.connections = new Array();
	this.node_library = {};
	this.lookingfor = [];
	this.lookingcaller = [];
}
Node.prototype.update = function(){
	if ( this.properties.lock != undefined && window._player.intersects(this) ){
		window._player.lock = this.properties.lock;
	}
	this.width = this.properties.width || this.width;
	this.height = this.properties.height || this.height;
	
	this.fake = [];
	if ( this.lookingfor.length > 0 ){
		var target = this.lookingfor[0];;
		var caller = this.lookingcaller[0];;
		
		for(var i=0; i<this.connections.length;i++){
			if( this.connections[i] != caller || 1 ) {
				var connection = this.connections[i].linkTo( target, this );
				if ( connection instanceof Node ) {
					this.fake.push(connection);
					this.node_library[ target.id ] = this.connections[i];
					this.lookingfor.remove(0);;
					this.lookingcaller.remove(0);;
					break;
				}
			}
		}
		
	}
}
Node.prototype.render = function(g,c){
	g.strokeStyle = "#FF00FF";
	g.strokeRect(
		(this.position.x-(this.width*.5))-c.x,
		(this.position.y-(this.height*.5))-c.y,
		this.width,this.height
	);
	for ( var i = 0; i < this.connections.length; i++ ){
		var node = this.connections[i];
		g.strokeStyle = "#88FF00";
		g.beginPath();
		g.moveTo( this.position.x - c.x, this.position.y - c.y );
		g.lineTo( node.position.x - c.x, node.position.y - c.y );
		g.closePath();
		g.stroke();	
	}
	for ( var i = 0; i < this.fake.length; i++ ){
		var node = this.fake[i];
		g.strokeStyle = "#333366";
		g.lineWidth = "3";
		g.beginPath();
		g.moveTo( this.position.x - c.x, this.position.y - c.y );
		g.lineTo( node.position.x - c.x, node.position.y - c.y );
		g.lineWidth = "1";
		g.closePath();
		g.stroke();	
	}
}
/*
Node.prototype.linkTo = function(target,path){
	path = path || {'length':0,'chain':[]};
	if( path.chain.length > 8 ) return false;
	for(var i=0; i<path.chain.length;i++){
		if( path.chain[i] == this ) return false;
	}
	path.chain.push(this);
	if ( game.trace(this.position,target) ) return path;
	this.connections.sort(function(a,b){
		return a.position.distance(target) < b.position.distance(target) ? 1 : -1;
	});
	for(var i=0; i<this.connections.length;i++){
		temp = this.connections[i].linkTo(target,path);
		if( temp ){
			return path;
			path.chain.push( temp );
		}
	}
	path.chain.pop();
	return false;
}*/
Node.prototype.linkTo = function(target_node,caller){
	caller = caller || false;
	
	if ( this == target_node ) {
		return this;
	}
	if ( this.node_library[target_node.id] instanceof Node ){
		return this.node_library[target_node.id];
	}
	if ( this.lookingfor.indexOf( target_node ) < 0 ){
		this.lookingfor.push( target_node );
		this.lookingcaller.push( caller );
	}
}


Player.prototype = new GameObject.prototype;
Player.prototype.constructor = GameObject;

function Player(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	window._player = this;
	game.addObject( new Hud() );
	
	this.weapon = weapons.pistol;
	this.health = 100;
	this.sprite = sprites.player;
	this._ani = 0;
	this.team = 1;
	
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	
	this.mass = .5;
	//this.addModule( mod_tracker );
}

Player.prototype.update = function(){
	var speed = 3.5;
	var force = new Point();
	
	if ( input.state('key1') == 1 ) { this.weapon = weapons.knife; }
	if ( input.state('key2') == 1 ) { this.weapon = weapons.pistol; }
	if ( input.state('key3') == 1 ) { this.weapon = weapons.shotgun; }
	if ( input.state('key4') == 1 ) { this.weapon = weapons.rifle; }
	if ( input.state('key5') == 1 ) { this.weapon = weapons.gernade; }
	
	if ( input.state('up') > 0 ) { force.y -= speed; }
	if ( input.state('down') > 0 ) { force.y += speed; }
	if ( input.state('left') > 0 ) { force.x -= speed; }
	if ( input.state('right') > 0 ) { force.x += speed; }
	
	var mouse_x = input.mouseCenter.x + ( game.camera.x - this.position.x );
	var mouse_y = input.mouseCenter.y + ( game.camera.y - this.position.y );
	
	this.angle = Math.atan2( mouse_x, mouse_y );
	//this.frame_row = 8 - (Math.floor( ( (2*Math.PI) - ( this.angle + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) ));
	this.frame_row = ( 4 + Math.round( ( -this.angle + Math.PI ) * ( 8 / (2 * Math.PI) ) ) ) % 8;
	$('#clearer').html(this.frame_row);
	
	this._cooldown -= game.delta;
	if ( input.state('click') > 0 ) this.weapon.apply(this);
	
	var angle = Math.atan2( force.x, force.y );
	if ( force.x != 0 || force.y != 0 ) {
		this._ani = ( this._ani + (0.3 * game.delta) ) % 3;
		this.frame = Math.floor( this._ani );
	} else {
		this.frame = 0;
	}
	
	this.applyForce( force );
	
	this.applyForce( new Point(0,0.5) );
	
	if ( this.health < 1 ) {
		game.removeObject( this );
	}
}
Player.prototype.render = function(g,c){
	game.g.lineWidth = 3;
		
	if( this.my_node instanceof Node ){
		game.g.strokeStyle = "#000000";
		game.g.beginPath();
		game.g.moveTo(this.position.x-c.x,this.position.y-c.y);
		game.g.lineTo(this.my_node.position.x-c.x,this.my_node.position.y-c.y);
		game.g.stroke();
		game.g.closePath();
		game.g.beginPath();
	}
	if( this.goal instanceof Point ){
		game.g.strokeStyle = "#AA0000";
		game.g.moveTo(this.position.x-c.x,this.position.y-c.y);
		game.g.lineTo(this.goal.x-c.x,this.goal.y-c.y);
		game.g.stroke();
		game.g.closePath();
	}
	game.g.lineWidth = 1;
	GameObject.prototype.render.apply(this,[g,c]);
}

Zombie.prototype = new GameObject();
Zombie.prototype.constructor = GameObject;

function Zombie(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 15;
	this.height = 15;
	this.speed = 1.5;
	
	this.sprite = sprites.bullman;
	this._ani = 0;
	
	this.behave_attack_cooldown = 0;
	this.behave_reverse = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_killable );
	this.addModule( mod_tracker );
	this.mass = 0.5;
}
Zombie.prototype.update = function() {
	if( !this.goal ) return;
	
	var angle_to_player = Math.atan2(
		this.position.x - this.goal.x,
		this.position.y - this.goal.y
	);
	if ( this.health > 0 ) {
		if ( this.position.distance( _player.position ) < 24 ) {
			//Warming a melee attack
			this.behave_attack_cooldown -= game.delta;
			if ( this.behave_attack_cooldown <= 0 ) {
				bullet = new Bullet( 
					this.position.x, 
					this.position.y,
					angle_to_player-Math.PI,
					this.team
				);
				bullet.age = 5;
				bullet.damage = 10;
				game.addObject( bullet );
				this.behave_attack_cooldown = 20;
			}
		} else {
			this.behave_attack_cooldown = Math.max(5,this.behave_attack_cooldown);
			
			var direction = this.behave_reverse > 0 ? -1 : 1;
			this.applyForce(
				-Math.sin( angle_to_player ) * this.speed * direction,
				-Math.cos( angle_to_player ) * this.speed * direction
			);
			this.behave_reverse -= game.delta;
		}
		
		this._ani += 1 * game.delta;
		this.frame = Math.floor( this._ani * 0.2 ) % 4;
		//this.frame_row = Math.floor( ( (2*Math.PI) - ( angle_to_player + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) );
		//this.frame_row %= 8;
	}
}
Zombie.prototype.oncollide = function(cols) {
	for(var i=0;i<cols.length;i++){
		if ( cols[i] instanceof GameObject ) {
			this.behave_reverse = 30;
		}
	}
}

ZombieSpawner.prototype = new GameObject();
ZombieSpawner.prototype.constructor = GameObject;
function ZombieSpawner(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
	this.height = 40;
	
	this.sprite = sprites.spawner;
	this.addModule( mod_killable );
	this.health = 300;
	this.time = 0;
}
ZombieSpawner.prototype.update = function(){
	if ( this.health > 0 ) {
		if ( window._player instanceof Player ) {
			if( this.time < 0 ) {
				this.time = 700;
				temp = new Zombie( this.position.x, this.position.y + 32 );
				game.addObject( temp );
			}
			if ( window._player.health > 0 ) {
				this.time-=game.delta;
			}
		}
	} else {
		this.frame_row = 1;
		this.team = 0;
	}
}

Swarmer.prototype = new GameObject();
Swarmer.prototype.constructor = GameObject;
function Swarmer(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.sprite = sprites.bullman;
	this.team = 2;
	this.speed = 8;
	this.turn_speed = 1 / 12;
	this.angle = 0;
	
	this._cooldown = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_killable );
	this.health = 10;
	this.mass = 0.0625;
	this.dir = new Point;
}
Swarmer.prototype.update = function(){
	var player_vector = new Point(
		_player.position.x - this.position.x,
		_player.position.y - this.position.y
	);
	var player_angle = Math.atan2( player_vector.x, player_vector.y );
	var speed = this.speed;
	
	if ( this._cooldown < 0 ) {
		//Attack mode
		if( this.intersects(_player) ){
			var knock = Point.fromAngle(this.angle);
			_player.applyForce( knock );
			_player.health -= 5;
			this._cooldown = 80;
		}
		this.angle += Math.angleTurnDirection(this.angle, player_angle) * this.turn_speed * game.delta;	
	} else {
		speed *= 0.25;
		this._cooldown -= game.delta;
	}
	
	this.applyForce(
		Math.sin( this.angle ) * speed * game.delta,
		Math.cos( this.angle ) * speed * game.delta
	);
	
	this.dir.x = Math.sin( this.angle ) * 10;
	this.dir.y = Math.cos( this.angle ) * 10;
}
Swarmer.oncollide = function(){
	this._cooldown = Math.max( this._cooldown, 20 );
}
Swarmer.prototype.render = function(g,c){
	g.fillStyle = "#0000FF";
	g.fillRect(this.position.x-c.x,this.position.y-c.y, 4,4);
	g.fillStyle = "#00CCFF";
	g.fillRect(this.position.x + this.dir.x -c.x,this.position.y + this.dir.y -c.y, 4,4);
}

Chipper.prototype = new GameObject();
Chipper.prototype.constructor = GameObject;
function Chipper(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	
	this.sprite = sprites.bullman;
	this.speed = 2;
	this.angle = 0;
	
	this._cooldown = Math.random() * 200 ;
	this._ai_walkway = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_killable );
	this.addModule( mod_tracker );
	this.health = 50;
	this.mass = 0.125;
	this.dir = new Point;
}
Chipper.prototype.update = function(){
	if ( !(this.goal instanceof Point ) ) return;
	var player_vector = new Point(
		this.goal.x - this.position.x,
		this.goal.y - this.position.y
	);
	this.angle = Math.atan2( player_vector.x, player_vector.y );
	var speed = this.speed;
	if ( player_vector.length() < 50 ){
		//this._ai_walkway = 80;
	}
	
	if ( this._cooldown < 10 ) {
		//Attack mode
		if( this._cooldown < 0  ){
			weapons.pistol.apply(this);
			this._cooldown = 125;
		}
		speed = 0;
	} else if ( this._ai_walkway > 0 ) {
		speed = -speed;
	}
	this._ai_walkway -= game.delta;
	this._cooldown -= game.delta;
	
	
	this.applyForce(
		Math.sin( this.angle ) * speed * game.delta,
		Math.cos( this.angle ) * speed * game.delta
	);
	
	this.dir.x = Math.sin( this.angle ) * 10;
	this.dir.y = Math.cos( this.angle ) * 10;
}
Chipper.prototype.render = function(g,c){
	g.fillStyle = "#0000FF";
	g.fillRect(this.position.x-c.x-4,this.position.y-c.y-4, 8,8);
	g.fillStyle = "#00CCFF";
	g.fillRect(this.position.x + this.dir.x -c.x,this.position.y + this.dir.y -c.y, 4,4);
}

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x, y, angle, team, damage){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.damage = damage || 20;
	this.angle = angle;
	this.speed = 8.0;
	this.age = 40;
	this.team = team || 1;
}
Bullet.prototype.oncollide = function(){
	this.parent.removeObject( this );
}
Bullet.prototype.update = function(){
	this.age -= game.delta;
	game.c_move( this,
		this.speed * Math.sin( this.angle ) * game.delta,
		this.speed * Math.cos( this.angle ) * game.delta
	);
	if( this.age < 1 ){
		this.parent.removeObject( this );
	} else {
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			if ( overlap[i].team != undefined && overlap[i].team > 0 && overlap[i].team != this.team ) {
				overlap[i].health -= this.damage;
				if ( overlap[i].applyForce instanceof Function ) {
					overlap[i].applyForce( 
						Math.sin( this.angle ) * this.damage * 0.5,
						Math.cos( this.angle ) * this.damage * 0.5
					);
				}
				game.removeObject( this );
				break;
			}
		}
	}
}
Bullet.prototype.render = function(g, camera){
	g.fillRect(
		this.position.x - camera.x,
		this.position.y - camera.y,
		4, 4
	);
}

Gernade.prototype = new GameObject();
Gernade.prototype.constructor = GameObject;
function Gernade(x, y, angle, team){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.damage = 80;
	this.radius = 100;
	this.angle = angle;
	this.speed = 1.0;
	this.age = 50;
	this.team = team || 1;
}
Gernade.prototype.oncollide = function(lines){
	if ( lines.length > 1 ){
		this.angle += Math.PI;
	} else {
		var line = lines[0];
		var n = line.normal();
		var v = Point.fromAngle(this.angle);
		var u = n.scale( v.dot(n) );
		var w = v.subtract(u);
		
		var a = w.subtract(u);
		this.angle = Math.atan2(a.x,a.y);
	}
	console.log( this.angle );
	
	//var langle = Math.atan2(line.start.x-line.end.x,line.start.y-line.end.y);
	//this.angle += langle;
}
Gernade.prototype.update = function(){
	this.age--;
	
	if( this.age < 1 ){
		this.width = this.radius;
		this.height = this.radius;
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			var target = overlap[i];
			if ( target.team != undefined && target.team > 0 && target.team != this.team ) {
				knock_angle = Math.atan2(
					target.position.x - this.position.x,
					target.position.y - this.position.y
				) + Math.pi;
				game.c_move( target, 
					Math.sin( this.angle ) * 10, 
					Math.cos( this.angle ) * 10 
				);
				target.health -= this.damage;
			}
		}
		game.removeObject(this);
	}else {
		var move_speed = 0.125 * this.age * this.speed;
		game.c_move( this,
			move_speed * Math.sin( this.angle ),
			move_speed * Math.cos( this.angle )
		);
	}
}
Gernade.prototype.render = function(g, camera){
	g.fillRect(
		this.position.x - ( camera.x + (this.width*.5)),
		this.position.y - ( camera.y + (this.width*.5)),
		8, 8
	);
}
///////////////////////////////////////////
// PROPS AND TILES
///////////////////////////////////////////

Tile.prototype = new GameObject();
Tile.prototype.constructor = GameObject;

function Tile(x,y,sprite){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprite;
	this.zIndex = -99999;
}
Tile.prototype.update = function(){ this.zIndex = this.position.y - 99999; }

Prop.prototype = new GameObject();
Prop.prototype.constructor = GameObject;
function Prop(x,y,sprite){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprite;
}

Tree.prototype = new GameObject();
Tree.prototype.constructor = GameObject;
function Tree(x,y) {
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.tree_trunk_ash;
	
	this.brushes = [];
	var positions = [
		new Point( -50, -60 ),
		new Point( 50, -60 ),
		new Point( -25, -40 ),
		new Point( 25, -40 ),
		new Point( 0, -32 ),
	
		new Point( -25, -70 ),
		new Point( 25, -70 ),
		new Point( 0, -65 ),
	
		new Point( -35, -95 ),
		new Point( 35, -95 ),
		new Point( 15, -90 ),
		new Point( 0, -90 ),
		
		
		new Point( -15, -115 ),
		new Point( 15, -115 ),
		
		new Point( 0, -140 ),
	];
	
	window.__wind = window.__wind || 0.002;
	for ( var i = 0; i < positions.length; i++  ) {
		temp = {}
		temp.sprite = sprites.tree_brush_ash;
		
		var thickness = Math.floor( 5 - (i * 0.4) );
		
		temp.position = new Point();
		temp.center = positions[i];
		temp.shake = Math.min( 15 / Math.abs( temp.center.x )  , 1 );
		temp.pos_t = (temp.center.x * 0.03) + (Math.random() * 0.9) ;
	
		this.brushes.push ( temp );
	}
}
Tree.prototype.update = function(){
	for ( var i = 0; i < this.brushes.length; i++  ) {
		this.brushes[i].pos_t = this.brushes[i].pos_t + window.__wind;
		var wind_x = Math.sin( this.brushes[i].pos_t ) * (30 * this.brushes[i].shake * window.__wind);
		var wind_y = Math.sin( this.brushes[i].pos_t * 3 ) * (0.1 * this.brushes[i].shake * window.__wind);
		
		this.brushes[i].position.x = Math.floor( this.brushes[i].center.x + wind_x );
		this.brushes[i].position.y = Math.floor( this.brushes[i].center.y + wind_y );
	}
}

Tree.prototype.render = function( g, camera ){
	Prop.prototype.render.call( this, g, camera );
	
	for ( var i = 0; i < this.brushes.length; i++  ) {
		this.brushes[i].sprite.render(g, new Point(
			this.brushes[i].position.x + (this.position.x - camera.x),
			this.brushes[i].position.y + (this.position.y - camera.y)
		) );
	}
}

/* Weapons */

var weapons = {
	pistol : function(){
		//Pistols
		if ( input.state('click') > 1 ) return;
		this.parent.addObject( new Bullet( 
			this.position.x,
			this.position.y,
			this.angle,
			this.team
		) );
	},
	shotgun : function(){
		//Shot gun
		if ( this._cooldown > 0 ) return;
		
		var delta = 0.5;
		var pellets = 8;
		for ( var i = 0; i < pellets; i++ ){
			var spread = (delta*.5) - ( Math.random() * delta );
			var bullet = new Bullet( 
				this.position.x,
				this.position.y,
				(this.angle+spread),
				this.team
			);
			bullet.damage = 5;
			this.parent.addObject( bullet );
		}
		this._cooldown = 15;
	},
	rifle : function(){
		//Rifle
		if ( this._cooldown > 0 ) return;
		var bullet = new Bullet( 
			this.position.x,
			this.position.y,
			this.angle,
			this.team
		);
		bullet.damage = 100;
		this.parent.addObject( bullet );
		this._cooldown = 35;
	},
	gernade : function() {
		//gernade
		if ( this._cooldown > 0) return;
		var gernade = new Gernade( 
			this.position.x,
			this.position.y,
			this.angle,
			this.team
		);
		this.parent.addObject( gernade );
		this._cooldown = 40;
	}
};

/* Modules */
var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 0.125;
		this.inertia = new Point();
		this.forces = new Array();
		this.applyForce = function(delta,y,absolute){
			if ( delta instanceof Point ){
				absolute = y || false;
			} else {
				delta = new Point(delta,y);
				absolute = absolute || false;
			}
			this.forces.push( [delta,absolute] );
		}
	},
	'update' : function(){
		var mu = .3 - (.1*this.mass);
		var force = new Point(
			this.inertia.x - (this.inertia.x * mu * game.delta ),
			this.inertia.y - (this.inertia.y * mu * game.delta )
		);
		for( var i=0;i<this.forces.length;i++){
			var temp = this.forces[i][0];
			var abs = this.forces[i][1];
			if( temp.x != 0 || temp.y != 0 ){
				temp = temp;
			}				
			if( abs && 0) {
				force = force.add( temp );
			} else {
				force = force.add( new Point( temp.x * mu, temp.y * mu ) );
			}
		}
		this.forces = new Array();
		game.c_move( this, force.x * game.delta, force.y * game.delta );
		this.inertia = force;
	}
}

var mod_tracker = {
	'init' : function(){
		this.goal = new Point();
		this.my_node = false;
		this.target = _player;
	},
	'update':function(){
		if( !(this.target instanceof GameObject) ) return;
		
		var width = Math.max(this.width, this.height);
		
		if ( game.trace(this.position, this.target.position,width) ){
			this.goal = this.target.position;
			this.my_node = false;
		} else {
			//No line of sight, get a path.
			if( this.position.distance(this.goal) < 20 ) {
				this.goal = false;
				this.my_node = false;
			}
			if ( !this.my_node ) {
				this.my_node = game.nearestnode(this,width); 
			}
			var target_node = game.nearestnode( this.target);
			if( this.my_node instanceof Node && target_node instanceof Node ) {
				var next_node = this.my_node.linkTo( target_node );
				if ( next_node instanceof Node ) {
					
					if ( game.trace(this.position, next_node.position, width) ){
						this.goal = next_node.position;
					} else {
						this.goal = this.my_node.position;
					}
				}
			}
		}
	}
}

var mod_killable = {
	'init' : function(){
		this.health = 100;
		this.team = 2;
		this.shootable = true;
	},
	'update' : function(){
		if ( this.health <= 0 ){ 
			game.removeObject( this );
		}
	}
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
	},
	'update' : function(){		
		this.camera_target.x = this.position.x - 160;
		this.camera_target.y = this.position.y - 120;
		if ( this.lock instanceof Array && this.lock.length >= 4 ){
			this.camera_target.x = Math.max( Math.min(
				this.camera_target.x, this.lock[1] - 320
			), this.lock[3]);
			
			this.camera_target.y = Math.max( Math.min(
				this.camera_target.y, this.lock[2] - 240
			), this.lock[0])
		}
		var speed = 5 * game.delta;
		var move_x = Math.min( Math.abs( this.camera_target.x - this.parent.camera.x ), speed );
		var move_y = Math.min( Math.abs( this.camera_target.y - this.parent.camera.y ), speed );
		
		this.parent.camera.x += this.parent.camera.x < this.camera_target.x ? move_x : -move_x;
		this.parent.camera.y += this.parent.camera.y < this.camera_target.y ? move_y : -move_y;
		
		game.camera.x = this.position.x - 480;
		game.camera.y = this.position.y - 360;
	}
}