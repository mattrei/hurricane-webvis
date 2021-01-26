//import 'nouislider/distribute/nouislider.css'
import wNumb from 'wnumb'
import noUiSlider from 'nouislider';
setTimeout( _ => {
const slider = document.getElementById('slider');
noUiSlider.create(slider, {
    range: {min: 1980, max:2019},
    start: [2000, 2010],
  step: 1,
  tooltips: true,
  format: wNumb({decimals: 0}),
    connect: true,
  /*
    pips: {
        mode: 'values',
        values: [1980, 2019],
        density: 4
    }
    */

});

  slider.noUiSlider.on('update', (evt) =>  {
    window.postMessage({"type":"aframe-state", "data": {"year": evt[0], "yearTo": evt[1]}}, '*')
  });
}, 2000)

AFRAME.registerComponent("main-ui", {
  schema: {},
  init: function() {

    this.infoboxVisible = false;

    const el = this.el;
    const infoDiv = document.getElementById("info");
    const cameraEl = document.getElementById("camera");

    const closeButton = document.getElementById("close");
    closeButton.addEventListener("click", e => {
      this.infoboxVisible = false;
      infoDiv.classList.add("hidden");
    });

    const menuButtons = document.querySelectorAll(".menubutton");
    const infoBoxs = document.querySelectorAll(".infobox");

    for (var i = 0; i < menuButtons.length; i++) {
      menuButtons[i].addEventListener("click", e => {

        const orbitControls = cameraEl.components["orbit-controls"];
        // TODO?
        //orbitControls.controls.enabled = false;
        //orbitControls.pause();

        const text = e.target.getAttribute("data-name");

        // hide all other infobox
        for (var j = 0; j < infoBoxs.length; j++) {
          infoBoxs[j].classList.add("hidden");
        }

        const infoboxDiv = document.getElementById(text);
        infoDiv.classList.remove("hidden");

        infoboxDiv.classList.remove("hidden");

      });
    }
  },
});
