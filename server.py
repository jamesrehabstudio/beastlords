import http.server
import socketserver
import sys
import json

from datetime import datetime

PORT = 8001
if len(sys.argv) > 1:
	PORT = int(sys.argv[1])
	
class ServerHandler(http.server.SimpleHTTPRequestHandler):
	def do_POST(self):
		#try:
		length = int(self.headers.getheader('content-length'))
		data = json.loads(self.rfile.read(length))
		id = data["id"]
		mode = data["mode"]
		data["date"] = datetime.utcnow().strftime("%d %B %Y %H:%M:%S")
		
		del data["id"]
		del data["mode"]
		
		txt = open("feedback.txt","r")
		jtxt = json.loads(txt.read())
		txt.close()
		
		if not id in jtxt:
			jtxt[id] = {"mode":mode, "events":[]}
		jtxt[id]["events"].append(data)
		
		txt = open("feedback.txt","w")
		txt.write(json.dumps(jtxt))
		
		txt.close()
		#except:
		#	print "Unexpected error:", sys.exc_info()[0]

		http.server.SimpleHTTPRequestHandler.do_GET(self)

Handler = ServerHandler
Handler.extensions_map = {
	'.manifest': 'text/cache-manifest',
	'.html': 'text/html',
	'.png': 'image/png',
	'.jpg': 'image/jpg',
	'.svg':	'image/svg+xml',
	'.css':	'text/css',
	'.js':	'application/x-javascript',
	'': 'application/octet-stream', # Default
}

httpd = socketserver.TCPServer(("", PORT), Handler)

print ("serving at port %s" % PORT)
httpd.serve_forever()

"""
Event structure
{
	_ID : {
		"mode" : "1",
		"events" : [
			{
				"event" : "hurt",
				"desc" : "Slimerilla",
				"x" : 128.215,
				"y" : 350.015,
				"life" : 12
			}
		]
	}
}
"""