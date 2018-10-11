
//Arm Wrestler

ArmWrestler.prototype = new GameObject();
ArmWrestler.prototype.constructor = GameObject;
function ArmWrestler(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 56;
	this.sprite = "armwrestle";
	
	this.active = false;
	this.defeated = false;
	
	this.score = 0;
	this.scoreTotal = 24;
	this.presses = 0;
	this.rate = 0.1;
	this.timebetween = 0.0;
	this.average = 0.0;
	this.time = 0.0;
	this.cry = Game.DELTASECOND;
	
	this.crowdFrame = new Point();
	
	this.states = {
		"cooldown" : 0,
		"attack" : 0
	}
	
	this.addModule( mod_rigidbody );
	
	
	this.difficulty = o.getInt("difficulty", Spawn.difficulty);
	this.flip = o.getBool("flip", false);
	
	this.mass = 1;
	this.friction = 0.01;
	this.pushable = false;
	this.damage = Spawn.damage(5,this.difficulty);
	this.xpDrop = Spawn.xp(10,this.difficulty);
	this.idleMargin = 128;
	
	this.on("startwrestle", function(obj){
		this.score = this.scoreTotal * 0.5;
		this.presses = 0;
		this.rate = 0.1;
		this.timebetween = 0.0;
		this.average = 0.0;
		this.time = 0.0;
		
		//Remove the player from the world
		obj.visible = false;
		obj.deltaScale = 0.0;
	});
	this.on("stopwrestle", function(obj){
		obj.visible = true;
		obj.deltaScale = 1.0;
	});
	
	
	
	this.on("sleep", function(){
		if(this.defeated){
			this.destroy();
		}
	});
	this.on("wakeup", function(){
		//var dir = this.position.subtract(_player.position);
		//this.flip = dir.x > 0;
	})
	this.on("collideObject", function(obj){
		if(obj instanceof Player && !this.defeated && !this.active){
			this.active = true;
			this.trigger("startwrestle",obj);
		}
	});
}

ArmWrestler.prototype.update = function(){
	if ( this.active) {
		this.crowdFrame.y = (this.crowdFrame.y + this.delta * 6.0) % 4;
		
		this.frame.x = Math.max((this.frame.x + this.delta * 15.0) % 6, 4);
		this.frame.y = 0;
		
		this.timebetween += this.delta;
		this.time += this.delta;
		
		var seconds = this.time / Game.DELTASECOND;
		//var effort = Math.max(Math.min(1.2 + Math.max(Math.sin(seconds)*.3,0)-seconds*0.05,1.4),0.1);
		var effort = Math.clamp( 0.25 + Math.abs( Math.sin(seconds) ), 0.1, 1.4 );
		
		
		this.score -= this.rate * this.delta * effort * 1.0;
		
		if(input.state("fire") == 1){
			this.score += 1;
			
			if(this.presses > 0){
				this.average = (this.average*this.presses+this.timebetween) / (this.presses+1);
			} else {
				this.average = this.timebetween;
			}
			this.timebetween = 0.0;
			this.presses++;
			this.rate = Math.max(1 / this.average, 0.2);
		}
		
		if(this.score <= 0){
			this.active = false;
			_player.hurt(this,this.damage);
			_player.position.x = this.position.x + this.forward() * this.width;
			this.trigger("stopwrestle",_player);
		}
		if(this.score >= this.scoreTotal){
			this.active = false;
			this.defeated = true;
			
			audio.play("kill",this.position); 
			this.grounded = false;
			this.force.y = -5;
			Item.drop(this,15);
			
			this.trigger("stopwrestle",_player);
		}
	} else if (this.defeated){
		this.crowdFrame.y = (this.crowdFrame.y + this.delta * 10.0) % 4;
		
		if(this.cry <= 0){
			this.frame.x = Math.max((this.frame.x + this.delta * 6.0) % 5, 3);
			this.frame.y = 1;
		} else {
			if(this.grounded){
				this.cry -= this.delta
				this.frame.x = 2;
				this.frame.y = 1;
			} else {
				this.frame.x = 1;
				this.frame.y = 1;
			}
		}
	} else {
		this.crowdFrame.y = (this.crowdFrame.y + this.delta * 2.5) % 4;
		
		this.frame.x = 3;
		this.frame.y = 0;
	}
}
ArmWrestler.prototype.render = function(g,c){
	
	g.renderSprite("crowd01",this.position.add(new Point(this.forward()*64, 4)).subtract(c), this.zIndex-1, this.crowdFrame, this.flip);
	
	GameObject.prototype.render.apply(this,[g,c]);
	
	if(this.active){
		g.renderSprite(
			"player",
			this.position.add(new Point(36*this.forward(),4)).subtract(c),
			this.zIndex + 1,
			new Point(1,4),
			!this.flip
		);
	}
}
ArmWrestler.prototype.hudrender = function(g,c){
	if(this.active){
		var width = 64;
		var height = 6;
		var percent = this.score / this.scoreTotal;
		var topleft = this.position.subtract(new Point(width*0.5,40)).subtract(c);
		
		g.color = [1,1,1,1];
		g.scaleFillRect(topleft.x-1,topleft.y-1,width+2,height+2);
		
		g.color = [0,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width,height);
		
		g.color = [1,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width*percent,height);
	}
}