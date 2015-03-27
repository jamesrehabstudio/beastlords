Healer.prototype = new GameObject();
Healer.prototype.constructor = GameObject;
function Healer(x,y,n,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.retailers;
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	
	this.frame = 0;
	this.frame_row = 1;
	
	this.type = 0;
	this.price = 0;
	this.cursor = 0;
	
	options = options || {};
	if("price" in options ) this.price = options.price-0;
	if("type" in options ) this.type = options.type-0;
	this.currency = this.type == 2 ? "waystones" : "money";
	
	this.on("open",function(obj){
		game.pause = true;
		this.cursor = 0;
		audio.playLock("pause",0.3);
	});
	this.message = [	
		"Let me bless you, weary traveller, so I may restore your spirit.",
		"You can stay here and rest.",
		"I can improve that weapon. Add +\v1 for #%PRICE%. Interested?"
	];
	this.addModule(mod_rigidbody);
	this.addModule(mod_talk);
	this.friction = 0.9;
	this.mass = 0;
	this.pushable = false;
}
Healer.prototype.update = function(g,c){
	var dir = this.position.subtract(_player.position);
	this.flip = dir.x > 0;
	
	if( this.type == 2 && "level" in _player.equip_sword)
		this.price = Math.floor( 2 * Math.pow(_player.equip_sword.level, 1.5) );
	
	
	if( this.open > 0 ) {
		if( this.price > 0 ) {
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		}
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 || this.price <= 0 ) {
				if( this.price <= _player[this.currency] ) {
					if( this.type == 0 ){ 
						_player.manaHeal = Number.MAX_VALUE;
						audio.play("item1");
					} else if ( this.type == 1 ){
						if( this.cursor == 0 ) _player.heal = Number.MAX_VALUE;
					} else if ( this.type == 2 ){
						_player.equip_sword.bonus_att++;
						_player.equip_sword.level++;
						_player.equip_sword.filter = "gold";
						_player.levelUp(-1);
						audio.play("item1");
					}
					_player[this.currency] -= this.price;
					this.open = 0;
					game.pause = false;
				} else {
					//Cannot afford it
					audio.play("negative");
				}
			} else {
				//Player selected no
				this.open = 0;
				game.pause = false;
			}
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.open = 0;
			game.pause = false;
		}
	}
	this.frame = this.open > 0 ? 1 : 0;
}
Healer.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		boxArea(g,16,48,224,64);
		textArea(g,this.message[this.type].replace("%PRICE%",this.price),32,64,192,64);
		
		if( this.price > 0 ) {
			boxArea(g,16,120,64,56);
			textArea(g," Yes",32,136);
			textArea(g," No",32,152);
			
			sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
		}
	}
}