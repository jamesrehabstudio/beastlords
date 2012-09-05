import random

class World() :
	def __init__(self):
		self.width = 20
		self.height = 25
		self.tiles = []
		self.createTopology()
		
	def createTopology(self):
		sea = {'n':5.0,'s':0.01,'w':1.0,'e':3.0}
		for y in range( self.height ):
			for x in range( self.width ):
				sea_level = 0
				sea_level += max( sea['n'] - y, 0 ) / sea['n']
				sea_level += max( x - ( self.width - sea['e'] ), 0 ) / sea['e']
				sea_level += max( x - ( self.width - sea['s'] ), 0 ) / sea['s']
				sea_level += max( sea['w'] - x, 0 ) / sea['w']
				sea_level = min( sea_level, 1.0 )
				
				self.tiles.append( Tile( sea_level ) )
				
		
	def displayWorld(self):
		for y in range( self.height ):
			out = ""
			for x in range( self.width ):
				index = ( y * self.width ) + x
				out = out + str( int( self.tiles[ index ].sea_elevation() ) ) + " "
			print out
			
			
class Tile():	
	def __init__(self, sea_factor):
		self.elevation = 1 + ( random.random() * 20 )
		self.terrain = 0
		self.hardness = 20
		self.sea_factor = sea_factor
	
	def sea_elevation( self ):
		if self.sea_factor > self.hardness :
			return 0
		return max( self.elevation * min( 1 - self.sea_factor, 1 ), 0 )
		
	def toString(self):
		if self.sea_elevation() > 0:
			return "G "
		else:
			return "W "
			
w = World()
w.displayWorld()