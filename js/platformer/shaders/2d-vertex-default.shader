attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform mat3 u_world;
uniform mat3 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;

void main() {
	vec3 pos = u_camera * u_world * vec3(a_position,1);
	gl_Position = vec4(pos,1);
	v_texCoord = a_texCoord;
	v_position = a_position;
}