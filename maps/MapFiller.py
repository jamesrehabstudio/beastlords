import xml.etree.ElementTree as ET
import os
import re
import glob
import json

TILE_DEFAULT = 1
XML_HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0" orientation="orthogonal" renderorder="right-down" width="{0}" height="{1}" tilewidth="16" tileheight="16" nextobjectid="1">
"""

XML_TILESHEET = """
 <tileset firstgid="{3}" name="{0}" tilewidth="16" tileheight="16" tilecount="{2}" columns="{4}">
  <image source="{1}" width="{5}" height="{5}"/>
 </tileset>
"""

XML_TILELAYER = """
<layer name="{0}" width="{2}" height="{3}">
  <data encoding="csv">
{1}
</data>
 </layer>
"""

XML_FOOTER = """
</map>
"""

def save(filename,data):
	width = data["width"]
	height = data["height"]
	
	out = ""
	out += XML_HEADER.format(width,height)
	
	for tile in data["tiles"]:
		out += XML_TILESHEET.format(*tile)
		
	for layer in data["layers"]:
		d = str(data["layers"][layer]).replace("[","").replace("]","")
		out += XML_TILELAYER.format(layer,d,width,height)
		
	out += XML_FOOTER
		
	outputfile = open(filename, "w")
	outputfile.write( out )
	outputfile.close()
	
def makebig(indata):
	map = indata[0]
	mapWidth = indata[1]
	width = mapWidth * 16
	out = [0] * (len(map) * 16 * 15)
	
	i = 0
	for t in map:
		index = int((i%mapWidth) + int(i/mapWidth)*width)
		out[index] = t
		i+=1
	
	return out

def transform(indata):
	map = indata[0]
	mapWidth = indata[1]
	width = mapWidth * 16
	out = [0] * (len(map) * 16 * 15)
	
	i = 0
	for t in map:
		base = ((i % mapWidth) * 16) + (int(i/mapWidth) * width * 15)
		if t > 0:
			_t = t - 1
			shape = int(_t / 16)
			door = int(_t % 16)
			
			east = (shape & 0b0010)
			west = (shape & 0b0001)
			south = shape & 0b1000
			north = (shape & 0b0100)
			
			door_west = door & 0b01
			door_east = door & 0b10
			
			#import pdb; pdb.set_trace();
			
			for x in range(16):
				for y in range(15):
					index = int(base + x + y * width)
					if north and y < 2:
						out[index] = TILE_DEFAULT
					if south and y >= 13:
						out[index] = TILE_DEFAULT
					if west and x < 1:
						out[index] = TILE_DEFAULT
					if east and x > 14:
						out[index] = TILE_DEFAULT
						
					#if door_west and x < 1 and y < 13 and y > 8:
					#	out[index] = 0
					#if door_east and x >= 14 and y < 13 and y > 8:
					#	out[index] = 0
		i+=1
	
	return out
	
def getMapData(filename):
	tree = ET.parse(filename)
	root = tree.getroot()
	out = []
	width = 0
	height = 0
	
	layers = root.findall("layer")
	for layer in layers:
		name = layer.attrib["name"]
		width = int(layer.attrib["width"])
		height = int(layer.attrib["height"])
		if name == "map":
			data = layer.find("data").text.replace("\n","").split(",")
			for d in data:
				out.append(int(d))
	
	return (out, width, height)


def main():
	openname = raw_input("Open: ")
	savename = raw_input("Save: ")
	map = getMapData(openname)
	
	out = {
		"width" : map[1] * 16,
		"height" : map[2] * 15,
		"layers" : {
			"front" : transform(map),
			"map" : makebig(map)
		},
		"tiles" : [
			("map","../img/tiles/maptiles2.png",256,1,16,256),
			("temple1","../img/tiles/temple1.png",1024,257,32,512)
		]
	}
	
	save(savename,out)
main()