precision mediump float;

uniform sampler2D u_image;
uniform sampler2D u_screen;
uniform vec4 u_color;
uniform vec2 u_size;
uniform float u_time;

varying vec2 v_texCoord;

const float pixsize = 0.015625;

void main() {
	vec2 uv = v_texCoord;
	float xscale = 1.0 / u_size.x;
	float yscale = 1.0 / u_size.y;
	uv.y = uv.y + (sin((v_texCoord.x+u_time*xscale) * (u_size.x * 0.1)) - 1.0) * (1.0/u_size.y);
	
	vec4 c_glow = vec4(1.0,1.0,0.2,1.0);
	vec4 c_body = vec4(0.9,0.0,0.2,1.0);
	vec4 c_deep = vec4(1.0,1.0,0.2,1.0);
	//vec4 c_deep = vec4(0.2,0.0,0.2,1.0);
	
	float bubbles = texture2D(u_image, mod((v_texCoord * u_size * pixsize) + vec2(0.0,u_time*0.1),1.0)).r;
	
	vec4 color = mix(c_body, c_deep, uv.y);
	color = mix(c_glow, color, clamp(0.25 * uv.y * u_size.y,0.0,1.0));
	color = mix(color, c_glow, bubbles * (1.0-min(v_texCoord.y/yscale*0.015625,1.0)));
	
	
	if(uv.y < 0.0){
		color.a = 0.0;
	}
	
	gl_FragColor = color;
	//gl_FragColor = vec4(random(v_texCoord.x),random(v_texCoord.y),0.0,1.0);
	
}