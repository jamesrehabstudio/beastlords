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
			out.append(data[i])
	
	return (out,x_start, y_start, newWidth)

def transform(filename, roomsize):
	t = ("front","back","far")
	tree = ET.parse(filename)
	root = tree.getroot()
	
	layers = root.findall("layer")
	objectLayers = root.findall("objectgroup")
	properties = {}
	
	out = {"objects":[]}
	
	for layer in layers:
		width = int(layer.attrib["width"])
		height = int(layer.attrib["height"])
		layername = layer.attrib["name"]
			
		out[layername] = {
			"data" : [],
			"xoff" : 0,
			"yoff" : 0,
			"width" : width
		}
	
		data = layer.find("data")
		data_array = data.text.replace("\n","").split(",")
		
		if not layer.attrib["name"] in t:
			dr = cleanTiles(data_array, width)
			#import pdb; pdb.set_trace()
			out[layername]['data'] = dr[0]
			out[layername]['xoff'] = dr[1]
			out[layername]['yoff'] = dr[2]
			out[layername]['width'] = dr[3]
		else:
			out[layername]['data'] = data_array
			out[layername]['width'] = width
			
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
				
				out["objects"].append( [
					int(object.attrib["x"]),
					int(object.attrib["y"])-16,
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
			
			
	for property in properties:
		out[property] = properties[property]
		
	#import pdb; pdb.set_trace()
	return out

def main():
	dir = os.path.dirname(os.path.realpath(__file__))
	world = transform(dir+"\\"+"world.tmx", (8,15))
		
	write = ""
	write += "\n\nwindow._map_world = \n"
	write += json.dumps(world) + "\n"
	write += ";"
				
	outputfile = open("worldmap.js", "w")
	outputfile.write( write )
	outputfile.close()
main()