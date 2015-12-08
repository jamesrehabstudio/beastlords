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
				sprites.text.render(g,new Point(
					_x*window.text_size+x,
					_y*window.text_height+y
				),index);
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
	var height = 64;
	var left = game.resolution.x * 0.5 - width * 0.5;
	boxArea(g,left,top,width,height);
	textArea(g,s,left+16,top+16,width-32, height-32);
}