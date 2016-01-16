import xml.etree.ElementTree as ET
import os
import re
import glob
import json

def cleanTiles(data,width,minWidth=1,startAtZero=True):
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
		
	newWidth = max(1 + x_end - x_start, minWidth)
	newHeight = 1 + y_end - y_start
	
	if startAtZero:
		x_start = y_start = 0
	
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
				#set min width for map truncations
				mapwidth = width / roomsize[0]
				truncatedData = cleanTiles(data_array, width, mapwidth)
				data_array = truncatedData[0]
				#out["mapWidth"] = truncatedData[3]
					
			out[layer.attrib["name"]] = processTileData(data_array,tileStarts)
			
		
	objectLayers = root.findall("objectgroup")
	
	#if filenameFromPath(filename) == "map_crypt":
	#	import pdb; pdb.set_trace()
	
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
					
				#find offset for object
				offset = (8,8)
				if("gid" in object.attrib):
					offset = (8,-8)
					
				#add object to data
				out["objects"].append( [
					int(float(object.attrib["x"]))+offset[0],
					int(float(object.attrib["y"]))+offset[1],
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
	
def transformBackground(filename):
	tree = ET.parse(filename)
	root = tree.getroot()
	
	out = {}
	width = 48
	height = 48
	
	#Split up different tilesets
	tilesets = root.findall("tileset")
	tileStarts = []
	for tileset in tilesets:
		tileStarts.append(int(tileset.attrib["firstgid"]))
		#image = tileset.findall("image")[0]
		image = tileset.find("image")
		out["tileset"] = filenameFromPath(image.attrib["source"])
		print str(out["tileset"])
	tileStarts.sort()
	
	layers = root.findall("layer")
	objectLayers = root.findall("objectgroup")

	for layer in layers:
		data = layer.find("data")
		out[layer.attrib["name"]] = []
		data_array = data.text.replace("\n","").split(",")				
		out[layer.attrib["name"]] = processTileData(data_array,tileStarts)
		
	return out

def filenameFromPath(path):
	out = path.replace("\\","//")
	try:
		out = re.match("^(.+\/)*(\w+)(\.\w+)$",out).group(2)
	except Exception, err:
		print "Cannot find filename in " + path
		
	return out

def main():
	directories = [
		"backdrops//*.tmx",
		"rooms/**/*.tmx",
		"rooms/**/*.room",
	]
	rooms = {}
	maps = {}
	towns = {}
	backdrops = []
	
	#for file in os.listdir(os.getcwd()):
	for directory in directories:
		filepath = glob.glob( directory )
		for f in filepath:
			if f[0:10] == "rooms\\test" or re.match(".*\.exc\.(room|tmx)", f):
				print "pass on " + str(f)
			elif f[0:10] == "backdrops\\":
				try:
					name = filenameFromPath(f)
					print "background "+ str(name)
					backdrops.append(transformBackground(f))
				except Exception, err:
					print "Error processing backdrop "+ str(name)
			elif re.match(".*\.tmx", f):
				try:
					name = filenameFromPath(f)
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
					name = filenameFromPath(f)
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
	
	#import pdb; pdb.set_trace();
	write += "\n\nwindow._map_maps = {\n"
	for map in maps:
		mapname = "map"
		try:
			mapname = re.match("^.*map_(.+)$",map).groups()[0]
		except Exception:
			pass
		write += "\t" + "\""+mapname+"\" : " + json.dumps(maps[map]) + ",\n"
	write += "};"
	
	write += "\n\nwindow._map_backdrops = [\n"
	for map in backdrops:
		write += "\t" + json.dumps(map) + ",\n"
	write += "];"
				
	outputfile = open("map.js", "w")
	outputfile.write( write )
	outputfile.close()
main()