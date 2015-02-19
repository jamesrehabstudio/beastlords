Prisoner.prototype = new GameObject();
Prisoner.prototype.constructor = GameObject;
function Prisoner(x,y){
	this.constructor();
	this.sprite = sprites.prisoner;
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 48;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.phase = 0;
	this.alert = 0;
	
	this.progress = 0.0;
	
	this.message_help = "Help, I'm trapped in here!\nI can teach you something \nif you free me.";
	this.message_thanks = "Thank you for your help,\nbrave traveller. Now \nreceive your reward.";
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.phase == 0){
			this.phase = 1;
		}
	});
	this.on("wakeup", function(){
		if( this.alert == 0 ) this.alert = 1;
	});
	this.on("sleep", function(){
		if( this.alert > 0 ) this.alert = 2;
	});
	
	this.addModule(mod_rigidbody);
	this.friction = 0.9;
	this.mass = 0;
}
Prisoner.prototype.update = function(){
	this.flip = this.position.x - _player.position.x > 0;
	
	if( this.phase == 1 ) { 
		this.interactive = false;
		game.pause = true;
		if( input.state("fire") == 1 ) this.phase = 2;
	}
	
	if( this.phase >= 2 && this.phase < 4 ) {
		game.pause = true;
		
		if( this.phase == 2 && this.progress > 16 ) {
			this.phase = 3;
			audio.play("pause");
			var pauseMenu = game.getObject(PauseMenu);
			pauseMenu.page = 3;
			pauseMenu.open = true;
		}
		
		if( this.phase == 3 && this.progress > 50 ) {
			this.giveSpell();
			this.phase = 4;
		}
		
		this.progress += game.deltaUnscaled;
	}
	
	if( this.phase <= 0 ){
		this.frame = ( this.frame + this.delta * 0.2 ) % 3;
	} else {
		this.frame = 3;
	}
}
Prisoner.prototype.giveSpell = function(){
	var spell_list = {
		"bolt" : "Bolt",
		"magic_sword" : "Magic Sword",
		"magic_armour" : "Magic Armour",
		"feather_foot" : "Feather Foot",
		"thorns" : "Thorns",
		"heal" : "Heal"
	};
	var names = Object.keys( spell_list );
	names.sort(function(a,b){ return Math.random() -0.5; });
	for(var i=0; i < names.length; i++ ) {
		if( !( names[i] in _player.spellsUnlocked ) ){
			_player.spellsUnlocked[ names[i] ] = spell_list[names[i]];
			audio.play("item1");
			break;
		}
	}
}
Prisoner.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.phase == 1 ){
		textArea(g, this.message_thanks, 32,32);
	}
	if( this.alert == 1 && this.phase == 0 ){
		textArea(g, this.message_help, 32,32);
	}
}