class Chancellor extends GameObject {
	get moneyCap() { return 500 - NPC.get("pubmoney", 0); }
	constructor(x, y, d, ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "characters2";
		
		this.frame.x = 0;
		this.frame.y = 0;
		
		this.width = this.height = 48;
		
		this.addModule( mod_talk );
		this.text_progress = 0;
		
		this.teleportPosition1 = new Point(
			ops.getFloat("tp1x", x),
			ops.getFloat("tp1y", y)
		);
		this.teleportPosition2 = new Point(
			ops.getFloat("tp2x", x),
			ops.getFloat("tp2y", y)
		);
		this.teleportPosition3 = new Point(
			ops.getFloat("tp3x", x),
			ops.getFloat("tp3y", y)
		);
		
		this.level2cost = ops.getInt("level2cost", 100);
		this.level3cost = ops.getInt("level3cost", 500);
		
		
		if( NPC.get("publevel", 0) == 0 ){
			//Build pub?
			if(NPC.get("bosseskilled") >= 3){
				if( NPC.get("pubmoney") > this.level3cost ){
					Chancellor.publevel = 3;
					NPC.set("publevel", 3);
				} else if( NPC.get("pubmoney") > this.level2cost ){
					NPC.set("publevel", 2);
				} else {
					NPC.set("publevel", 1);
				}
			}
		}
		
		this.money = 0;
		this.moneyMax = 0;
		
		this.rate = 1;
		this.pay_timer = 0;
		this.rate_timer = 0;
		this.idleMargin = 128;
		
		this.on("open", function(){
			if(NPC.get("publevel", 0) == 0){
				//Open window for donations
				this.money = 0;
				this.moneyMax = 0;
				
				if(NPC.get("pubmoney") >= this.level3cost ){
					DialogManger.set( i18n("chancellor_enough") );
				} else {
					DialogManger.set( i18n("chancellor_intro") );
				}
				
				game.pause = true;
				audio.play("pause");
			} else {
				//Teleport player
				if(Teleporter.cooldown < game.time){
					switch( NPC.get("publevel") ){
						case 1 : _player.position = this.teleportPosition1.scale(1); break;
						case 2 : _player.position = this.teleportPosition2.scale(1); break;
						case 3 : _player.position = this.teleportPosition3.scale(1); break;
					}
					Teleporter.cooldown = game.time;
				}
			}
		});
		this.on("close", function(){
			game.pause = false;
		});
	}
	update(){
		if( this.open ) {
			
			if( NPC.get("publevel", 0) == 0 ){
				//Move player into position
				this.talkMovePlayer();
				
				if( Chancellor.introduction ) {
					if(!DialogManger.show){
						Chancellor.introduction = false;
						this.close();
					}
				} else {
					if( input.state("jump") == 1 || PauseMenu.open ) {
						this.close();
					} else if( input.state("fire") == 1 ) {
						//_world.town.money += this.money;
						_player.money -= this.money;
						NPC.set("pubmoney", NPC.get("pubmoney", 0) + this.money );
						this.money = 0;
						this.close();
						audio.play("unpause");
					} else if ( input.state("up") > 0 ) {
						if( this.pay_timer <= 0 || input.state("up") == 1) {
							this.money = Math.min( this.money + this.rate, Math.min( _player.money, this.moneyCap) );
							this.pay_timer = Math.max(Game.DELTASECOND * 0.125, this.pay_timer);
							audio.play("coin");
						}
						if( this.rate_timer <= 0 ) {
							this.rate *= 2;
							this.rate_timer = Game.DELTASECOND;
						}
						this.pay_timer -= game.deltaUnscaled;
						this.rate_timer -= game.deltaUnscaled;
					} else if ( input.state("down") > 0 ) {
						if( this.pay_timer <= 0 || input.state("down") == 1 ) {
							this.money = Math.max( this.money - this.rate, 0);
							this.pay_timer = Math.max(Game.DELTASECOND * 0.125, this.pay_timer);
							audio.play("coin");
						}
						if( this.rate_timer <= 0 ) {
							this.rate *= 2;
							this.rate_timer = Game.DELTASECOND;
						}
						this.pay_timer -= game.deltaUnscaled;
						this.rate_timer -= game.deltaUnscaled;
					} else {
						this.pay_timer = Game.DELTASECOND * 0.5;
						this.rate_timer = Game.DELTASECOND;
						this.rate = 1;
					}
				}
				this.moneyMax = Math.max(this.moneyMax, this.money);
				
			} else {
				this.close();
			}
		}
		
		//Animation
		if( NPC.get("publevel", 0) == 0 ){
			if( this.open ) {
				if( this.money > 99 ) {
					//Jump excitedly
					this.frame.x = (this.frame.x + game.deltaUnscaled * 9.0) % 3;
					this.frame.y = 2;
				} else if( this.moneyMax > 99 ) {
					//Look disappointed
					this.frame.x = 4;
					this.frame.y = 2;
				} else {
					if( this.money > 10 ) {
						this.frame.x = 4;
						this.frame.y = 1;
					} else {
						this.frame.x = 0;
						this.frame.y = 1;				
					}
				}
			} else {
				this.frame.x = (this.frame.x + this.delta * 3.75) % 4;
				this.frame.y = 1;
			}
		}
	}
	render(g,c){
		if( NPC.get("publevel", 0) == 0 ){
			GameObject.prototype.render.apply(this,[g,c]);
		}
		
		if( NPC.get("publevel", 0) < 3){
			g.renderSprite("pubs",this.position.subtract(c), this.zIndex-1, new Point(0, NPC.get("publevel", 0) ), false );
		} else {
			g.renderSprite("pubs",this.position.subtract(c), this.zIndex-1, new Point(0, 4), false );
			g.renderSprite("pubs",this.position.add(new Point(0,-96)).subtract(c), this.zIndex-1, new Point(0, 3), false );
		}
	}
	hudrender(g,c){
		if( this.open && NPC.get("publevel", 0) == 0) {
			if( Chancellor.introduction || NPC.get("pubmoney") >= this.level3cost ) {
				DialogManger.render(g);
			} else {
				var left = game.resolution.x / 2 - 112;
				renderDialog(g, i18n("chancellor_howmuch") + "\n\n$" + this.money);
				//textBox(g, "$"+this.money, left, 120, 128, 40);
			}
		}
	}
}
Chancellor.introduction = true;

self["Chancellor"] = Chancellor;