NPC.prototype = new GameObject();
NPC.prototype.constructor = GameObject;
function NPC(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.start_x = x;
	this.sprite = sprites.characters;
	
	this.addModule(mod_talk);
	
	this.showmessage = false;
	this.lockplayer = true;
	
	this.script = new Array();
	this.scriptPos = 0;
	this.scriptReg = 0;
	this.scriptRun = false;
	this.scriptWait = 0.0;
	
	o = o || {};
	if("script" in o){
		this.getScript(o["script"]);
	}
	if("lockplayer" in o){
		this.lockplayer = o["lockplayer"] * 1;
	}
	
	this.on("open", function(){
		this.scriptRun = true;
		if(this.lockplayer){window._player.pause = true;}
	});
	
	this.on("close", function(){
		if(this.lockplayer){window._player.pause = false;}
	});
	
}

NPC.prototype.update = function(){
	if(this.scriptRun){
		while(this.runScript()){}
	}
}
NPC.prototype.hudrender = function(g,c){
	if(this.showmessage){
		DialogManger.render(g);
	}
}
NPC.prototype.runScript = function(filename){
	this.message = false;
	
	if(this.scriptPos >= this.script.length){
		//At the end of script, stop running it
		this.scriptRun = false;
		this.scriptPos = 0;
		this.close();
		return false;
	}
	
	var line = this.script[this.scriptPos];
	var command = line[0];
	
	if(command == "end"){
		this.scriptRun = false;
		this.scriptPos = 0;
		this.close();
		return false;
	} else if(command == "calc"){
		this.scriptReg = NPC.resolveCalculation(line.slice(1));
		this.scriptPos++;
		return true;
	}else if(command == "ifnotgoto"){
		if(this.scriptReg){
			this.scriptPos++;
		}else{
			this.scriptPos = NPC.resolveVariable(line[1]);
		}
		return true;
	}else if(command == "set"){
		NPC.variables[line[1]] = NPC.resolveCalculation(line[2]);
		this.scriptPos++;
		return true;
	}else if(command == "wait"){
		if(this.scriptWait > 0){
			this.scriptWait -= this.delta;
			if(this.scriptWait <= 0){
				this.scriptPos++;
			}
		}else{
			this.scriptWait = NPC.resolveCalculation(line[1]) * Game.DELTASECOND;
		}
		return false;
	}else if(command == "additem"){
		if(window._player instanceof Player){
			var name = NPC.resolveCalculation(line[1]);
			var item = new Item(0,0,0,{"name":name});
			item.trigger("collideObject",_player);
		}
		this.scriptPos++;
		return true;	
	} else if(command == "trigger"){
		Trigger.activate(i18n(NPC.resolveCalculation(line[1])));
		this.scriptPos++;
		return true;
	}else if(command == "say"){
		DialogManger.set(i18n(NPC.resolveVariable(line[1])));
		this.showmessage = DialogManger.show;
		if(!this.showmessage){
			DialogManger.clear();
			this.scriptPos++;
		}
		return false;
	}else if(command == "move"){
		var x = NPC.resolveCalculation(line[1]);
		var y = NPC.resolveCalculation(line[2]);
		var speed = NPC.resolveCalculation(line[3]);
		this.scriptPos++;
		return false;
	}else if(command == "quest"){
		Quests.set(line[1],NPC.resolveCalculation(line[2]));
		this.scriptPos++;
		return true;
	}
	
	//Command not found, go to next command
	this.scriptPos++;
	
	return false;
}

NPC.resolveCalculation = function(calc){
	var operands = new Array();
	if(calc instanceof Array){
		for(var i=0; i < calc.length; i++){
			if(NPC.operators.indexOf(calc[i]) >= 0 ){
				var b = NPC.resolveVariable(operands.pop());
				var a = NPC.resolveVariable(operands.pop());
				if(calc[i] == "/"){
					operands.push(a/b);
				}else if (calc[i] == "*"){
					operands.push(a*b);
				}else if (calc[i] == "+"){
					operands.push(a+b);
				}else if (calc[i] == "-"){
					operands.push(a-b);
				}else if (calc[i] == "=="){
					operands.push(a==b);
				}else if (calc[i] == ">"){
					operands.push(a>b);
				}else if (calc[i] == "<"){
					operands.push(a<b);
				}
			}else{
				operands.push(calc[i]);
			}
		}
	} else {
		operands.push(calc);
	}
	return NPC.resolveVariable(operands.pop());
}
NPC.resolveVariable = function(varname){
	if(typeof varname == "number"){
		//number
		return varname;
	} else if(typeof varname =="boolean"){
		//boolean
		return varname;
	}else if(varname.trim().match(/^-?\d*\.?\d*$/)){
		//number as string
		return varname * 1;
	} else if(varname[0]=='"' && varname[varname.length-1]=='"'){
		//string
		return varname.slice(1,varname.length-1);
	} else if(varname.indexOf(".") >= 0){
		//special
		var prefix = varname.slice(0,varname.indexOf("."));
		var suffix = varname.slice(varname.indexOf(".")+1);
		if(prefix == "quest"){
			return Quests[suffix];
		}
	}
	else{
		//variable
		if(!(varname in NPC.variables)){
			NPC.variables[varname] = 0;
		}
		return NPC.variables[varname];
	}
}
NPC.prototype.getScript = function(filename){
	ajax("scripts/"+filename+".script",function(data){
		this.script = NPC.compileScript(data);
	},this);
}
NPC.compileScript = function(data){
	var lines = data.split("\n");
	var out = new Array();
	NPC.compileBlock(lines, out, 0, 0);
	return out;
}
NPC.compileBlock = function(lines, out, tabs, line){
	
	for(line; line < lines.length; line++){
		try{
			var tokens = NPC.unpackTokens(lines[line]);
			if(tokens instanceof Array){
				var tabcount = 0;
				while(lines[line][tabcount]=="\t"){
					tabcount++;
				}
				
				if(tabcount < tabs){
					//End of block
					return line;
				}else{
					tokens[0] = tokens[0].trim();
					
					if(tokens[0] == "if"){
						out.push(NPC.compileCalc(tokens.slice(1)));
						var current = out.length;
						out.push(["ifnotgoto", -1]);
						var end = NPC.compileBlock(lines, out, tabs+1, line+1);
						out[current][1] = out.length;
						line = end-1;
					}else{
						out.push(tokens);
					}
				}
			}
		} catch (err){
			console.error("Compile error at line "+line+": "+err);
			console.log(lines[line]);
		}
	}
	return line;
}
NPC.compileCalc = function(tokens){
	var o = ["calc"];
	var operators = new Array();
	
	for(var i=0; i < tokens.length; i++){
		if(NPC.operators.indexOf(tokens[i]) >= 0 ){
			while(operators.length > 0 && NPC.operators.indexOf(tokens[i]) > NPC.operators.indexOf(operators.peek())){
				o.push(operators.pop());
			}
			operators.push(tokens[i]);
		} else{
			o.push(tokens[i]);
		}
	}
	while(operators.length>0){
		o.push(operators.pop());
	}
	return o;
}
NPC.unpackTokens = function(line){
	var out = line.match(/\s*(\"[^\"]+\")|([A-Za-z0-9.+><=-]+)/g);
	for(var i = 0; i < out.length; i++){
		out[i] = out[i].trim();
		if(out[i].match(/^-?\d*\.?\d*$/)){
			out[i] = out[i] * 1;
		}
	}
	return out;
}
NPC.operators = ["/","*","+","-","==",">","<"];
NPC.variables = {};