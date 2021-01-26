AFRAME.registerComponent('looper', {
  schema: {
    dur: {
      default: 2000
    },
    enabled: {
      type: 'boolean',
      default: false
    }
  },
  init: function() {
  },
  update: function(oldData) {
    this.tick = AFRAME.utils.throttleTick(this.tick, this.data.dur, this);
  },
  tick: function(time, delta) {

    if (!this.data.enabled) return;
  },
});
