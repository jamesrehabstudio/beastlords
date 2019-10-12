from jsmin import jsmin
import glob	
import time
import datetime
import os

js_saveto = "platformer.js"
sh_saveto = "shaders.js"
js_previous = "prev"
sh_previous = "prev"
minify = False

watching = [
	"platformer/*.js",
	"platformer/**/*.js",
	"platformer/**/*.shader",
	"platformer/**/*.janim",
	"platformer/**/*.jscene",
]

def convertShader(file):
	f = open( file, 'r' )
	out = f.read()
	out = out.replace('\n', '\\n').replace('\r', '\\r').replace('"', '\\"')
	return out
	
def concat():
	global js_saveto, sh_saveto, js_previous, sh_previous
	js_out = ""
	sh_out = ""
	complete = []
	
	js_out += "self.spriteWrap = {};"
	sh_out += "window.shaders = {};\n\n"
	
	for watch in watching:
		filepath = glob.glob( watch )
		for file in filepath:
			if not file in complete:
				ext = os.path.splitext(file)[1]
				if ext == ".shader": #is a shader
					name = os.path.splitext(os.path.basename(file))[0]
					sh_out += "\n\n /* " + file + "*/ \n\n"
					sh_out += "window.shaders[\""+name+"\"] = \""+convertShader(file)+"\";\n\n"
				elif ext == ".janim":
					name = os.path.splitext(os.path.basename(file))[0]
					f = open( file, 'r' )
					js_out += "\n\n /* " + file + "*/ \n\n"
					js_out += "self.spriteWrap[\""+name+"\"] = new SpriteWrapper("+f.read()+");\n\n"
				elif ext == ".jscene":
					name = os.path.splitext(os.path.basename(file))[0]
					f = open( file, 'r' )
					js_out += "\n\n /* " + file + "*/ \n\n"
					js_out += "self.cutscenes[\""+name+"\"] = new CutscenePlayer("+f.read()+");\n\n"
				else:
					complete.append( file )
					f = open( file, 'r' )
					js_out += "\n\n /* " + file + "*/ \n\n"
					js_out += f.read()
	
	#verify difference
	if js_previous != js_out:
		#only save if it has changed
		f = open( js_saveto, 'w')
		
		if minify:
			f.write(jsmin(js_out))
		else:
			f.write( js_out )
		f.close()
		
		date = datetime.datetime.now().strftime("%Y-%m-%d, %H:%M:%S")
		print( "("+ date + ") update to " + js_saveto )
		
	if sh_previous != sh_out:
		#only save if it has changed
		f = open( sh_saveto, 'w')
		f.write( sh_out )
		f.close()
		
		date = datetime.datetime.now().strftime("%Y-%m-%d, %H:%M:%S")
		print( "("+ date + ") update to " + sh_saveto)
		
	js_previous = js_out
	sh_previous = sh_out
	
	
def loop():
	while True:
		concat()
		time.sleep(0.2)
	
loop()