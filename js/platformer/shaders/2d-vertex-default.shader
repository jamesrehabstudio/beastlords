attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec4 u_frame;
uniform mat3 u_world;
uniform mat3 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;

void main() {
	vec3 pos = u_camera * u_world * vec3(a_position,1);
	gl_Position = vec4(pos,1);
	v_texCoord = vec2(
		(a_texCoord.x+u_frame.x) * u_frame.z,
		(a_texCoord.y+u_frame.y) * u_frame.w
	);
	v_position = a_position;
}