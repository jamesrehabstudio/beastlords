class Wedding extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.zIndex = -5;
		
		this.sprite = "cutscene_wedding";
		this.sprite_guests = "cutscene_wedding_guests";
		this.lover_sprite = "bear";
		
		this.loadSprites = ["cutscene_wedding","cutscene_wedding_guests","bear"];
		this.loadAudio = [];
		
		this.stage = -1;
		this.lovePower = 16.0;
		this.transitionTime = 3.0;
		this.startDelay = 4.0;
		this.shake = new Point();
		this.anim = 0.0;
		
		this.throwForce = new Point(6,-12);
		this.engine = new Point();
		this.bouquet = new Point(16,0);
		this.bride = new Point();
		this.crowd = new Point();
		this.lover = new Point(-16,48);
		this.kiss1 = new Point(-24,0);
		this.kiss2 = new Point(24,0);
		this.rejected = false;
		
		this.text_resist = "Hammer attack to resist love";
		this.text_love = "A love that'll last forever";
		
		this.on("player_death", function(){
			this.reset();
		});
		this.on("sleep", function(){
			if(this.stage >= 3 ){
				NPC.set("wedding_dress", 3);
			}
		});
	}
	get hasItem() { return NPC.get("wedding_dress") == 2; }
	reset(){
		this.stage = -1;
		this.anim = 0.0;
		this.lovePower = 16.0;
		this.transitionTime = 3.0;
		this.startDelay = 4.0;
		this.bouquet = new Point(16,0);
		this.throwForce = new Point(6,-12);
		this.lover = new Point(-16,48);
		this.rejected = false;
	}
	rejectLover(){
		this.rejected = true;
		let rd = new Ragdoll(0,0);
		rd.sprite = this.lover_sprite;
		rd.position = this.position.add(this.lover);
		rd.force = new Point(-6, -4);
		rd.frame = new Point(1,2);
		rd.zIndex = this.zIndex + 5;
		rd.on("death", function(){
			this.moneyDrop = 5;
			Item.drop(this);
		});
		game.addObject(rd);
		game.slow(0.0,2.0);
	}
	update(){
		this.shake = Point.lerp(this.shake, new Point(), this.delta * 4.0);
		this.engine.y = Math.floor((game.time * 16) % 2);
		
		if(!this.hasItem){
			//Waiting for player to get the dress
		} else if(this.stage < 0){
			//Wedding animation
			this.anim += this.delta;
			
			if(this.anim < 5){
				//wait
			} else if(this.anim < 8){
				//move in for a kiss
				let p = Math.clamp01((this.anim-5) / 2);
				this.bride.x = Math.lerp(0,-24,p);
				this.bouquet.x = 16 + this.bride.x;
			} else if(this.anim < 10){
				//move out
				let p = Math.clamp01((this.anim-8) / 1);
				this.bride.x = Math.lerp(-24,0,p);
				this.bouquet.x = 16 + this.bride.x;
			} else if(this.bouquet.y < 80){
				//Throw
				let drate = this.delta * 0.3;
				this.throwForce.y += UNITS_PER_METER * drate;
				this.throwForce.x *= 1 - (0.125 * drate);
				
				this.bouquet = this.bouquet.add(this.throwForce.scale(drate).scale(UNITS_PER_METER));
				
				let area1 = _player.bounds();
				let area2 = new Line(this.bouquet.add(this.position).subtract(new Point(-8,-8)), this.bouquet.add(this.position).subtract(new Point(+8,+8)));
				
				if(area1.overlaps(area2)){
					this.stage = 0;
					this.anim = 0.0;
					_player.flip = true;
					_player.force.x = 0;
					_player.canmove = false;
				}
			}
			
		} else if(this.stage == 0){
			//Lover approaches player
			this.anim += this.delta;
			
			let p = Math.clamp01( (this.anim-1.5) / 2 );
			let playerdif = _player.position.subtract(this.position);
			
			this.bouquet = playerdif.add(new Point(_player.forward()*16,0));
			this.lover.x = Math.lerp(-16, playerdif.x - 48, p);
			
			if(this.anim > 5){
				this.stage = 1;
				this.bouquet.y = 80;
			}
		} else if(this.stage == 1){
			if(input.state("fire") == 1){
				this.shake = new Point( Math.random() - 0.5, Math.random() - 0.5).normalize(3);
				this.lovePower += 1.0;
				this.startDelay = 0.0;
			}
			
			if(this.startDelay <= 0){
				this.lovePower -= this.delta * 4.0;
			} else {
				this.startDelay -= this.delta;
			}
			
			if(this.lovePower <= 0){
				//lose
				this.stage = 2;
			} else if(this.lovePower > 32){
				//win
				this.stage = 3;
			}
		} else {
			if(this.transitionTime < 0){
				if(this.stage == 2){
					this.stage = 4;
					this.transitionTime = 4.0;
				} else if(this.stage == 3){
					_player.canmove = true;
					this.stage = 999;
					this.rejectLover();
				} else if(this.stage == 4){
					this.stage = 5;
					this.transitionTime = 6.0;
				} else if(this.stage == 5){
					_player.canmove = true;
					_player.life = 0;
					_player.trigger("death");
				}
			} else {
				this.transitionTime -= this.delta;
			}
			
			if(this.stage == 5){
				let p = 1 - this.transitionTime / 6;
				this.kiss1.x = Math.lerp(-24,-4,p);
				this.kiss2.x = Math.lerp(24,4,p);
			}
		}
	}
	render(g,c){
		if(this.hasItem){
			//The wedding is on
			g.renderSprite(this.sprite_guests,this.position.add(this.bouquet).subtract(c),this.zIndex+2,new Point(1,1),false);
			
			g.renderSprite(this.sprite_guests,this.position.add(this.bride).subtract(c),this.zIndex,new Point(0,0),false);
			g.renderSprite(this.sprite_guests,this.position.add(this.engine).subtract(c),this.zIndex-1,new Point(1,0),false);
			
			g.renderSprite(this.sprite_guests,this.position.add(this.crowd).subtract(c),this.zIndex+1,new Point(0,1),false);
			
			if(!this.rejected){
				g.renderSprite(this.lover_sprite,this.position.add(this.lover).subtract(c),this.zIndex+2,new Point(1,2),false);
			}
		} else {
			//Waiting for the dress
		}
		
	}
	hudrender(g,c){
		let center = game.resolution.scale(0.5).floor();
		
		if(this.stage >= 1 && this.stage < 8){
			let margin = (game.resolution.x - 256) * 0.5;
			g.color = COLOR_BLACK;
			g.drawRect(0,0,game.resolution.x,48,this.zIndex+5);
			g.drawRect(0,192,game.resolution.x,48,this.zIndex+5);
			g.drawRect(0,48,margin,144,this.zIndex+5);
			g.drawRect(margin+256,48,margin,144,this.zIndex+5);
		}
		
		if(this.stage == 1){
		
			g.renderSprite(this.sprite, center, this.zIndex, new Point(0,2), false);
			
			g.renderSprite(this.sprite, center.add(this.shake), this.zIndex+1, new Point(0,0), false);
			g.renderSprite(this.sprite, center, this.zIndex+2, new Point(0,1), false);
			
			textArea(g, this.text_resist, center.x - (this.text_resist.length*4), 200);
			
			g.color = COLOR_BLACK;
			g.scaleFillRect(center.x-17,159,34,10);
			g.color = [1.0,0.0,0.0,1.0];
			g.scaleFillRect(center.x-16,160,Math.floor(this.lovePower),8);
			
		} else if(this.stage == 2){
			//love
			g.renderSprite(this.sprite, center, this.zIndex, new Point(0,2), false);
			
			g.renderSprite(this.sprite, center, this.zIndex+1, new Point(1,0), false);
			g.renderSprite(this.sprite, center, this.zIndex+2, new Point(1,1), false);
		} else if(this.stage == 3){
			//break up
			g.renderSprite(this.sprite, center, this.zIndex, new Point(0,2), false);
			
			g.renderSprite(this.sprite, center, this.zIndex+1, new Point(2,0), false);
			g.renderSprite(this.sprite, center, this.zIndex+2, new Point(2,1), false);
		} else if(this.stage == 4){
			//Wedding photo
			g.renderSprite(this.sprite, center, this.zIndex, new Point(1,2), false);
		} else if(this.stage == 5){
			g.renderSprite(this.sprite, center, this.zIndex, new Point(0,2), false);
			
			g.renderSprite(this.sprite, center.add(this.kiss1), this.zIndex+1, new Point(0,3), false);
			g.renderSprite(this.sprite, center.add(this.kiss2), this.zIndex+1, new Point(1,3), false);
			
			for(let i=0; i < Wedding.roses.length; i++){
				let p = 1 - Math.clamp01(this.transitionTime * 0.5 - i * 0.2 - 1.5);
				g.renderSprite(this.sprite,center.add(Wedding.roses[i]),this.zIndex+6,new Point(2,2),false,{
					scalex : p,
					scaley : p
				});
			}
			
			textArea(g, this.text_love, center.x - (this.text_love.length*4), 200);
		}
		
	}
}
Wedding.roses = [new Point(140,-16),new Point(-140,32),new Point(-64,-80),new Point(-128,-96),new Point(96,-96)]

class WeddingWaiting extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "cutscene_wedding_guests";
		this.frame = new Point();
		
		this.addModule(mod_talk);
		
		this.on("open", function(){
			
			if(!NPC.get("wedding_dress")){
				game.pause = true;
				DialogManager.set("You know, Rex. Life really isn't fair. I was all set to get married, but we can't afford a wedding dress. Now I'm out here collecting coppers.");
			} else if(NPC.get("wedding_dress") == 1){
				game.pause = true;
				DialogManager.set("I can't believe it, Rex! Is this really for me. Wow, you've made us the happiest couple in the world! See you at the wedding!");
				NPC.set("wedding_dress", 2);
			}
		})
		this.on("close", function(){
			game.pause = false;
			if(NPC.get("wedding_dress") >= 2){
				this.destroy();
			}
		});
		this.on("wakeup", function(){
			if(NPC.get("wedding_dress") >= 2){
				this.destroy();
			}
		});
	}
	update(){
		if(this.open){
			if( !DialogManager.show ){
				this.close();
			}
		}
	}
	render(g,c){
		//delete this when proper sprite is ready
		super.render(g,c.add(new Point(48,4)));
	}
	hudrender(g,c){
		if(this.open){
			DialogManager.render(g);
		}
	}
}

self["Wedding"] = Wedding;
self["WeddingWaiting"] = WeddingWaiting;