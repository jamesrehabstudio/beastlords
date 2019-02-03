var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","}","\v","\b","@"
];
CHAR_ESCAPE = "\u0003";

var text_size = 8;
var text_height = 12;

function cursorArea(g,x,y,w,h,z=-98){
	g.color = [0.0,0.0,0.0,1.0];
	
	g.scaleFillRect(x-1, y-1, 18, 6 );
	g.scaleFillRect(x+w-17, y-1, 18, 6 );
	
	g.scaleFillRect(x-1, y+h-5, 18, 6 );
	g.scaleFillRect(x+w-17, y+h-5, 18, 6 );
	
	g.color = [1.0,1.0,1.0,1.0];
	
	g.scaleFillRect(x, y, 16, 4 );
	g.scaleFillRect(x+w-16, y, 16, 4 );
	
	g.scaleFillRect(x, y+h-4, 16, 4 );
	g.scaleFillRect(x+w-16, y+h-4, 16, 4 );
}

function boxArea(g,x,y,w,h,z=-99){
	g.color = [0.0,0.0,0.0,1.0];
	g.drawRect(x, y, w, h, z );
	g.drawRect(x+8, y+8, w-16, h-16, z+2 );
	
	g.color = [1.0,1.0,1.0,1.0];
	g.drawRect(x+7, y+7, w-14, h-14, z+1 );
	
}
function renderString(g,s,x,y,font="text"){
	let _x = 0;
	
	for(var i=0; i < s.length; i++ ){
		let index = textLookup.indexOf(s[i]);
		if( index >= 0 ){
			g.renderSprite(
				"text",
				new Point(_x * text_size + x, y),
				999,
				new Point(index%16,index/16),
				false
			);
			_x++;
		}
	}
}
function textArea(g,s,x,y,w,h){
	var _x = 0;
	var _y = 0;
	if( w != undefined ) {
		w = Math.floor(w/8);
		var last_space = 0;
		var cursor = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( cursor >= w ) {
				//add line break
				s = s.substr(0,last_space) +"\n"+ s.substr(last_space+1,s.length)
				cursor = i -last_space;
			}
			cursor++;
			if( s[i] == "\n" ) cursor = 0;
		}
	}
	
	for(var i=0; i < s.length; i++ ){
		if(s[i] == CHAR_ESCAPE){
			break;
		} else if(s[i] == "\n") {
			_x = 0; _y++;
		} else {
			var index = textLookup.indexOf(s[i]);
			if( index >= 0 ){
				g.renderSprite(
					"text",
					new Point(_x * text_size + x, _y * text_height + y),
					999,
					new Point(index%16,index/16),
					false
				);
				_x++;
			}
		}
	}
}
function textBox(g,s,x,y,w,h){
	boxArea(g,x,y,w,h);
	textArea(g,s,x+16,y+16,w-32,h-32);
}
function renderDialog(g,s, top = 48){
	
	var width = 224;
	var height = 48;
	var left = game.resolution.x * 0.5 - width * 0.5;
	boxArea(g,left-12,top-12,width+24,height+24);
	textArea(g,s,left,top,width, height);
}

DialogManager = {
	"dialogOpen" : false,
	"width":25,
	"maxlines":4,
	"text" : "",
	"show" : false,
	"filling" : false,
	"progress" : 0.0,
	"speed" : 25.0,
	"line" : 0,
	"choices" : [],
	"cursor" : 0,
	"audio" : "text01",
	"atEnd" : false,
	"parsedtext" : new Array(),
	"set" : function(text, reset = true){
		if(DialogManager.text != text){
			DialogManager.text = text;
			DialogManager.parsedtext = DialogManager.parse(DialogManager.substitute(text));
			DialogManager.atEnd = false;
			DialogManager.choices = false;
			DialogManager.show = true;
			DialogManager.progress = 0.0;
			DialogManager.line = 0;
			DialogManager.cursor = -1;
		}else if( reset ){
			DialogManager.atEnd = false;
			DialogManager.choices = false;
			DialogManager.show = true;
			DialogManager.progress = 0.0;
			DialogManager.line = 0;
			DialogManager.cursor = -1;
		}
	},
	"clear" : function(){
		DialogManager.text = false;
		DialogManager.show = false;
		DialogManager.progress = 0.0;
		DialogManager.line = 0;
	},
	"substitute" : function(s){
		var rep = {
			"%jump%" : "'K'",
			"%fire%" : "'J'",
			"%select%" : "'Q'",
			"%dodge%" : "'Space'",
		};
		
		for(var i in rep){
			s = s.replace(i,rep[i]);
		}
		return s;
	},
	"render" : function(g){
		var charcount = 0;
		var pt = DialogManager.parsedtext;
		var lineno = DialogManager.line;
		var max = DialogManager.maxlines;
		var xoff = Math.floor(game.resolution.x* 0.5 - DialogManager.width*4 );
		var yoff = 24;
		
		DialogManager.filling = true;
		
		boxArea(g,xoff-12,yoff-12,DialogManager.width*8+24,max*12+24);
		
		for(var i=lineno; i < lineno+max && i < pt.length; i++){
			var line = pt[i];
			var y = yoff + (i-lineno) * 12;
			for(var j=0; j < line.length; j++){
				var x = xoff + j * 8;
				var index = textLookup.indexOf(line[j]);
				if(charcount < DialogManager.progress){
					g.renderSprite(
						"text",
						new Point(x,y),
						999,
						new Point(index%16,index/16),
						false
					);
				} else {
					DialogManager.filling = false;
				}
				charcount++;
			}
		}
		
		if(DialogManager.choices && lineno+max >= pt.length && DialogManager.filling){
			//Render choices
			let choiceTop = yoff + (max*12+24);
			DialogManager.cursor = Math.max( DialogManager.cursor, 0);
			
			boxArea(g,xoff-12, choiceTop-12, DialogManager.width*8+24, DialogManager.choices.length*12+24);
			
			for(let c=0; c < DialogManager.choices.length; c++){
				renderString(g, DialogManager.choices[c], 24 + xoff, choiceTop + c * 12);
			}
			
			if( input.state("up") == 1 ) {
				audio.play("cursor");
				DialogManager.cursor = Math.max(DialogManager.cursor-1, 0);
			} else if( input.state("down") == 1 ) {
				audio.play("cursor");
				DialogManager.cursor = Math.min(DialogManager.cursor+1, DialogManager.choices.length-1);
			}
			
			renderString(g, "@", xoff, choiceTop + DialogManager.cursor * 12);
		}
		
		if(input.state("fire") == 1 ){
			if(DialogManager.filling){
				if(lineno+max >= pt.length ){
					//End dialog
					if( DialogManager.choices ) { audio.play("equip"); }
					DialogManager.show = false;
				} else {
					//Next lines
					DialogManager.line += max;
					DialogManager.progress = 0.0;
				}
			} else {
				DialogManager.progress = Number.MAX_SAFE_INTEGER;
			}
		} else {
			var prev = DialogManager.progress;
			DialogManager.progress += game.deltaUnscaled * DialogManager.speed;
			if(!DialogManager.filling && Math.floor(prev) != Math.floor(DialogManager.progress)){
				audio.play(DialogManager.audio);
			}
		}		
	},
	"parse" : function(s){
		var out = new Array();
		var last_start = 0;
		var last_space = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( i - last_start >= DialogManager.width ) {
				//Slice here
				out.push(s.slice(last_start,last_space));
				i = last_start = last_space + 1;
			}
		}
		out.push(s.slice(last_start));
		return out;
	}
}