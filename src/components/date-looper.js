AFRAME.registerComponent('date-looper', {
  schema: {
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
    this.days = 0 
  },

  update: function(oldData) {
    const data = this.data;
    if (AFRAME.utils.deepEqual(data, oldData)) return;
    this.enabled = true;
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);
  },

  tick: function(time, delta) {
    const data = this.data;

    if (!data.enabled || !this.enabled) return;

    this.days += data.daysPerSec;

    if (this.days > data.days) {
      this.el.sceneEl.emit('resetDate');
      if (!data.loop) {
        this.enabled = false;
      }
    } else {
      this.el.sceneEl.emit('incrDate', data.daysPerSec);
    }
  }

});
