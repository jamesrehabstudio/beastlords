import glob	
import time
import datetime
import os

saveto = "platformer.js"
previous = "prev"

watching = [
	"platformer/*.js",
	"platformer/**/*.js",
	"platformer/**/*.shader"
]

def convertShader(file):
	f = open( file, 'r' )
	out = f.read()
	out = out.replace('\n', '\\n').replace('\r', '\\r').replace('"', '\\"')
	return out
	
def concat():
	global saveto, previous
	out = ""
	complete = []
	
	out += "/* Shader list */\n"
	out += "window.shaders = {};\n\n"
	
	for watch in watching:
		filepath = glob.glob( watch )
		for file in filepath:
			if not file in complete:
				ext = os.path.splitext(file)[1]
				if ext == ".shader": #is a shader
					name = os.path.splitext(os.path.basename(file))[0]
					out += "\n\n /* " + file + "*/ \n\n"
					out += "window.shaders[\""+name+"\"] = \""+convertShader(file)+"\";\n\n"
				else:
					complete.append( file )
					f = open( file, 'r' )
					out += "\n\n /* " + file + "*/ \n\n"
					out += f.read()
	
	#verify difference
	if previous != out:
		#only save if it has changed
		f = open( saveto, 'w')
		f.write( out )
		f.close()
		
		date = datetime.datetime.now().strftime("%Y-%m-%d, %H:%M:%S")
		print  "("+ date + ") update to " + saveto
	previous = out
	
	
def loop():
	while True:
		concat()
		time.sleep(0.2)
	
loop()