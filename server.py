import SimpleHTTPServer
import SocketServer
import sys
import json

from datetime import datetime

PORT = 8001
if len(sys.argv) > 1:
	PORT = int(sys.argv[1])
	
class ServerHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
	def do_POST(self):
		try:
			length = int(self.headers.getheader('content-length'))
			data = json.loads(self.rfile.read(length))
			now = datetime.utcnow()
			
			txt = open("feedback.txt","a")
			txt.write(now.strftime("%d %B %Y %H:%M:%S") + "\n")
			for i in data:
				txt.write(i + ": " + data[i] + "\n")
			txt.write("\n")
			txt.close()
		except err:
			pass

		SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

Handler = ServerHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()