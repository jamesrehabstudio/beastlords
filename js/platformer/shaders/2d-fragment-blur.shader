precision mediump float;
uniform sampler2D u_image;
uniform float blur;
uniform vec4 u_color;

varying vec2 v_texCoord;
varying vec2 v_position;

void main() {
	vec4 color = texture2D(u_image, v_texCoord);
	vec4 u = texture2D(u_image, v_texCoord + vec2(0,-blur));
	vec4 d = texture2D(u_image, v_texCoord + vec2(0,blur));
	vec4 l = texture2D(u_image, v_texCoord + vec2(-blur,0));
	vec4 r = texture2D(u_image, v_texCoord + vec2(blur,0));
	
	if( v_position.y < 3.0 ) u = color;
	if( v_position.y > 14.0 ) d = color;
	if( v_position.x < 3.0 ) l = color;
	if( v_position.x > 14.0 ) r = color;
	
	float activeColors = 0.0;
	if( color.a > 0.1 ) activeColors++;
	if( u.a > 0.1 ) activeColors++;
	if( d.a > 0.1 ) activeColors++;
	if( l.a > 0.1 ) activeColors++;
	if( r.a > 0.1 ) activeColors++;
	
	color.r = (color.r + u.r + d.r + l.r + r.r) / activeColors;
	color.g = (color.g + u.g + d.g + l.g + r.g) / activeColors;
	color.b = (color.b + u.b + d.b + l.b + r.b) / activeColors;
	color.a = (color.a + u.a + d.a + l.a + r.a) / 5.0;
	
	//color.a = 1.0; color.r = v_position.x/16.0; color.g = v_position.y/16.0; color.b = 0.0;
	gl_FragColor = color * u_color;
}