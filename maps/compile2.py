import xml.etree.ElementTree as ET
import os
import re
import glob
import json

def cleanTiles(data,width):
	x_start = len(data)
	y_start = len(data)
	x_end = 0
	y_end = 0
	
	i = 0
	x = 0
	y = 0
	out = []
	for d in data:
		x = i%width
		y = int(i/width)
		if int(d) > 0:
			x_start = min(x, x_start)
			y_start = min(y, y_start)
			x_end = max(x, x_end)
			y_end = max(y, y_end)
		i+=1
		
	newWidth = 1 + x_end - x_start
	newHeight = 1 + y_end - y_start
	
	for y in range(newHeight):
		for x in range(newWidth):
			i = (x+x_start) + (y+y_start) * width
			out.append(int(data[i]))
	
	return (out,x_start, y_start, newWidth)
	
def processTileData(data,tileStarts):
	out = []
	for d in data:
		d = int(d)
		for i in reversed(tileStarts):
			if d >= i:
				d -= i-1
		out.append(d)
	return out

def transform(filename, roomsize):
	t = ("front","back","far","map")
	tree = ET.parse(filename)
	root = tree.getroot()
	
	#Split up different tilesets
	tilesets = root.findall("tileset")
	tileStarts = []
	for tileset in tilesets:
		tileStarts.append(int(tileset.attrib["firstgid"]))
	tileStarts.sort()
	
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
			width = int(layer.attrib["width"])
			height = int(layer.attrib["height"])
			if layer.attrib["name"] == "map":
				#truncate data, map case
				truncatedData = cleanTiles(data_array, width)
				data_array = truncatedData[0]
				#out["mapWidth"] = truncatedData[3]
					
			out[layer.attrib["name"]] = processTileData(data_array,tileStarts)
			
			
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
			elif re.match(".*\.tmx", f):
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
	
	write += "\n\nwindow._map_maps = {\n"
	for map in maps:
		mapname = "map"
		try:
			mapname = re.match("^.+map_(.+)$",map).groups()[0]
		except Exception:
			pass
		write += "\t" + "\""+mapname+"\" : " + json.dumps(maps[map]) + ",\n"
	write += "};"
				
	outputfile = open("map.js", "w")
	outputfile.write( write )
	outputfile.close()
main()