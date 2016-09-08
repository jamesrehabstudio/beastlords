Chancellor.prototype = new GameObject();
Chancellor.prototype.constructor = GameObject;
function Chancellor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "characters2";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("chancellor_intro");
	this.text_progress = 0;
	
	this.money = 0;
	this.moneyMax = 0;
	this.rate = 1;
	this.pay_timer = 0;
	this.rate_timer = 0;
	
	this.on("open", function(){
		this.money = 0;
		this.moneyMax = 0;
		
		DialogManger.set(this.text);
		
		game.pause = true;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}

Chancellor.prototype.update = function(){
	if( this.open ) {
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
				this.money = 0;
				this.close();
				audio.play("unpause");
			} else if ( input.state("up") > 0 ) {
				if( this.pay_timer <= 0 || input.state("up") == 1) {
					this.money = Math.min( this.money + this.rate, _player.money);
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
	}
	
	//Animation
	if( this.open ) {
		if( this.money > 99 ) {
			//Jump excitedly
			this.frame.x = (this.frame.x + game.deltaUnscaled * 0.3) % 3;
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
		this.frame.x = (this.frame.x + this.delta * 0.125) % 4;
		this.frame.y = 1;
	}
}

Chancellor.prototype.hudrender = function(g,c){
	if( this.open ) {
		if( Chancellor.introduction ) {
			DialogManger.render(g);
		} else {
			var left = game.resolution.x / 2 - 112;
			renderDialog(g, i18n("chancellor_howmuch"));
			textBox(g, "$"+this.money, left, 120, 128, 40);
		}
	}
}

Chancellor.introduction = true;