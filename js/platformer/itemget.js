class ItemGet extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.width = 256;
		this.height = 96;
		this.speed = 12;
		
		this.title = "Double jump";
		this.text = "Press JUMP while in the air to perform a second jump. This can help you reach high locations.";
		
		this._delay = 0.0;
		this._progress = 0;
		
		this.sprite = "items";
		this.frame = new Point(0,0);
		this._showitem = true;
		
		game.pause = true;
		
		
	}
	target(){ return _player; }
	idle(){}
	update(){
		if(!game.pause || PauseMenu.open){
			this.destroy();
		}  else if(this._delay > 0 ) {
			this._delay -= game.deltaUnscaled;
		} else {
			this._progress = Math.min(this._progress + game.deltaUnscaled * this.speed, this.text.length);
			
			if(this._showitem){
				this.target().frame.x = this.target().frame.y = 7;
			}
			
			if(input.state("fire") == 1 || input.state("jump") == 1 ){
				if(this._progress < this.text.length){
					this._progress = this.text.length;
				} else {
					game.pause = false;
				}
			}
		}
	}
	render(g,c){
		if(this._showitem){
			g.renderSprite(this.sprite,this.target().position.add(new Point(this.target().forward()*12,-40)).subtract(c),this.zIndex,this.frame, false);
		}
	}
	hudrender(g,c){
		if(this._delay <= 0){
			let _x = (game.resolution.x - this.width) * 0.5;
			
			let visibleText = this.text.substr(0,this._progress) + CHAR_ESCAPE + this.text.substr(this._progress);
			visibleText = this.title + "\n" + visibleText;
			
			let displayHeight = this.text ? this.height : 40;
			
			textBox(
				g,
				visibleText, 
				_x, 32, this.width, displayHeight
			);
		}
	}
}
ItemGet.descriptions = {
	"downstab" : {"title": "Down stab", "description" : "While in the air, press down and attack to perform a down stab", "frame":new Point(10,5),"delay":1.25},
	"doublejump" : {"title": i18n("item_doublejump"), "description" : i18n("item_doublejump_desc"), "frame":new Point(0,5),"delay":1.25},
	"long_sword" : {"title": i18n("item_doublejump"), "description" : "", "frame":new Point(0,5),"delay":0},
	"burningblade" : {"title": i18n("item_doublejump"), "description" : "", "frame":new Point(0,5),"delay":0},
	"baseball_bat" : {"title": "Baseball bat", "description" : "A bat made from petrified wood. Hold attack to put more power behind attacks.", "frame":new Point(1,2),"delay":0},
	"whip" : {"title": "Leather whip", "description" : "A tough leather whip designed to punish foes and hold a lot of tension.", "frame":new Point(6,2),"delay":0},
	"twin_blades" : {"title": "Twin blads", "description" : "Curved blades with a secret technique. Try using a quarter-circle attack.", "frame":new Point(8,2),"delay":0},
	"autodrill" : {"title": "Auto drill", "description" : "A fuel powered drill. Let it rest before the fuel runs out.", "frame":new Point(7,2),"delay":0},
	
}
ItemGet.create = function(name){
	if(name in ItemGet.descriptions){
		var desc = ItemGet.descriptions[name];
		var ig = new ItemGet();
		//ig.title = i18n("item_doublejump");
		//ig.text = i18n("item_doublejump_desc");
		
		ig.title = desc.title;
		ig.text = desc.description;
		ig.frame = desc.frame;
		ig._delay = desc.delay;
	}
	
	ig.title = DialogManager.substitute(ig.title);
	ig.text = DialogManager.substitute(ig.text);
	game.addObject(ig);
}
self["ItemGet"] = ItemGet;