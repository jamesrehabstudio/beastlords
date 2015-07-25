import xml.etree.ElementTree as ET
import os
import re
import glob
import json

def transform(filename, roomsize):
	t = ("front","back","far")
	tree = ET.parse(filename)
	root = tree.getroot()
	
	layers = root.findall("layer")
	objectLayers = root.findall("objectgroup")
	properties = {
		"rarity" : 0
	}
	
	out = {"objects":[]}
	width = 0
	height = 0
	
	for layer in layers:
		if layer.attrib["name"] in t:
			data = layer.find("data")
			out[layer.attrib["name"]] = []
			data_array = data.text.replace("\n","").split(",")
			for i in data_array:
				out[layer.attrib["name"]].append(int(i))
			width = int(layer.attrib["width"])
			height = int(layer.attrib["height"])
			
	for objectLayer in objectLayers:
		#get properties from object layer
		for object in objectLayer:
			try:
				options = {}
				name = object.attrib["name"]
				if object.find("properties"):
					for property in object.find("properties"):
						if property.attrib["name"] in ["tags"]:
							options[property.attrib["name"]] = property.attrib["value"].split(",")
						if property.attrib["name"] in ["type", "entrances"]:
							options[property.attrib["name"]] = json.loads(property.attrib["value"])
						else:
							options[property.attrib["name"]] = property.attrib["value"]
				
				if name == "Door":
					out["key_required"] = True
				out["objects"].append( [
					int(object.attrib["x"])+8,
					int(object.attrib["y"])-8,
					name,
					options
				])
			except Exception as err:
				pass
		
		try:
			for property in objectLayer.find("properties"):
				if property.attrib["name"] == "rarity":
					properties["rarity"] = float(property.attrib["value"])
				elif property.attrib["name"] in ["tags", "type", "entrances"]:
					properties[property.attrib["name"]] = json.loads(property.attrib["value"])
				else:
					properties[property.attrib["name"]] = property.attrib["value"]
		except:
			pass
			
			
	out["width"] = int(width / roomsize[0])
	out["height"] = int(height / roomsize[1])
	for property in properties:
		out[property] = properties[property]
	return out

def main():
	directories = [
		"rooms/**/*.tmx",
		"rooms/**/*.room",
	]
	rooms = {}
	maps = {}
	towns = {}
	
	#for file in os.listdir(os.getcwd()):
	for directory in directories:
		filepath = glob.glob( directory )
		for f in filepath:
			if f[0:10] == "rooms\\test" or re.match(".*\.exc\.(room|tmx)", f):
				print "pass on " + str(f)
			if re.match(".*\.tmx", f):
				try:
					name = f[0:len(f)-4]
					if f[0:10] == "rooms\\town":
						towns[name] = transform(f, (8,15))
					elif f[0:10] == "rooms\\maps":
						maps[name] = transform(f, (16,15))
					else:
						rooms[name] = transform(f, (16,15))
				except Exception, err:
					print "Error reading: " + f + " " + str(err)
			elif re.match(".*\.room", f):
				try:
					name = f[0:len(f)-5]
					rooms[name] = file(f).read()
				except Exception, err:
					print "Error reading: " + f + " " + str(err)
				
	write = "window._map_rooms = [\n"
	for map in rooms:
		if type(rooms[map]) == dict:
			write += "\t" + json.dumps(rooms[map]) + ",\n"
		else:
			write += "\t" + str(rooms[map]) + ",\n"
	write += "];\n"
		
	write += "\n\nwindow._map_town = [\n"
	for map in towns:
		write += "\t" + json.dumps(towns[map]) + ",\n"
	write += "];"
	
	write += "\n\nwindow._map_maps = [\n"
	for map in maps:
		write += "\t" + json.dumps(maps[map]) + ",\n"
	write += "];"
				
	outputfile = open("map.js", "w")
	outputfile.write( write )
	outputfile.close()
main()