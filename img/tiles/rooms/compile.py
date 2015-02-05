import json
import os
import re

def compile(data):
	out = {}
	out["width"] = int(data["width"]) / 16
	for layer in data["layers"]:
		if layer["name"] == "lines":
			for property in layer["properties"]:
				if property == "rarity":
					out[str(property)] = float(layer["properties"][property])
				elif property == "tags" or property == "type":
					out[str(property)] = json.loads(layer["properties"][property])
				else:
					out[str(property)] = str(layer["properties"][property])
			out["lines"] = []
			for object in layer["objects"]:
				x = int( object["x"] )
				y = int( object["y"] )
				for i in range(len(object["polyline"]) - 1 ):
					out["lines"].append( [ 
						x + object["polyline"][i]["x"], 
						y + object["polyline"][i]["y"], 
						x + object["polyline"][i+1]["x"], 
						y + object["polyline"][i+1]["y"] 
					] )
		elif layer["name"] == "objects":
			out["objects"] = []
			for object in layer["objects"]:
				out["objects"].append( [ int(object["x"])+8, int(object["y"])-8, str(object["name"]) ] )
		elif layer["name"] == "back":
			out["back"] = layer["data"]
		elif layer["name"] == "front":
			out["front"] = layer["data"]
	
	return out
	
def main():
	rooms = []
	junctions = []	
	
	for file in os.listdir(os.getcwd()):
		if re.match(".*\.json", file):
			try:
				if file[0] == "j":
					junctions.append( compile( json.loads( open(file,"r").read() ) ) )
				else:
					rooms.append( compile( json.loads( open(file,"r").read() ) ) )
			except Exception:
				print "Error reading: " + file
	
	#Write out regular rooms
	write = "\tthis.rooms = [\n"
	i = 0
	for room in rooms:
		if i > 0 : write += ",\n"
		write += "\t\t" + json.dumps(room)
		i += 1
	write += "\n\t];"
	
	#Write out junctions
	write += "\n\n\tthis.junctions = [\n"
	i = 0
	for room in junctions:
		if i > 0 : write += ",\n"
		write += "\t\t" + json.dumps(room)
		i += 1
	write += "\n\t];"
	
	#Save file
	outputfile = open("rooms.txt", "w")
	outputfile.write( write )
	outputfile.close()
		
main()