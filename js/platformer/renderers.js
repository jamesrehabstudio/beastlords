var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","}","\v","\b","@"
];
var text_size = 8;
var text_height = 12;

function cursorArea(g,x,y,w,h){
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

function boxArea(g,x,y,w,h){
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(x, y, w, h );
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(x+7, y+7, w-14, h-14 );
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(x+8, y+8, w-16, h-16 );
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
		if(s[i] == "\n") {
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
function renderDialog(g,s, top){
	if( top == undefined ) top = 48;
	
	var width = 224;
	var height = 76;
	var left = game.resolution.x * 0.5 - width * 0.5;
	boxArea(g,left,top,width,height);
	textArea(g,s,left+16,top+16,width-32, height-32);
}

DialogManger = {
	"dialogOpen" : false,
	"width":25,
	"maxlines":4,
	"text" : "",
	"show" : false,
	"progress" : 0.0,
	"speed" : 0.85,
	"line" : 0,
	"audio" : "text01",
	"parsedtext" : new Array(),
	"set" : function(text){
		if(DialogManger.text != text){
			DialogManger.text = text;
			DialogManger.parsedtext = DialogManger.parse(text);
			DialogManger.show = true;
			DialogManger.progress = 0.0;
			DialogManger.line = 0;
		}else{
			
		}
	},
	"clear" : function(){
		DialogManger.text = false;
		DialogManger.show = false;
		DialogManger.progress = 0.0;
		DialogManger.line = 0;
	},
	"render" : function(g){
		var charcount = 0;
		var pt = DialogManger.parsedtext;
		var filled = true;
		var lineno = DialogManger.line;
		var max = DialogManger.maxlines;
		var xoff = Math.floor(game.resolution.x* 0.5 - DialogManger.width*4 );
		var yoff = 48;
		
		boxArea(g,xoff-12,yoff-12,DialogManger.width*8+24,max*12+24);
		
		for(var i=lineno; i < lineno+max && i < pt.length; i++){
			var line = pt[i];
			var y = yoff + (i-lineno) * 12;
			for(var j=0; j < line.length; j++){
				var x = xoff + j * 8;
				var index = textLookup.indexOf(line[j]);
				if(charcount < DialogManger.progress){
					g.renderSprite(
						"text",
						new Point(x,y),
						999,
						new Point(index%16,index/16),
						false
					);
				} else {
					filled = false;
				}
				charcount++;
			}
		}
		
		if(input.state("fire") == 1 ){
			if(filled){
				if(lineno+max >= pt.length ){
					//End dialog
					DialogManger.show = false;
				} else {
					//Next lines
					DialogManger.line += max;
					DialogManger.progress = 0.0;
				}
			} else {
				DialogManger.progress = Number.MAX_SAFE_INTEGER;
			}
		} else {
			var prev = DialogManger.progress;
			DialogManger.progress += game.deltaUnscaled * DialogManger.speed;
			if(!filled && Math.floor(prev) != Math.floor(DialogManger.progress)){
				audio.play(DialogManger.audio);
			}
		}		
	},
	"parse" : function(s){
		var out = new Array();
		var last_start = 0;
		var last_space = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( i - last_start >= DialogManger.width ) {
				//Slice here
				out.push(s.slice(last_start,last_space));
				i = last_start = last_space + 1;
			}
		}
		out.push(s.slice(last_start));
		return out;
	}
}