//import { createGlowMesh } from 'three-glow-mesh';

const fragmentShader = `
uniform vec3 color;
uniform float coefficient;
uniform float power;
varying vec3 vVertexNormal;
varying vec3 vVertexWorldPosition;
void main() {
  vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
  vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
  viewCameraToVertex = normalize(viewCameraToVertex);
  float intensity	= pow(
    coefficient + dot(vVertexNormal, viewCameraToVertex),
    power
  );
  gl_FragColor = vec4(color, intensity);
}`;

const vertexShader = `
varying vec3 vVertexWorldPosition;
varying vec3 vVertexNormal;
void main() {
  vVertexNormal	= normalize(normalMatrix * normal);
  vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Based off: http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
function createGlowMaterial(coefficient, color, power) {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    fragmentShader,
    transparent: true,
    uniforms: {
      coefficient: {
        value: coefficient,
      },
      color: {
        value: new THREE.Color(color),
      },
      power: {
        value: power,
      },
    },
    vertexShader,
  });
}

function createGlowGeometry(geometry, size) {
  // Gather vertexNormals from geometry.faces
  const glowGeometry = geometry.clone();
  const vertexNormals = new Array(glowGeometry.vertices.length);
  glowGeometry.faces.forEach((face) => {
    if (face instanceof THREE.Face3) {
      vertexNormals[face.a] = face.vertexNormals[0];
      vertexNormals[face.b] = face.vertexNormals[1];
      vertexNormals[face.c] = face.vertexNormals[2];
    } else {
      console.error('Face needs to be an instance of THREE.Face3.', face);
    }
  });

  // Modify the vertices according to vertexNormal
  glowGeometry.vertices.forEach((vertex, i) => {
    const { x, y, z } = vertexNormals[i];
    vertex.x += x * size;
    vertex.y += y * size;
    vertex.z += z * size;
  });

  return glowGeometry;
}

function createGlowMesh(geometry, options ) {
  const { backside, coefficient, color, size, power } = options;

  const glowGeometry = createGlowGeometry(geometry, size);
  const glowMaterial = createGlowMaterial(coefficient, color, power);

  if (backside) {
    glowMaterial.side = THREE.BackSide;
  }

  return new THREE.Mesh(glowGeometry, glowMaterial);
}


AFRAME.registerComponent('glow', {
  schema: {

  },
  init: function() {

    const mesh = this.el.getObject3D('mesh')
    const geometry = new THREE.SphereGeometry(3, 60, 60)
    const globeObj = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true }));
    const glowMesh = createGlowMesh(globeObj.geometry, {
      backside: true,
      color: 'lightskyblue',
      //size: GLOBE_RADIUS * 0.15,
      size: 0.8,
      power: 4.5, // dispersion
      coefficient: 0.25
    });

    console.log('glowmesh', glowMesh)
    mesh.add(glowMesh)
    //this.el.setObject3D('mesh', glowMesh)
  }
})
