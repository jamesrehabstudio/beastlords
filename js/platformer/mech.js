class Mech extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.startPosition = new Point(x,y);
		this.sprite = "mech";
		this.width = 64;
		this.height = 56;
		this.speed = UNITS_PER_METER * 3.0;
		
		this.rotLeg1 = 0.0;
		this.walkCycle = 0.0;
		this.headPos = this.position.y + Mech.BODY_MID;
		this.pilotSleep = 0.0;
		this.damage = 36;
		this.team = 1;
		this.armor = 16;
		this.missiles = [null, null, null];
		
		this.flip = ops.getBool("flip", true);
		
		this.onboard = null;
		
		this.on(["player_death", "sleep"], function(){
			this.pilotSleep = 0.0;
			this.position = this.startPosition.floor();
		});
		this.on("collideObject", function(obj){
			if(this.pilotSleep <= 0 && obj instanceof Player){
				if(!obj.grounded && obj.force.y > 0){
					this.onboard = obj;
				}
			}
		});
		this.on("hurt", function(obj, damage){
			if(this.onboard instanceof Player){
				audio.play("playerhurt");
				
				game.slow(0.0, 0.25);
				damage = Math.max(obj.damage - this.armor, 1);
				if(damage >= this.onboard.life){
					this.onboard.life = 1;
					this.pilotSleep = Game.DELTASECOND;
					this.eject();
				} else {
					this.onboard.life -= damage;
				}
			}
		});
		this.on("block", function(obj){
			game.slow(0.0, Game.DELTAFRAME30);
			audio.play("block", this.position);
		});
	}
	
	update(){
		if(this.onboard instanceof Player){
			
			if(input.state("jump") == 1 ){
				//Eject!!
				this.eject();
				
			} else {
				let move = Math.min( Math.sin(this.rotLeg1 * Math.deg2rad), Math.sin((this.rotLeg1+180) * Math.deg2rad) );
				let dis = 56 - move * 24;
				
				if(input.state("right")){
					let l = game.t_raytrace(new Line(this.position, this.position.add(new Point(this.width*0.5, this.height))));
					if(!l){
						this.rotLeg1 -= this.delta * 180;
						this.position.x += Math.abs(move) * this.speed * this.delta;
					}
				} else if(input.state("left")){
					let l = game.t_raytrace(new Line(this.position, this.position.add(new Point(-this.width*0.5, this.height))));
					if(!l){
						this.rotLeg1 += this.delta * 180;
						this.position.x -= Math.abs(move) * this.speed * this.delta;
					}
				}
				
				if(input.state("fire") == 1){
					this.fire();
				}
				
				let headOffset = Mech.BODY_MID;
				if(input.state("up") > 0 ){
					headOffset = Mech.BODY_HIG;
				} else if(input.state("down") > 0){
					headOffset = Mech.BODY_LOW;
				}
				
				
				//Move head
				let headTarget = this.position.y + headOffset;
				this.headPos = Math.clamp(this.headPos, headTarget-48, headTarget+48);
				this.headPos = Math.lerp(this.headPos, headTarget, this.delta * 3.0);
				
				let p = game.t_raytrace(new Line(this.position.floor(), this.position.floor().add(new Point(0,200))), Rain.BlockOnly);
				
				if(p){
					let dif = p.subtract(this.position);
					this.position.y = p.y - dis;
				} else {
					this.position.y += UNITS_PER_METER * this.delta;
				}
				
				this.onboard.position.x = Math.lerp(this.onboard.position.x, this.position.x, this.delta * 10);
				this.onboard.position.y = this.position.y;
				this.onboard.force.y = 0;
				
				//Test shield
				let shield = new Line(this.forward()*16,-50,this.forward()*48,24).correct().transpose(new Point(this.position.x, this.headPos));
				let blocks = game.overlaps(shield); 
				for(let i=0; i < blocks.length; i++){
					if(blocks[i] instanceof Bullet && blocks[i].team != this.team){
						this.trigger("block", blocks[i]);
						blocks[i].trigger("deflect", this);
						blocks[i].range = -1;
					}
				}
				
				//Test for missiles and core
				let corn = this.corners();
				let hits = game.overlaps(new Point(corn.left,corn.top), new Point(corn.right,corn.bottom));
				for(let i=0; i < hits.length; i++){
					if(hits[i] instanceof Bullet && hits[i].team != this.team){
						this.trigger("hurt", hits[i]);
						hits[i].trigger("death", this);
					}
				}
			}
		} else {
			this.pilotSleep -= this.delta;
		}
	}
	
	eject(){
		this.onboard.jump();
		this.onboard = null;
	}
	
	fire(){
		for(let i=0; i < this.missiles.length; i++){
			if(this.missiles[i] instanceof Bullet){
				if(!this.missiles[i]._isAdded) { this.missiles[i] = null; }
			}
			
			if(this.missiles[i] == null){
				let ops = new Options();
				ops["team"] = this.team;
				ops["damage"] = this.damage;
				ops["rotation"] = this.flip ? 180 : 0;
				ops["turnSpeed"] = 0.0;
				ops["speed"] = 10.0;
				
				let missile = Bullet.createHomingMissile(this.position.x + this.forward() * 64, this.headPos - 12, ops);
				missile.frame = new Point(4,3);
				
				game.addObject(missile);
				this.missiles[i] = missile;
				
				return;
			}
		}
		
		
	}
	
	render(g,c){
		let vflip = new Point(this.forward(), 1);
		let rot1 = this.flip ? (180-this.rotLeg1) : (this.rotLeg1);
		let rot2 = 180 + rot1;
		
		//head
		g.renderSprite(this.sprite, new Point(this.position.x + 16 * this.forward(), this.headPos).subtract(c), this.zIndex, this.frame, this.flip);
		
		//Body
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex+1, new Point(3,0), this.flip);
		
		
		//Leg1
		g.renderSprite(this.sprite, this.position.add(Mech.THIGH_OFF.scale(vflip)).subtract(c), this.zIndex+2, new Point(2,0), this.flip, {"rotate" : rot1});
		
		let angle1 = ((this.flip ? -35 : 145) - rot1) * Math.deg2rad;
		
		let legoff1 = new Point(
			(Mech.THIGH_OFF.x + 32 * Math.cos(angle1)) * this.forward(),
			Mech.THIGH_OFF.y + 32 * Math.sin(angle1)
		);
		
		g.renderSprite(this.sprite, this.position.add(legoff1).subtract(c), this.zIndex+3, new Point(1,0), this.flip);
		
		//Leg2
		g.renderSprite(this.sprite, this.position.add(Mech.THIGH_OFF.scale(vflip)).subtract(c), this.zIndex-1, new Point(2,0), this.flip, {"rotate" : rot2});
		
		let angle2 = ((this.flip ? -35 : 145) - rot2) * Math.deg2rad;
		
		let legoff2 = new Point(
			(Mech.THIGH_OFF.x + 32 * Math.cos(angle2)) * this.forward(),
			Mech.THIGH_OFF.y + 32 * Math.sin(angle2)
		);
		
		g.renderSprite(this.sprite, this.position.add(legoff2).subtract(c), this.zIndex-2, new Point(1,0), this.flip);
	}
	
	leg1pos(){
		let rot1 = this.flip ? (180-this.rotLeg1) : (this.rotLeg1);
		let angle = ((this.flip ? -35 : 145) + rot1) * Math.deg2rad;
		
		let legoff = new Point(
			(Mech.THIGH_OFF.x + -32 * Math.cos(angle)) * this.forward(),
			Mech.THIGH_OFF.y + -32 * Math.sin(angle)
		);
	}
	
}
Mech.THIGH_OFF = new Point(24,8);
Mech.BODY_LOW = -20;
Mech.BODY_MID = -48;
Mech.BODY_HIG = -72;

self["Mech"] = Mech;