// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic climate example logs a stream
of temperature and humidity to the console.
*********************************************/

var tessel = require('tessel');

var climatelib = require('climate-si7020');

var climate = climatelib.use(tessel.port['A']);
let ghostAlert = false;

climate.on('ready', function () {
  console.log('Connected to climate module');

  let lastTemp;

  // Loop forever
  setImmediate(function loop() {
    climate.readTemperature('f', function (err, temp) {
      let currentTemp = temp.toFixed(2);
        if (lastTemp && ((lastTemp-currentTemp) > .5)) {
          console.log(lastTemp-currentTemp);
          console.log("GHOST!!!!");
          ghostAlert = true;
        }
        lastTemp = currentTemp;
        setTimeout(loop, 1000);
    });
  });
});


climate.on('error', function (err) {
  console.log('error connecting module', err);
});

module.exports = climate;