Healer.prototype = new GameObject();
Healer.prototype.constructor = GameObject;
function Healer(x,y,n,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.characters;
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	
	this.frame = 0;
	this.frame_row = 1;
	
	this.phase = 0
	
	this.type = 0;
	this.price = 0;
	this.cursor = 0;
	
	options = options || {};
	if("price" in options ) this.price = options.price-0;
	if("type" in options ) this.type = options.type-0;
	
	this.on("struck",function(obj){
		if( this.phase==0 && obj instanceof Player ){
			game.pause = true;
			obj.states.attack = 0;
			this.cursor = 0;
			this.phase = 1;
			audio.playLock("pause",0.3);
		}
	});
	this.message = [	
		"Let me bless you, weary traveller, so I may restore your spirit.",
		"I can ease your pain. It'll cost you $"+this.price+". Interested?"
	];
	this.addModule(mod_rigidbody);
	this.friction = 0.9;
	this.mass = 0;
	this.pushable = false;
}
Healer.prototype.update = function(g,c){
	var dir = this.position.subtract(_player.position);
	this.flip = dir.x > 0;
	
	if( this.phase == 2 ) {
		if( this.price > 0 ) {
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		}
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 || this.price <= 0 ) {
				if( this.price <= _player.money ) {
					if( this.type == 0 ){ 
						_player.manaHeal = Number.MAX_VALUE;
						audio.play("item1");
					} else if ( this.type == 1 ){
						if( this.cursor == 0 ) _player.heal = Number.MAX_VALUE;
					}
					_player.money -= this.price;
					this.phase = 0;
					game.pause = false;
				} else {
					//Cannot afford it
					audio.play("negative");
				}
			} else {
				//Player selected no
				this.phase = 0;
				game.pause = false;
			}
		}
		if( input.state("jump") == 1 ){
			this.phase = 0;
			game.pause = false;
		}
	}
	if( this.phase > 0 ) this.phase = 2 //This is to prevent same frame button press
	this.frame = this.phase > 0 ? 1 : 0;
}
Healer.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.phase > 0 ) {
		boxArea(g,16,48,224,64);
		textArea(g,this.message[this.type],32,64,192,64);
		
		if( this.price > 0 ) {
			boxArea(g,16,120,64,56);
			textArea(g," Yes",32,136);
			textArea(g," No",32,152);
			
			sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
		}
	}
}