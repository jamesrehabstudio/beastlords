precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
	//vec2 pos = a_position + u_camera - u_resolution * 0.5;
	//pos.x = pos.x - u_resolution.x;
	gl_Position = vec4(a_position, 0, 1);
	v_texCoord = a_texCoord;
}