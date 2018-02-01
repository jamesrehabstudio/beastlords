attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_tiles;
uniform float u_uvtilewidth;
uniform float u_tilesize;
uniform mat3 u_world;
uniform mat3 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;
varying vec2 v_edges;

void main() {
	vec3 pos = u_camera * u_world * vec3(a_position,1);
	gl_Position = vec4(pos,1);
	
	float f = u_tilesize / u_uvtilewidth;
	float tsw = u_uvtilewidth / u_tilesize;
	
	vec2 texCoord = a_texCoord;

	float tile = a_tiles.x;
	float flag = a_tiles.y;
	
	bool flagH = flag >= 4.0;
	if(flagH) { flag -= 4.0; }
	bool flagV = flag >= 2.0;
	if(flagV) { flag -= 2.0; }
	bool flagD = flag >= 1.0;
	
	if(flagD){
		float t = texCoord.x;
		texCoord.x = f + texCoord.y * -1.0;
		texCoord.y = f + t * -1.0;
	}
	if(flagH){
		texCoord.x = f + texCoord.x * -1.0;
	}
	if(flagV){
		texCoord.y = f + texCoord.y * -1.0;		
	}
	
	
	vec2 t = vec2(
		f * floor(mod(tile, tsw)),
		f * floor(tile / tsw)
	);
	v_texCoord = vec2(
		(texCoord.x + t.x),
		(texCoord.y + t.y)
	);
	v_position = a_position;
	v_edges = vec2(0,0);
	if(a_position.x > 0.0){
		v_edges.x = 1.0;
	}
	if(a_position.y > 0.0){
		v_edges.y = 1.0;
	}
}