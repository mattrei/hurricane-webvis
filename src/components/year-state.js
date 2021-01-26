AFRAME.registerComponent('year-state', {
  schema: {
    year: {
      default: 0
    }
  },

  update: function(oldData) {
    const data = this.data;
    if (AFRAME.utils.deepEqual(data, oldData)) return;
    this.el.sceneEl.emit('setYear', data.year);
  },
});
