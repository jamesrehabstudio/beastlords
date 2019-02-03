Librarian.prototype = new GameObject();
Librarian.prototype.constructor = GameObject;
function Librarian(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.basePosition = new Point(x,y);
	this.width = 24;
	this.height = 56;
	this.zIndex = 1;
	
	this.sprite = "librarian";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.death_time = Game.DELTASECOND * 1;
	this.friction = 0.2;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"attackpause" : 0,
		"attackpausecooldown" : 0,
		"attackcooldown" : 0,
		"jumpcooldown" : 50,
		"direction" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
Librarian.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {		
		if(this.states.direction){
			this.force.x -= this.speed * this.delta;
			if(this.position.x - this.basePosition.x < -64){
				this.states.direction = 0;
			}
		} else {
			this.force.x += this.speed * this.delta;
			if(this.position.x - this.basePosition.x > 64){
				this.states.direction = 1;
			}
		}
		
		if(this.states.attackpause <= 0){
			this.states.attackcooldown -= this.delta;
		}
		
		if(this.states.attackpausecooldown <= 0){
			this.states.attackpause = Game.DELTASECOND;
			this.states.attackpausecooldown = Game.DELTASECOND * 2 + (Math.random() * 2 * Game.DELTASECOND);
		}
		if(this.states.jumpcooldown <= 0){
			this.force.y = -11;
			this.grounded = false;
			this.states.jumpcooldown = Game.DELTASECOND * 2 + (Math.random() * 2 * Game.DELTASECOND);
		}
		if(this.states.attackcooldown <= 0){
			//throw book
			this.states.attackcooldown = Game.DELTASECOND * 0.333;
			this.flip = dir.x > 0;
			var book = new LibrarianBook(this.position.x, this.position.y);
			book.force.y = -12;
			book.force.x = (this.flip ? -1 : 1) * 5;
			book.damage = this.damage;
			game.addObject(book);
		}
		
		this.states.attackpausecooldown -= this.delta;
		this.states.attackpause -= this.delta;
		this.states.jumpcooldown -= this.delta;
		
	}
}

 

LibrarianBook.prototype = new GameObject();
LibrarianBook.prototype.constructor = GameObject;
function LibrarianBook(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.gravity = 0.8;
	this.sprite = "librarian";
	
	this.damage = 1;
	this.force = new Point(0,0);
	this.frame.y = 1;
	
	this.on("sleep", function(obj){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
			this.destroy();
		}
	});
}

LibrarianBook.prototype.update = function(){
	this.force.y += this.gravity * this.delta;
	//this.force.x = this.force.x * (1 - 0.08 * this.delta);
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
}