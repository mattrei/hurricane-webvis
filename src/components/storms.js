AFRAME.registerComponent('storms', {
  schema: {
    src: {
      type: 'asset'
    },
    img: {
      type: 'map'
    },
    startDate: {
      default: '2017-02-15T06:00:00',
      parse: function (value) {
        return new Date(value)
      },
      stringify: function (value) {
        return value.toISOString();
      }
    },
    date: {
      default: '2017-02-15T06:00:00',
      parse: function (value) {
        return new Date(value)
      },
      stringify: function (value) {
        return value.toISOString();
      }
    },
    days: { 
      default: 2 
    },
    daysPerSec: {
      default: 0.1
    },
    loop: {
      type: 'boolean',
      default: true
    },
    enabled: {
      type: 'boolean',
      default: true
    }
  },
  init: function() {
    this.loaded = false;
  },

  update: function(oldData) {
    const data = this.data;

    if (AFRAME.utils.deepEqual(data, oldData)) return;
    this.enabled = true;

    const loader = new THREE.FileLoader();
    const textureLoader = new THREE.TextureLoader();

    if (data.startDate !== oldData.startDate) {
      this.storms = []
      if (this.loaded) {
        this.create();
      } else {
        loader.load(this.data.src, geojson => {
          textureLoader.load(data.img.src, texture => {
            this.loaded = true;

            this.geojson = geojson;
            this.texture = texture;
            this.create();
          });
        });
      }
    }
  },

  createStorm: function(id, features) {

    const stormFeatures = features.filter(f => f.properties['id'] === id)

    const startDate = new Date(stormFeatures[0].properties['d'])
    const endDate = new Date(stormFeatures[stormFeatures.length - 1].properties['d'])
    const days = (endDate - startDate) / (24 * 60 * 60 * 1000)


    const coords = stormFeatures.map(f => f.geometry.coordinates); //lng, lat
    const points = coords.map(c => this.latLngToVec3(c[1], c[0]));

    const curve = new THREE.CatmullRomCurve3( points );

    // TODO Line Geometry
    //
    // track as vertex and fragment shader
    const geometry = new THREE.BufferGeometry().setFromPoints( curve.getPoints( 50 ));

    const material = new THREE.LineBasicMaterial({ 
          color: 0x0000ff,
          linewidth: 5, });

    const line = new THREE.Line( geometry, material );
    line.position.z = 0.01;
    line.name = `line_${id}`

    this.el.object3D.add(line)


    return {
      id, 
      curve, 
      days, 
      startDate,
      endDate,

      enabled: true,
      rotation: Math.random() * 1, //rotation Velocity? 
      //color
      //size
    }
  },

  create: function() {

    const data = this.data;

    const startDate = data.startDate;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + data.days);

    const features = this.geojson.features.filter(f => {
      const stormDate = new Date(f.properties['d']);
      return stormDate >= startDate && stormDate <= endDate;
    })

    const storms = features.map(f => f.properties['id'])
    const stormIds = [...new Set(storms)];

    this.storms = stormIds.map(s => this.createStorm(s, features))
    console.log(this.storms)

    //const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    //const material = new THREE.MeshNormalMaterial();
    const size = 0.1;
    const geometry = new THREE.PlaneBufferGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      color: '#fff',
    });

    this.mesh = new THREE.InstancedMesh( geometry, material, this.storms.length );
    this.mesh.position.z += 0.02;

    this.el.object3D.add(this.mesh);

  },
  latLngToVec3: function (lat, lon) {
    const geomComponent = this.el.components.geometry;
    if (geomComponent.data.primitive === 'sphere') {
      return this._sphericalLatLngToVec3(lat, lon);
    } else if (geomComponent.data.primitive === 'plane') {
      return this._planarLatLngToVec3(lat, lon);
    }
  },
  _planarLatLngToVec3: function (lat, lon) {
    const geomComponent = this.el.components.geometry;

    const width = geomComponent.data.width;
    const height = geomComponent.data.height;

    return new THREE.Vector3(
            lon / 360 * width - (width / 2),
            -lat / 180 * height, //+ (height / 2),
            0);
  },
  _sphericalLatLngToVec3: function (lat, lon) {
        // lat = Math.max(175, Math.min(5, lat))
        // lat = Math.min(160, lat)

    const geomComponent = this.el.components.geometry;
    const radius = geomComponent.data.radius;

    const phi = lat * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  },

  tick: (function() {
    const dummy = new THREE.Object3D();

    return function(time, delta) {
      const data = this.data;

      if (!data.enabled || !this.enabled) return;
      if (!this.mesh) return;

      const mesh = this.mesh;

      for (let i = 0; i < this.storms.length; i++) {

        const storm = this.storms[i];

        if (!storm.enabled) continue;

        if (data.date >= storm.startDate && data.date < storm.endDate) {

          const curve = storm.curve;
    
          // ratio between startDate and date.date and 
          //
          //const ratio = (data.date.getTime() - storm.startDate.getTime()) / (storm.endDate.getTime() - storm.startDate.getTime())
          //const looptime = storm.days * (10/data.daysPerSec) * 1000 * curve.getLength();
          const looptime = storm.days * (1/data.daysPerSec) * 1000;
          const t = ( time % looptime ) / looptime;

          curve.getPointAt(t, dummy.position);

          //dummy.position.copy( pos );
          //dummy.rotation.z += storm.rotation * delta * 0.001;
          // noise scaling
          //dummy.scale.set = Math.sin(t);
        } else {
          if (data.date >= storm.endDate) {
            storm.enabled = false;
            dummy.position.set(1000, 1000, 1000) ;
          }
        }

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix );
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  })()

});
