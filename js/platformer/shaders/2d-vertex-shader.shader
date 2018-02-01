precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec2 u_resolution;
uniform vec2 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;

void main() {
	vec2 pos = a_position + u_camera - u_resolution * 0.5;
	//pos.y = u_resolution.y + pos.y*-1.0;
	pos.y = pos.y*-1.0;
	//pos.x = pos.x - u_resolution.x;
	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);
	v_texCoord = a_texCoord;
	v_position = a_position;
}