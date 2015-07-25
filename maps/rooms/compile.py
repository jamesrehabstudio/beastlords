import json
import os
import re

def compile(data, width=16):
	out = {}
	out["width"] = int(data["width"]) / width
	out["height"] = int(data["height"]) / 15
	for layer in data["layers"]:
		if layer["name"] == "lines":
			if "properties" in layer :
				for property in layer["properties"]:
					if property == "rarity":
						out[str(property)] = float(layer["properties"][property])
					elif property in ["tags", "type", "entrances"]:
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
			if "properties" in layer :
				for property in layer["properties"]:
					if property == "rarity":
						out[str(property)] = float(layer["properties"][property])
					elif property in ["tags", "type", "entrances"]:
						out[str(property)] = json.loads(layer["properties"][property])
					else:
						out[str(property)] = str(layer["properties"][property])
			out["objects"] = []
			for object in layer["objects"]:
				objname = str(object["name"])
				out["objects"].append( [ int(object["x"])+8, int(object["y"])-8, objname, object["properties"] ] )
				if objname == "Door":
					out["key_required"] = True
		elif layer["name"] == "back":
			out["back"] = layer["data"]
		elif layer["name"] == "front":
			out["front"] = layer["data"]
		elif layer["name"] == "far":
			out["far"] = layer["data"]
	
	return out
	
def main():
	rooms = []
	junctions = []
	towns = []
	maps = []
	
	for file in os.listdir(os.getcwd()):
		if re.match(".*\.room", file):
			try:
				if file[0:4] == "map_":
					maps.append( open(file,"r").read() )
				elif file[0:4] == "town":
					towns.append( open(file,"r").read() )
				elif re.match("j\d+\..*", file):
					junctions.append( open(file,"r").read() )
				else:
					rooms.append( open(file,"r").read() )
			except Exception, err:
				print "Error reading: " + file + " " + str(err)
		elif re.match(".*\.json", file):
			try:
				if file[0:4] == "map_":
					maps.append( compile( json.loads( open(file,"r").read() ) ) )
				elif file[0:4] == "town":
					towns.append( compile( json.loads( open(file,"r").read() ), 8 ) )
				elif re.match("j\d+\..*", file):
					junctions.append( compile( json.loads( open(file,"r").read() ) ) )
				else:
					rooms.append( compile( json.loads( open(file,"r").read() ) ) )
			except Exception, err:
				print "Error reading: " + file + " " + str(err)
	
	#Write out regular rooms
	write = "window._map_rooms = [\n"
	i = 0
	for room in rooms:
		if i > 0 : write += ",\n"
		if type(room) == dict:
			write += "\t\t" + json.dumps(room)
		else:
			write += "\t\t" + str(room)
		i += 1
	write += "\n\t];"
	
	#Write out junctions
	write += "\n\nwindow._map_junctions = [\n"
	i = 0
	for room in junctions:
		if i > 0 : write += ",\n"
		if type(room) == dict:
			write += "\t\t" + json.dumps(room)
		else:
			write += "\t\t" + str(room)
		i += 1
	write += "\n\t];"
	
	#Write out towns
	write += "\n\nwindow._map_town = [\n"
	i = 0
	for room in towns:
		if i > 0 : write += ",\n"
		if type(room) == dict:
			write += "\t\t" + json.dumps(room)
		else:
			write += "\t\t" + str(room)
		i += 1
	write += "\n\t];"
	
	#Write out fully formed maps
	write += "\n\nwindow._map_maps = [\n"
	i = 0
	for room in maps:
		if i > 0 : write += ",\n"
		if type(room) == dict:
			write += "\t\t" + json.dumps(room)
		else:
			write += "\t\t" + str(room)
		i += 1
	write += "\n\t];"
	
	#Save file
	outputfile = open("../map.js", "w")
	outputfile.write( write )
	outputfile.close()
		
main()