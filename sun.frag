/**
 * Set the colour to a lovely pink.
 * Note that the color is a 4D Float
 * Vector, R,G,B and A and each part
 * runs from 0.0 to 1.0
 */

precision highp float;
precision highp int;

varying vec2 vUv;
uniform float time;
uniform float altitude;
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform vec3 blindsColor;

vec4 sunset()
{
    vec4 col = vec4(1,1,1,1);
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    
    // Move the Sun in cycles 
    center.y = altitude;
    float dist = distance(center, uv);
    
    bool masked = true;
    
    // Circle formula
    if (dist < 0.2) {
        vec3 blend = mix(topColor, bottomColor, 1.0 - uv.y);
        col = vec4(blend.xyz, 1);
    } else {
        col = vec4(0.3, 0.0, 0.3, 1.0);
        masked = false;
    }
    
    
    // Background gradient 
    float f = fract(uv.y);
    col.b = min(0.3, f);
    
    // Blinds
    if (masked) {
        f = sin(3.0 * uv.y * uv.y * 160.0) * 0.4;
        if (f > sin(uv.y)*1.1) {
            discard;
        }
    } else {
      discard;
    }
        
    return col;
}

void main() {
  vec2 uv = vUv;
  float f = sin(time);
  //gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
  gl_FragColor = sunset();
}