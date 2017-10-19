Walker.prototype = new GameObject();
Walker.prototype.constructor = GameObject;
function Walker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "walker";
	this.speed = 0.35;
	this.zIndex = 13;
	this.start = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.seatObj = new GameObject(x,y);
	this.seatObj.width = 32;
	this.seatObj.height = 16;
	this.seatObj.addModule( mod_block );
	//this.seatObj.visible = false;
	
	
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	this.stepAnim = 0.0;
	this.standTime = 0.0;
	this.walkerID = false;
	
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			this.seatObj.trigger("collideObject", obj);
			obj.trigger("collideObject", this.seatObj);
		}
	});
	this.on("sleep", function(){
		if(this.walkerID){
			this.destroy();
		} else {
			this.position.x = this.start.x;
			this.position.y = this.start.y;
		}
	})
	
	this.on("destroy", function(){
		this.seatObj.destroy();
	});
}
Walker.prototype.update = function(){
	var progress = this.standTime / Walker.STAND_TIME;
	
	if(this.seatObj.block_isOnboard(_player)){
		if(this.standTime < Walker.STAND_TIME){
			this.frame = Walker.anim_stand.frame(progress);
			this.standTime = Math.min(this.standTime+this.delta, Walker.STAND_TIME);
			_player.position.x = Math.lerp(_player.position.x, this.position.x, progress);
		} else {
			if(input.state("left") > 0){
				this.force.x -= this.speed * this.delta;
				this.flip = true;
			}
			if(input.state("right") > 0){
				this.force.x += this.speed * this.delta;
				this.flip = false;
			}
			
			this.stepAnim = (this.stepAnim + this.delta * Math.abs(this.force.x) * 0.2) % 6;
			this.frame.x = this.stepAnim % 3;
			this.frame.y = this.stepAnim / 3;
			
			_player.position.x = this.position.x;
			_player.force.x = 0;
			
			if(Math.abs(this.force.x) < 0.1){
				this.stepAnim = 0.0;
			}
		}
	} else {
		this.frame = Walker.anim_stand.frame(progress);
		this.standTime = Math.max(this.standTime - this.delta, 0);
	}
	
	//Change seat position
	this.seatObj.fullUpdate();
	this.seatObj.position.x = this.position.x;
	this.seatObj.position.y = this.position.y - (progress*8.0);
}

Walker.STAND_TIME = Game.DELTASECOND * 0.5;
Walker.anim_stand = new Sequence([
	[2,2,0.333],
	[1,2,0.333],
	[0,2,0.333]
]);
