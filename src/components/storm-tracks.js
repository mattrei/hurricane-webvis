const d3ScaleChromatic = require('d3-scale-chromatic')
const Papa = require('papaparse')
// control via animation loop
// since year and cumulative
// https://jsfiddle.net/prisoner849/ofcdgtz8/
const shader = {
  vertex: `
  attribute float visible; 
  attribute float enabled; 
  attribute vec3 vertcolor; 
  attribute float lineDistance;

  varying float vLineDistance;
  varying float vEnabled; 
  varying float vVisible; 
  varying vec3 vColor; 

  void main() { 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); 
    
    vLineDistance = lineDistance;
    vColor = vertcolor; 
    vVisible = visible; 
    vEnabled = enabled; 
  }
  `,
  fragment: `
  varying float vEnabled; 
  varying float vVisible; 
  varying vec3 vColor; 
  varying float vLineDistance;

  uniform float dashSize;
  uniform float gapSize;
  uniform float dotSize;
  uniform float opacity;
  uniform float time;

  void main() { 
    vec4 color = vec4( vColor, opacity  ); 
    if ( vVisible > 0.0 ) { 
      gl_FragColor = color;
    } else { 
      discard; 
    } 
    if ( vEnabled < 1.0 ) { 
      discard;
    }

    float totalSize = dashSize + gapSize;
		float modulo = mod( vLineDistance + time, totalSize ); // time added to vLineDistance
    float dotDistance = dashSize + (gapSize * .5) - (dotSize * .5);

    if ( modulo > dashSize && mod(modulo, dotDistance) > dotSize ) {
      discard;
    }

    gl_FragColor = color;
  }
  `
}


AFRAME.registerComponent('storm-tracks', {
  schema: {
    src: {
      type: 'asset'
    },
    year: {
      default: 0
    },
    yearTo: {
      default: 0
    },
    opacity: {
      default: 1.0
    },
    drawDuration: {
      default: 2000 // ms
    },
    enabled: {
      type: 'boolean',
      default: true
    }
  },
  init: function() {
    const data = this.data;
    this.numControlPoints = 30;

    this.drawProgress = 0;
    this.storm = []
    this.loaded = false;

    const loader = new THREE.FileLoader();
    loader.load(this.data.src, content => {
      Papa.parse(content, {
        header:false, delimiter:",",fastMode: true, 
        complete: results => {
          this.loaded = true;
          this.create(results.data);
          this.storm = results.data; 

          this.filter(this.storm, data.year, data.yearTo);
        }
      })
    });
  },

  update: function(oldData) {
    const data = this.data;
    if (AFRAME.utils.deepEqual(data, oldData)) return;

    this.drawProgress = 0;

    if (this.loaded) {
      if (data.year !== oldData.year) {
        this.drawProgress = 0;
        // TODO delete?
        //const year = data.year > 2019 ? 0 : data.year;
        this.filter(this.storm, data.year, data.yearTo);
      }
    }
  },

  create: function(storm_data) {
    const data = this.data;
    const position_splines = [];
    const color_splines = [];

    const maxKnots = 50;//90; // 160 kmh
    for (let s = 0; s < storm_data.length; s++) {
      const storm = storm_data[s];

        if (storm.length >= (1 + 12)) {
            var points = [];
            var colors = [];

            for (var e = 3; e < storm.length - 3; e += 3) {

                const lng  = parseFloat(storm[e + 1]);
                const lat  = parseFloat(storm[e + 2]);

                const pos = this.latLngToVec3(lat, lng);
                points.push(pos);

                //const color = this.color_from_wind_speed(storm[e + 0] * 5);
                const c = new THREE.Color(d3ScaleChromatic.interpolateTurbo(storm[e + 0] / maxKnots));
                // encode as Vector to be interpolate in the catmullromecurve
                const color = new THREE.Vector3(c.r, c.g, c.b);
                colors.push(color);
            }

            position_splines.push(new THREE.CatmullRomCurve3(points));
            color_splines.push(new THREE.CatmullRomCurve3(colors));
        }
    }

    const num_spline_control_points = this.numControlPoints;

    const line_geometry = new THREE.BufferGeometry();
    this.geometry = line_geometry;
    // two times because of line points
    const data_size = position_splines.length * 3 * 2 * (num_spline_control_points - 1);

    var line_positions = new Float32Array(data_size);
    var line_colors = new Float32Array(data_size);
    var line_visibles = new Float32Array(data_size / 3);
    var line_enabled = new Float32Array(data_size / 3);
    var line_distances = new Float32Array(data_size / 3);

    const geomComponent = this.el.components.geometry;
    const xbound = geomComponent.data.width / 2 - 0;

    for (var i = 0; i < position_splines.length; ++i) {

        var d = 0;
        for (var j = 0; j < num_spline_control_points - 1; ++j) {

            var start_index = j / (num_spline_control_points - 1);
            var start_pos = position_splines[i].getPoint(start_index);
            var end_index = (j + 1) / (num_spline_control_points - 1);
            var end_pos = position_splines[i].getPoint(end_index);

            var start_col = color_splines[i].getPoint(start_index);
            var end_col = color_splines[i].getPoint(end_index);

            var base_index = (i * (num_spline_control_points - 1) + j);

            line_positions[base_index * 6 + 0] = start_pos.x;
            line_positions[base_index * 6 + 1] = start_pos.y;
            line_positions[base_index * 6 + 2] = start_pos.z;

            line_positions[base_index * 6 + 3] = end_pos.x;
            line_positions[base_index * 6 + 4] = end_pos.y;
            line_positions[base_index * 6 + 5] = end_pos.z;

            line_colors[base_index * 6 + 0] = start_col.x;
            line_colors[base_index * 6 + 1] = start_col.y;
            line_colors[base_index * 6 + 2] = start_col.z;
            line_colors[base_index * 6 + 3] = end_col.x;
            line_colors[base_index * 6 + 4] = end_col.y;
            line_colors[base_index * 6 + 5] = end_col.z;

            line_visibles[base_index * 2 + 0] = 1.0;
            line_visibles[base_index * 2 + 1] = 1.0;

            //const length = Math.abs(start_pos.x) + Math.abs(end_pos.x)
            const enabled = (Math.abs(start_pos.x) >= xbound || Math.abs(end_pos.x) >= xbound) ? 0. : 1.;
            //const enabled = (start_pos.x == 100 || end_pos.x == 100) ? 0. : 1.;
            line_enabled[base_index * 2 + 0] = enabled;
            line_enabled[base_index * 2 + 1] = enabled;

            //final_pos = base_index * 2 + 1;
            line_distances[base_index * 2 + 0] = d;
            d += start_pos.distanceTo(end_pos);
            line_distances[base_index * 2 + 1] = d;
        }
    }

    line_geometry.setAttribute('position', new THREE.BufferAttribute(line_positions, 3));
    line_geometry.setAttribute('vertcolor', new THREE.BufferAttribute(line_colors, 3));
    line_geometry.setAttribute('visible', new THREE.BufferAttribute(line_visibles, 1));
    line_geometry.setAttribute('enabled', new THREE.BufferAttribute(line_enabled, 1));
    line_geometry.setAttribute('lineDistance', new THREE.BufferAttribute(line_distances, 1));

    line_geometry.computeBoundingSphere();


    this.uniforms = {
      opacity: { value: data.opacity},
      dashSize: {value: 0},
      // https://stackoverflow.com/questions/42229799/how-to-smoothly-animate-drawing-of-a-line
      gapSize: {value: 1e10}, // high value because we want to animate
      dotSize: {value: 0},
      time: {value: 0}
    }

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      //linewidth: 2.9, // not working
      transparent: true,
      //blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide
    });

    const lines = new THREE.LineSegments(line_geometry, material);
    this.geometry = line_geometry;

    this.el.setObject3D('mesh', lines);


  },
  
  filter: function(storm_data, year, yearTo) {

    const line_geometry = this.geometry;
    const num_spline_control_points = this.numControlPoints;

    const name_filter = ''
    var num_storms = 0;
    var name_filter_match = false;
    var lower_case_name_filter = name_filter.toLowerCase();
    var storm_index = -1;

    for (var s = 0; s < storm_data.length; ++s) {
        const storm = storm_data[s];

        if (name_filter.length === 0) {
            name_filter_match = true;
        } else

        if (storm_data[s][0].toLowerCase().indexOf(lower_case_name_filter) != -1) {
            name_filter_match = true;
        } else {
            name_filter_match = false;
        }

        var storm_date_end = parseInt(storm_data[s][2]);
        var storm_wind_speed_high = 100 //storm_data[s][4];

        var start = s * 2 * (num_spline_control_points - 1);

      //console.log(storm_date_end, year, yearTo)
        if (name_filter_match &&
            //storm_date_end >= max_slider_date &&
            (year === 0 || (storm_date_end <= yearTo && storm_date_end >= year))
        ) {

            num_storms++;

            storm_index = s;

            for (var i = 0; i < (num_spline_control_points - 1) * 2; ++i) {
                line_geometry.attributes.visible.array[start + i] = 1.0;
            }
            line_geometry.attributes.visible.needsUpdate = true;

        } else {

            for (var i = 0; i < (num_spline_control_points - 1) * 2; ++i) {
                line_geometry.attributes.visible.array[start + i] = 0;
            }
            line_geometry.attributes.visible.needsUpdate = true;
        }
    }
    this.uniforms.dashSize.value = 0;
  },

  latLngToVec3: function (lat, lon) {
    const geomComponent = this.el.components.geometry;
    const radius = geomComponent.data.radius;

    const phi = (90 - lat) * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  },

  tick: (function() {
    return function(time, delta) {
      const data = this.data;

      if (!data.enabled || !this.loaded) return;

      this.drawProgress += delta;

      this.uniforms.opacity.value = data.opacity;
      const r = data.drawDuration > 0 ? this.drawProgress / data.drawDuration : 1;
      // normalized between 0 and 1
      this.uniforms.dashSize.value = r;

    }
  })()

});
