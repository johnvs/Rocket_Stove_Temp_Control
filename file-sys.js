"use strict";

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'stoveData.csv');
// const fields = [ 'Pot Temp Actual', 'Pot Temp Desired', 'Damper Angle Actual', 'Damper Control Mode',
//                  'Flue Temp', 'Blower Speed Desired (%)', 'Blower Speed Actual (RPM)', 'Blower Control Mode' ];

/*
  Data packet message format
  a  Pot Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
  b  Pot Temp, Actual (˚F)
  c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
  d  Damper Control Mode (0 = Manual, 1 = Auto)
  e  Motor is Homed (0 = No, 1 = Yes)
  f  Motor position (-1 = motor not homed, 0 - 199)
  g  Flue Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
  h  Flue Temp (˚F)
  i  Fan speed, Actual (RPM)
  j  Blower Control Mode (0 = Manual, 1 = Auto)
  k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)

  example data packet:
   '{a:<data>, b:<data>, c:<data>, d:<data>, e:<data>, f:<data>, g:<data>, h:<data>, i:<data>, j:<data>, k:<data>}'

  Real (from Teensy):
    {"a":0, "b":63.95, "c":-1, "d":0, "e":0, "f":255, "g":0, "h":63.95, "i":-1, "j":0, "k":-1}

  Data to write to file:         Source    Key
  	Pot Temp, Actual              SC       b
  	Pot Temp, Desired             UI         a
  	Damper Angle                  SC       c
  	Damper control mode           UI         b

  	Flue Temp                     SC       h
  	Blower speed, Desired (%)     UI         c
  	Blower speed, Actual (RPM)    SC       i
  	Blower control mode           UI         d

  Input:
    {"a":0, "b":63.95, "c":-1, "d":0, "e":0, "f":255, "g":0, "h":63.95, "i":-1, "j":0, "k":-1}

  Output:
    "Pot Temp Actual","Pot Temp Desired","Damper Angle","Damper control mode","Flue Temp","Blower Speed Desired","Blower speed Actual","Blower control mode"
    "63.95,90.0,45.5,1,1200.0,75.0,875.0,0"

*/
const columnHdrs = '"Pot Temp Actual","Pot Temp Desired","Damper Angle","Damper control mode",' +
                   '"Flue Temp","Blower Speed Desired","Blower speed Actual","Blower control mode"\n';

function write(dataStr) {

  fs.appendFile(dataFile, dataStr, (err) => {
    if (err) {
      console.log('file-sys:appendFile error: ' + err + ', data: ' + dataStr);
    } else {
      console.log('data ' + dataStr + 'was written to file ' + dataFile);
    }
  });

}

function initFile() {
  write(columnHdrs);
}

exports.writeData = write;
exports.init = initFile;
