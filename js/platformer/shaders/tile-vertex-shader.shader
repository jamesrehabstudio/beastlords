attribute vec2 a_position;
attribute vec2 a_tile;
uniform vec2 u_resolution;
uniform vec2 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;

vec2 tile(vec2 tile){
	float size = 32.0;
	float t = tile.x + 1.0;
	float ts = 1.0 / size;
	float x = mod(t, size) / size;
	float y = floor(t / size) / size;
	
	if(tile.y >= 2.0){
		y += ts;
	}
	if(tile.y == 1.0 || tile.y == 3.0){
		x += ts;
	}
	
	return vec2(x,y);
}


void main() {
	//Adjust position with camera
	vec2 pos = a_position + u_camera - u_resolution * 0.5;
	
	//Flip object
	pos.y = pos.y*-1.0;
	
	//Set position
	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);
	
	//Get UV from tile information
	vec2 a_texCoord = tile(a_tile);
	
	
	//Store new position for fragment shader
	v_texCoord = a_texCoord;
	v_position = a_position;
}