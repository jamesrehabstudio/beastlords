import glob	
import time
import datetime

saveto = "platformer.js"
previous = "prev"

watching = [
	"platformer/*.js",
	"platformer/**/*.js"
]

def concat():
	global saveto, previous
	out = ""
	complete = []
	for watch in watching:
		filepath = glob.glob( watch )
		for file in filepath:
			if not file in complete:
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