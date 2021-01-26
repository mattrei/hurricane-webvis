function setCursor(state, clazz) {
  const selector = `.${clazz} .selectable, .${clazz} .clickable`;
  state.cursorObjects = selector;
}

const RAYCASTER_EXPLORE = 1000;

AFRAME.registerState({
  initialState: {
    language: 'de',
    explore: true,

    cursorObjects: '',

    inVR: false,
    isMobile: AFRAME.utils.device.isMobileVR(),
    cursorVisible: false,
    rayOrigin: AFRAME.utils.device.isMobileVR() ? 'entity' : 'mouse',
    fuseTimeout: 3000,
    raycasterInterval: 800,

    year: 0,
    yearTo: 0,
    hud: {
      year: '',
    },

    // for storms not storm-tracks!
    // unused
    animation: {
      startDate: '2017-02-15T06:00:00',
      days: 100, //40 * 100,
      daysPerSec: 2,
      loop: true,
      enabled: true
    }

  },

  computeState: function(newState, payload) {
  },

  handlers: {
    messagePosted: function(state, action) {
      AFRAME.utils.extendDeep(state, action);
    },

    loaded: function(state, action) {
      state.explore = true;
      state.raycasterInterval = RAYCASTER_EXPLORE;

      setCursor(state, 'exploreObjects');
      state.cursorVisible = true;
    },

    setYear: function(state, year) {
      state.year = year;
      state.hud.year = year;
      if (year === 0) {
        state.hud.year = '2000 - 2020'
      }
    },

    /*
    incrDate: function(state, days) {
      const prevDate = new Date(state.date ? state.date : state.animation.startDate);

      const date = new Date(prevDate.getTime() + (days * 24 * 60 * 60 * 1000));

      state.date = date.toISOString();

      const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
      const localeDate = date.toLocaleDateString(state.language, options)
      const localeTime = date.toLocaleTimeString(state.language)
      state.hud.date = localeDate;
      state.hud.time = localeTime;
    },

    resetDate: function(state) {

      const date = new Date(state.animation.startDate);
      state.date = date.toISOString();
    },
    */

    'enter-vr': function(state, action) {
      state.inVR = true;
    },

    'exit-vr': function(state, action) {
      state.inVR = false;
    }
  }
});
