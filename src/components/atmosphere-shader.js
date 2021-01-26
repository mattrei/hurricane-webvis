
const fragmentShader = `
varying vec3 viewDir;
varying vec3 color0;
varying vec3 color1;

uniform vec3 lightDir;
uniform float mieG;
uniform float boost;

float miePhase(float cosTheta)
{
    float g2 = mieG * mieG;
    return 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + cosTheta*cosTheta) / pow(1.0 + g2 - 2.0*mieG*cosTheta, 1.5);
}

void main (void)
{
  vec3 view = normalize(viewDir);
  float cosTheta = dot(-lightDir, view);
  vec4 color = vec4(color0 + color1 * miePhase(cosTheta), 1.0);
  color *= (1.0 + boost);

  gl_FragColor = vec4(color0, 1.);
  //gl_FragColor = color;

}
`
const vertexShader = `
#define NUM_SAMPLES 2

varying vec3 viewDir;
varying vec3 color0;
varying vec3 color1;

uniform vec3 sunpos;
uniform float atmosphereRadius;
uniform float earthRadius;
uniform float rayleighFactor;
uniform float mieFactor;
uniform vec3 waveLenFactors;
uniform vec3 waveLenFactorsKr4PiKm4Pi;
uniform float rcpAtmosThickness;
uniform float rcpThicknessOverScaleDepth;
uniform float scaleDepth;

// earth origin is at 0, so ignore that
float getRayIntersectionDistance(vec3 origin, vec3 dir, float radius)
{
    // a = 1, since dir is unit
    float b = 2.0 * dot(dir, origin);
    // TODO: (origin . origin) is the camera height squared, could optimize
    float c = dot(origin, origin) - radius*radius;
//float c = cameraHeight*cameraHeight - radius*radius;
    float det = max(b*b - 4.0 * c, 0.0);

    // quadratic root
    return (-b - sqrt(det)) / 2.0;
}

float scale(float cosAngle)
{
	float x = 1.0 - cosAngle;
	return exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
}

void main(void)
{

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    vec3 lightDir = normalize(sunpos);
//lightDir.z *= -1.;
    //vec3 farPos = (hx_worldMatrix * hx_position).xyz;
    vec3 farPos = position;//;(modelMatrix * vec4(position, 1.)).xyz;

    //viewDir = cameraPosition - farPos; //farPos.xyz - hx_cameraWorldPosition;
    //viewDir = cameraPosition - position;
    viewDir = farPos - (cameraPosition);

    viewDir = position - cameraPosition;
    float far = length(viewDir);
    viewDir /= far;

    float near = (getRayIntersectionDistance(cameraPosition, viewDir, atmosphereRadius));
    vec3 nearPos = cameraPosition + near * viewDir;
    //vec3 nearPos = cameraPosition + viewDir * near;
    //float atmosDist = pow(1.-( far - near),2.);
    float atmosDist =1.-( far - near);

// TODO: calculate start offset correctly. Nearest point density is not really 0!
    float fStartAngle = dot(-viewDir, nearPos) / atmosphereRadius;
    float fStartDepth = clamp(exp(-1.0 / scaleDepth), 0., 1.);
    float fStartOffset = fStartDepth * scaleDepth * scale(fStartAngle);

    float thicknessOverScaleDepth = rcpAtmosThickness / scaleDepth;
    float sampleLength = atmosDist / float(NUM_SAMPLES);
    float fScaledLength = sampleLength * rcpAtmosThickness;

    vec3 v3SampleRay = viewDir * sampleLength;
    vec3 v3SamplePoint = nearPos + v3SampleRay * 0.5;

    vec3 color = vec3(0.0, 0.0, 0.0);

    vec3 v3Attenuate;

    for(int i = 0; i < NUM_SAMPLES; ++i) {
        float fHeight = length(v3SamplePoint);
        float expThicknessOverScaleDepth = exp(thicknessOverScaleDepth * (earthRadius - fHeight));
        float rcpHeight = 1.0 / fHeight;
        float lightAngle = dot(lightDir, v3SamplePoint) * rcpHeight;
        float cameraAngle = dot(viewDir, v3SamplePoint) * rcpHeight;

        float scatter = fStartOffset + expThicknessOverScaleDepth * scaleDepth * (scale(lightAngle) - scale(cameraAngle));
        v3Attenuate = clamp(exp(-scatter * waveLenFactorsKr4PiKm4Pi), vec3(0.), vec3(1.));

        color += v3Attenuate * expThicknessOverScaleDepth * fScaledLength;
        v3SamplePoint += v3SampleRay;
    }

    color0 = color * rayleighFactor * waveLenFactors;
    color1 = color * mieFactor;

  // playground

//color0 = vec3(near);
//color0 = vec3(far); 
//color0 = vec3(atmosDist); 
//color0 = nearPos;

//color0=vec3(cameraPosition.x/cameraHeight,0.,0.);
    
}`  

export default {
  vertex: vertexShader,
  fragment: fragmentShader
}
