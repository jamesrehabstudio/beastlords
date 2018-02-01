attribute vec3 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_world;
uniform mat4 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;
varying vec2 v_edges;

void main() {
	vec4 pos = vec4(a_position,1.0);
	
	//Invert Y axis
	pos.y = 1.0-pos.y;
	
	//pos = u_world * pos;
	pos = u_camera * u_world * pos;
	
	//Compress Z plane
	pos.z = pos.z * 0.001;
	
	v_texCoord = vec2(a_texCoord.x, 1.0-a_texCoord.y);
	v_position = a_position.xy;
	
	gl_Position = vec4(pos.xyz,1);
}