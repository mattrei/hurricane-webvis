import shader from './atmosphere-shader'

let config = {
        rayleighFactor: 0.025,
        mieFactor: 0.01, //0.0010,

        earthRadius: 10.,//0.006371,
        atmosphereRadius: 0.11,//1.2,//0.0065302749999999994,

        scaleDepth: 0.05,//0.25,

        rcpAtmosThickness: 0.3,//1/(1.2-1),//3140,

        boost: 1,//13,

        mieG: -0.99,
}

AFRAME.registerComponent('atmosphere-material', {
  schema: {

  },

  init: function () {
    
    const el = this.el;
    const data = this.data;
    const geomData = el.components.geometry.data;
    const scene = this.el.sceneEl.object3D;

    this.angle = 0;
    
       var earthRadius = geomData.radius;
        var atmosphereScale = 1.025;
      var avgDensityHeight = .15;
    
     var atmosphereRadius = earthRadius * atmosphereScale;
      var atmosphereTickness = atmosphereRadius - earthRadius;
    
    
    const uniforms = {
      
        //lightDir: {value: new THREE.Vector3(0, 0, 1)},
      sunpos: {value: new THREE.Vector3(1, 0, 0)},
        boost: {value: 2.5},

        rayleighFactor: {value: 0.0025},  // warum so klein?
        mieFactor: {value: 0.0010},

        mieG: {value: -0.99},
      
      scaleDepth: {value: 1.},

        earthRadius: {value: earthRadius},
        atmosphereRadius: {value: atmosphereRadius},

        // rcpAtmosThickness": " // = 1 / (atmosphereRadius - earthRadius)",
        rcpAtmosThickness: {value: atmosphereTickness},

        // rcpThicknessOverScaleDepth": " // rcpAtmosThickness / avgDensityHeight",
        //rcpThicknessOverScaleDepth: {value: 1.0 / atmosphereTickness / avgDensityHeight},

        // wavelenBase: ": [ 0.650, 0.570, 0.475 ],

        // waveLenFactors: ": "1.0 / pow(wavelen, 4)",
        waveLenFactors: {value: new THREE.Vector3( 5.6020, 9.4733, 19.6438 )},

        // Kr4Pi: ": " // 4 * PI * rayleighFactor",
        // Km4Pi: ": " // 4 * PI * mieFactor",
        // waveLenFactorsKr4PiKm4Pi: ": " // waveLenFactors * Kr4Pi + Km4Pi = (waveLenFactors * rayl + mie) * 4 * pi",
        waveLenFactorsKr4PiKm4Pi: {value: new THREE.Vector3( 0.18855835184, 0.310178802936, 0.629694417296) }
        }
   
    this.material = this.el.getObject3D('mesh').material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      side: THREE.FrontSide,
      transparent: true,
      wireframe: false,
      depthWrite: false,
      depthTest: true,
      
      blending:  THREE.AdditiveBlending,
      /*
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquation: THREE.AddEquation
      */
    }); 
    
  },

  tick: (function() {

    const vector = new THREE.Vector3();
    const axis = new THREE.Vector3(0, 1, 0);

    return  function (time, delta) {

      if (!this.material) return;

      const light = vector.set(1,0,0).applyAxisAngle(axis, this.angle);
      this.material.uniforms.sunpos.value = light

      this.material.uniforms.rayleighFactor.value = config.rayleighFactor;
      this.material.uniforms.mieFactor.value = config.mieFactor;
      this.material.uniforms.earthRadius.value = config.earthRadius;
      this.material.uniforms.atmosphereRadius.value = config.atmosphereRadius;
      this.material.uniforms.rcpAtmosThickness.value = config.rcpAtmosThickness;
      this.material.uniforms.boost.value = config.boost;
      this.material.uniforms.scaleDepth.value = config.scaleDepth;
      this.material.uniforms.mieG.value = config.mieG;
    }

  }())

});


