class ItemGet extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.width = 256;
		this.height = 96;
		this.speed = 12;
		
		this.title = "Double jump";
		this.text = "Press JUMP while in the air to perform a second jump. This can help you reach high locations.";
		
		this._delay = 1.25;
		this._progress = 0;
		
		game.pause = true;
		
	}
	idle(){}
	update(){
		if(!game.pause || PauseMenu.open){
			this.destroy();
		}  else if(this._delay > 0 ) {
			this._delay -= game.deltaUnscaled;
		} else {
			this._progress = Math.min(this._progress + game.deltaUnscaled * this.speed, this.text.length);
			
			if(input.state("fire") == 1 || input.state("jump") == 1 ){
				if(this._progress < this.text.length){
					this._progress = this.text.length;
				} else {
					game.pause = false;
				}
			}
		}
	}
	hudrender(g,c){
		if(this._delay <= 0){
			let _x = (game.resolution.x - this.width) * 0.5;
			
			let visibleText = this.text.substr(0,this._progress) + CHAR_ESCAPE + this.text.substr(this._progress);
			visibleText = this.title + "\n" + visibleText;
			
			textBox(
				g,
				visibleText, 
				_x, 32, this.width, this.height
			);
		}
	}
}
ItemGet.create = function(name){
	var ig = new ItemGet();
	
	if(name == "doublejump") {
		ig.title = i18n("item_doublejump");
		ig.text = i18n("item_doublejump_desc");
	}
	
	ig.title = DialogManger.substitute(ig.title);
	ig.text = DialogManger.substitute(ig.text);
	game.addObject(ig);
}
self["ItemGet"] = ItemGet;