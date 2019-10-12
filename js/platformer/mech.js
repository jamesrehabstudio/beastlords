class Mech extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.startPosition = new Point(x,y);
		this.sprite = "mech";
		this.width = 40;
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
		this.knockback = 0;
		this.ejectTime = 0;
		this.bootTime = 8;
		
		this.flip = ops.getBool("flip", true);
		
		this.onboard = null;
		
		this.on(["player_death", "sleep"], function(){
			this.pilotSleep = 0.0;
			this.position = this.startPosition.floor();
		});
		this.on("collideObject", function(obj){
			if(this.pilotSleep <= 0 && obj instanceof Player){
				if(!obj.grounded && obj.force.y > 0){
					this.ejectTime = 0;
					this.onboard = obj;
					this.zIndex = this.onboard.zIndex;
				}
			}
		});
		this.on("hurt", function(obj, damage){
			if(this.onboard instanceof Player){
				audio.play("playerhurt");
				damage = damage || obj.damage;
				
				//game.slow(0.0, 0.25);
				damage = Math.max(damage - this.armor, 1);
				if(this.onboard.life - damage <= 1){
					this.onboard.life = 1;
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
		let headOffset = Mech.BODY_MID;
		
		if(this.delta <= 0) {
			return;
		}
		
		if(this.onboard instanceof Player){
			this.onboard.camera_offset = Point.lerp(this.onboard.camera_offset, new Point(96 * this.forward(),0), this.delta);
			this.knockback *= 1 - 0.1 * this.delta * UNITS_PER_METER;
			
			this.onboard.position.x = Math.lerp(this.onboard.position.x, this.position.x, this.delta * 10);
			this.onboard.position.y = this.position.y;
			this.onboard.force.y = 0;
			
			if(this.bootTime <= 0){
				let move = Math.min( Math.sin(this.rotLeg1 * Math.deg2rad), Math.sin((this.rotLeg1+180) * Math.deg2rad) );
				let dis = 56 - move * 24;
				let force = 0;
				let legsDir = 0;
				
				force += this.knockback;
				
				if(input.state("right")){
					force += Math.abs(move) * this.speed * this.delta;
					legsDir = -this.forward();
				} else if(input.state("left")){
					force -= Math.abs(move) * this.speed * this.delta;
					legsDir = this.forward();
				}
				
				let fdir = force > 0 ? 1 : -1;
				let l = game.t_raytrace(new Line(this.position, this.position.add(new Point(this.width*0.5*fdir, this.height))));
				if(!l){
					this.rotLeg1 += this.delta * 180 * legsDir;
					this.position.x += force;
				} else {
					this.position.x += (this.position.x < this.startPosition.x ? 1 : -1) * this.delta;
					this.knockback = 0;
				}
				
				if(input.state("fire") == 1){
					this.fire();
				}
				
				if(input.state("up") > 0 ){
					headOffset = Mech.BODY_HIG;
				} else if(input.state("down") > 0){
					headOffset = Mech.BODY_LOW;
				}
				
				
				
				
				let p = game.t_raytrace(new Line(this.position.floor(), this.position.floor().add(new Point(0,200))), Rain.BlockOnly);
				
				if(p){
					let dif = p.subtract(this.position);
					this.position.y = p.y - dis;
				} else {
					this.position.y += UNITS_PER_METER * this.delta;
				}
				
				
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
				
				if(input.state("jump") > 0 ){
					if(this.ejectTime >= 1) {
						//Eject!!
						this.eject();
					} else {
						this.ejectTime += this.delta;
					}
				} else {
					this.ejectTime = 0;
				}
			} else {
				this.bootTime -= this.delta;
				headOffset = this.bootTime > 5.1 ? Mech.BODY_LOW : Mech.BODY_MID;
			}
		} else {
			this.pilotSleep -= this.delta;
			headOffset = Mech.BODY_LOW
		}
		
		//Move head
		let headTarget = this.position.y + headOffset;
		this.headPos = Math.clamp(this.headPos, headTarget-48, headTarget+48);
		this.headPos = Math.lerp(this.headPos, headTarget, this.delta * 3.0);
	}
	
	eject(){
		this.onboard.jump();
		this.onboard.camera_offset = new Point();
		this.onboard = null;
		this.pilotSleep = 6;
	}
	
	fire(){
		for(let i=0; i < this.missiles.length; i++){
			if(this.missiles[i] instanceof Bullet){
				if(!this.missiles[i]._isAdded) { this.missiles[i] = null; }
			}
			
			if(this.missiles[i] == null){
				let ops = Options.convert({
					team: this.team,
					damage: this.damage,
					rotation: this.flip ? 180 : 0,
					turnSpeed: 0.0,
					speed: 10.0,
					zIndex: this.zIndex
				});
				
				let missile = Bullet.createHomingMissile(this.position.x + this.forward() * 64, this.headPos - 12, ops);
				missile.frame = new Point(4,3);
				
				game.addObject(missile);
				this.missiles[i] = missile;
				
				//Knockback
				this.knockback = this.forward() * -2;
				
				return;
			}
		}
		
		
	}
	
	render(g,c){
		let hflip = new Point(this.forward(), 1);
		let rot1 = 180-this.rotLeg1;
		let rot2 = 180+rot1;
		
		//head
		g.renderSprite(this.sprite, new Point(this.position.x + 16 * this.forward(), this.headPos).subtract(c), this.zIndex-1, this.frame, this.flip);
		
		//Body
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex+1, new Point(3,0), this.flip);
		
		
		//Leg1
		g.renderSprite(this.sprite, this.position.add(Mech.THIGH_OFF.scale(hflip)).subtract(c), this.zIndex+2, new Point(2,0), this.flip, {"rotate" : rot1 * this.forward()});
		
		let angle1 = (rot1 - 15) * Math.deg2rad;
		
		let legoff1 = new Point(
			Mech.THIGH_OFF.x + 32 * Math.cos(angle1),
			Mech.THIGH_OFF.y + 32 * Math.sin(angle1)
		).scale(hflip);
		
		g.renderSprite(this.sprite, this.position.add(legoff1).subtract(c), this.zIndex+3, new Point(1,0), this.flip);
		
		
		//Leg2
		g.renderSprite(this.sprite, this.position.add(Mech.THIGH_OFF.scale(hflip)).subtract(c), this.zIndex-2, new Point(2,0), this.flip, {"rotate" : rot2 * this.forward()});
		
		let angle2 = (rot2 - 15) * Math.deg2rad;
		
		let legoff2 = new Point(
			Mech.THIGH_OFF.x + 32 * Math.cos(angle2),
			Mech.THIGH_OFF.y + 32 * Math.sin(angle2)
		).scale(hflip);
		
		g.renderSprite(this.sprite, this.position.add(legoff2).subtract(c), this.zIndex-3, new Point(1,0), this.flip);
	}
	hudrender(g,c){
		let hudColor = [0.2,1.0,0.1,1.0];
		
		if(this.bootTime > 0 && this.onboard != null){
			//boot check list
			if(this.bootTime > 6.5){
				textArea(g, "\x01EXITING STANDBY MODE", 80, 64);
			} else {
				textArea(g, "\x02MAIN POWER ONLINE", 80, 64);
			}
			if(this.bootTime < 6 && this.bootTime > 3){
				textArea(g, "\x01MISSILES PREPARING", 80, 80);
			} else if(this.bootTime <= 3){
				textArea(g, "\x02MISSILES READY", 80, 80);
			}
			if(this.bootTime < 5.8 && this.bootTime > 5.5){
				textArea(g, "\x01MOTOR FUNCTIONS...", 80, 96);
			} else if(this.bootTime <= 5.5){
				textArea(g, "\x02MOTOR FUNCTIONS READY", 80, 96);
			}
			if(this.bootTime < 5.6 && this.bootTime > 5.1){
				textArea(g, "\x01TURRET...", 80, 112);
			} else if(this.bootTime <= 5.1){
				textArea(g, "\x02TURRET READY", 80, 112);
			}
			if(this.bootTime < 5.2 && this.bootTime > 4.1){
				textArea(g, "\x01EJECT CONTROL...", 80, 128);
			} else if(this.bootTime <= 4.1){
				textArea(g, "\x02EJECT CONTROL READY", 80, 128);
			}
			if(this.bootTime < 2){
				textArea(g, "\x02ALL SYSTEMS \x11OPERATIONAL", 80, 180);
			}
		}
		
		if(this.bootTime < 4.1 && this.onboard !== null){
			//Eject notification
			let center 	= new Point(64,120);
			let size 	= new Point(8, 8);
			this._renderBox(g, center.subtract(size), center.add(size), 1, hudColor);
			this._renderBox(g, center.subtract(size.scale(.8, -0.25)), center.add(size.scale(.8, .8)), 1, hudColor);
			g.renderLine(center.add(size.scale(0,-.8)), center.add(size.scale(0.8,0)), 1, hudColor, 10);
			g.renderLine(center.add(size.scale(0,-.8)), center.add(size.scale(-0.8,0)), 1, hudColor, 10);
			g.renderLine(center.add(size.scale(0.8,0)), center.add(size.scale(-0.8,0)), 1, hudColor, 10);
			if(this.ejectTime > 0){
				let ejdelta = Math.clamp01(this.ejectTime);
				g.renderSprite(
					"white", 
					center.add(size), 
					9, 
					new Point(), 
					false, 
					{
						"rotate":180,
						"scalex":size.x*2,
						"scaley":size.y*2*ejdelta,
						"u_color":COLOR_HURT
					}
				);
			}
		}
		
		if(this.bootTime < 3 && this.onboard !== null){
			//Missile notification
			let center 	= new Point(64,144);
			let size 	= new Point(8, 8);
			this._renderBox(g, center.subtract(size), center.add(size.scale(-.4, 1)), 1, hudColor);
			this._renderBox(g, center.subtract(size.scale(.3, 1)), center.add(size.scale(.3, 1)), 1, hudColor);
			this._renderBox(g, center.subtract(size.scale(-.4, 1)), center.add(size.scale(1, 1)), 1, hudColor);
			if(this.missiles[0] !== null && this.missiles[0]._isAdded){
				g.renderSprite("white", center.subtract(size), 9, new Point(), false, {"u_color":COLOR_HURT, "scalex":size.x*0.66, "scaley":size.x*2});
			}
			if(this.missiles[1] !== null && this.missiles[1]._isAdded){
				g.renderSprite("white", center.subtract(size.scale(.3,1)), 9, new Point(), false, {"u_color":COLOR_HURT, "scalex":size.x*0.66, "scaley":size.x*2});
			}
			if(this.missiles[2] !== null && this.missiles[2]._isAdded){
				g.renderSprite("white", center.subtract(size.scale(-.3,1)), 9, new Point(), false, {"u_color":COLOR_HURT, "scalex":size.x*0.66, "scaley":size.x*2});
			}
		}
	}
	
	_renderBox(g, start, end, thickness, color){
		g.renderLine(start, new Point(end.x, start.y), 1, color, 10);
		g.renderLine(new Point(end.x, start.y), end, 1, color, 10);
		g.renderLine(end, new Point(start.x, end.y), 1, color, 10);
		g.renderLine(new Point(start.x, end.y), start, 1, color, 10);
	}
}
Mech.THIGH_OFF = new Point(24,8);
Mech.BODY_LOW = -20;
Mech.BODY_MID = -48;
Mech.BODY_HIG = -72;

self["Mech"] = Mech;