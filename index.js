'use strict';
const express = require('express');
const app = express();
const server = require('http').Server(app);
// Import the interface to Tessel hardware
const tessel = require('tessel');
var climatelib = require('climate-si7020');

var climate = climatelib.use(tessel.port['A']);
var accel = require('accel-mma84').use(tessel.port['B']);

let tempGhostAlert = false;
let movingGhostAlert = false;

climate.on('ready', function () {
  console.log('Connected to climate module');

  let lastTemp;

  // Loop forever
  setImmediate(function loop() {
    climate.readTemperature('f', function (err, temp) {
      let currentTemp = temp.toFixed(2);
        if (lastTemp && ((lastTemp-currentTemp) > .5)) {
          console.log(lastTemp-currentTemp);
          console.log("climate alert is true");
          tempGhostAlert = true;
        }
        else {tempGhostAlert = false;}
        lastTemp = currentTemp;
        setTimeout(loop, 1000);
    });
  });
});


climate.on('error', function (err) {
  console.log('error connecting module', err);
});

// Initialize the accelerometer.

let currAccel;
accel.on('ready', function () {
  // Stream accelerometer data
  accel.setOutputRate( 1.56, ()=>{
    accel.on('data', function (xyz) {
      const ACCELDIFF = 0;
      let currXYZ = xyz.map(element => {return element.toFixed(2)});      
      if (currAccel && (Math.abs(currXYZ[0] - currAccel[0]) > ACCELDIFF || Math.abs(currXYZ[1] - currAccel[1]) > ACCELDIFF || Math.abs(currXYZ[2] - currAccel[2]) > ACCELDIFF)) {
        movingGhostAlert = true;
        console.log('moving alert is true', currXYZ);
      }
      else {movingGhostAlert = false;}
        currAccel = currXYZ;
    });
  });
  });
  
  accel.on('error', function(err){
    console.log('Error:', err);
  });

  //Initialize the CAMERA
  var av = require('tessel-av');
  var os = require('os');
  const path = require('path');
  var http = require('http');
  var port = 8000;
  var camera = new av.Camera();
  var capture = camera.capture();

  // http.createServer( (req, res, next)=>{
  //   res.writeHead(200, { 'Content-Type': 'image/jpg' });
  //   camera.capture().pipe(res);
  // }).listen(port, () => console.log(`http://${os.hostname()}.local:${port}`));
  server.listen(port, function () {
    console.log(`http://${os.hostname()}.local:${port}`);
  });
   
  app.use(express.static(path.join(__dirname, '/public')));
  app.get('/stream', (request, response) => {
    //response.redirect(camera.url);
  });
  

  // LIGHTS, CAMERA, GHOSTACTION
tessel.led[2].on();

setInterval(() => {
  if (movingGhostAlert && tempGhostAlert) {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
  app.get('/stream', (request, response) => {
    response.redirect(camera.url);
  });
}
}, 100);
