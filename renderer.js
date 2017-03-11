// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport');

serialport.list((err, ports) => {
  console.log('ports', ports);
  if (err) {
    document.getElementById('error').textContent = err.message;
    return;
  } else {
    document.getElementById('error').textContent = '';
  }

  if (ports.length === 0) {
    document.getElementById('error').textContent = 'No ports discovered';
  }

  const headers = Object.keys(ports[0]);
  const table = createTable(headers);
  tableHTML = '';
  table.on('data', data => tableHTML += data);
  table.on('end', () => document.getElementById('ports').innerHTML = tableHTML);
  ports.forEach(port => table.write(port));
  table.end();
});




function handleDataEvent(name, value) {
  const tcFaults = {
    0 : "No faults",
    1 : "No connection",
    2 : "Short to ground",
    3 : "Short to VCC"
  };

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
  */
  const dataEventHandlers = {
    a : function(data) {
          // a  Pot thermocouple faults
          if ((typeof data === "number") && (data >= 0) && (data < 4)) {
            $('#potTCFaults').text(tcFaults[data]);
          }
        },
    b : function(data) {
          // b  Pot Temp, Actual (˚F)
          if (typeof data === "number") {
            $('#potTempActual').text(data);
          }
        },
    c : function(data) {
          // c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
          if (typeof data === "number") {
            if ((data >= 0) && (data < 90)) {
              $('damperAngleActual').text(data);
            } else if (data === -1) {
              $('#damperAngleActual').text("---");
            }
          }
        },
    d : function(data) {
          // d  Damper Control Mode (0 = Manual, 1 = Auto)
          if (data === 0) {
            $( "#damperManualCntl" ).prop( "checked", true);
          } else if (data === 1) {
            $( "#damperAutoCntl" ).prop( "checked", true);
          }
        },
    e : function(data) {
          // e  Motor is Homed (0 = No, 1 = Yes)
          if (data === 0) {
            $( "#damperMotorIsHomed" ).text("No");
          } else if (data === 1) {
            $( "#damperMotorIsHomed" ).text("Yes");
          } else {
            $( "#damperMotorIsHomed" ).text("---");
          }
        },
    f : function(data) {
          // f  Motor position (-1 = motor not homed, 0 - 199)
          if (typeof data === "number") {
            if ((data >= 0) && (data < 199)) {
              $('#damperMotorPos').text(data);
            } else if (data === -1) {
              $('#damperMotorPos').text("Not Homed");
            }
          }
        },
    g : function(data) {
          // g  Flue thermocouple faults
          if ((typeof data === "number") && (data >= 0) && (data < 4)) {
            $('#flueTCFault').text(tcFaults[data]);
          }
        },
    h : function(data) {
          // h  Flue Temp (˚F)
          if (typeof data === "number") {
            $('#flueTempActual').text(data);
          }
        },
    i : function(data) {
          // i  Fan speed, Actual (-1 = unavailable, 0 - ??? = speed in RPM)
          if (typeof data === "number") {
            if ((data >= 0) && (data <= 100)) {
              $('#blowerSpeedActual').text(data);
            } else if (data === -1) {
              $('#blowerSpeedActual').text("---");
            }
          }
        },
    j : function(data) {
          // j  Blower Control Mode (0 = Manual, 1 = Auto)
          if (data === 0) {
            $( "#blowerManualCntl" ).prop( "checked", true);
          } else if (data === 1) {
            $( "#blowerAutoCntl" ).prop( "checked", true);
          }
        },
    k : function(data) {
          // k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)
          if (typeof data === "number") {
            if ((data >= 0) && (data <= 100)) {
              $('#blowerCommandSpeed').text(data);
            } else if (data === -1) {
              $('#blowerCommandSpeed').text("---");
            }
          }
        }
  };

  const handlerKeysArray = Object.keys(dataEventHandlers);
  if (handlerKeysArray.includes(name)) {
    dataEventHandlers[name](value);
  }

}

function initSocketIO() {
	// iosocket = io.connect();
	// iosocket = io('ws://localhost:1337', {transports: ['websocket']});
	// iosocket = io('http://127.0.0.1:1337');
	// iosocket = io('http://localhost:1337');
	// iosocket.on('onconnection', function(value) {
  //   console.log("SocketIO onconnection event");
  // });

	// Process data received from rocket stove controller
	iosocket.on('update', function (receivedData) {
    // Modify the UI with new data
    for (let datalette in receivedData) {
      console.log("  receivedData." + datalette + " = " + receivedData[datalette]);
      // console.log("  receivedData." + datalette + " = " + receivedData[datalette]);

      // Call the <datalette> event handler with the received data
      handleDataEvent(datalette, receivedData[datalette]);
    }
	});

	// Process message from server
	iosocket.on('controllerConnected', function (value) {
      // isControllerConnected = value;

      const result = value ? "" : "NOT ";
      console.log("Stove controller is " + result + "connected.");

      $('#controllerIsConnected p').text(`The stove controller is ${result} connected.`);
	});

	// Process warning from server
	// iosocket.on('warning', function (warningMsg) {
    // Process warning message
	// });

	// iosocket.on('disconnect', function (receivedData) {
  //   console.log("SocketIO disconnect event");
  //
  //   // Modify UI to indicate that the server and stove controller are disconnected
  //   $('#controllerIsConnected p').text("The server and stove controller are NOT connected.");
  // });
}

function initUI() {

  // Init Home Motor button
  $( "#homeMotorBtn" ).button();
  $( '#homeMotorBtn' ).on( "click", function(event) {
    iosocket.emit('homeMotorBtnClicked');
  });

  // Initialize the values of the text inputs
  $( "#potTempDesired" ).val(0);
  $( "#damperAngleManual" ).val(0);
  $( "#blowerSpeedManual" ).val(0);
  $( "#dataUpdateRateInput" ).val(5);

  // Init the desired pot temperature input and slider event handlers
  $( '#potTempDesired' ).on( "change", function(event, ui) {
      const value = Math.floor( $("#potTempDesired").val() );

      console.log("potTempDesired change event: value = " + value);
      $( "#potTempSlider" ).slider( "value", value);
  });

  $( "#potTempSlider" ).slider({
    min : 0,
    max : 212,
    value : 0,
    change: function(event, ui) {
        console.log("potTempSlider change event");
        iosocket.emit('potTempDesiredChanged', ui.value);
        $( "#potTempDesired" ).val(ui.value);
    }
  });

  // Init the damper angle input and slider event handlers
  $( '#damperAngleManual' ).change(function(event, ui) {
      const value = Math.floor( $("#damperAngleManual").val() );
      console.log("damperAngleManual change event: value = " + value);
      $( "#damperAngleSlider" ).slider( "value", value);
  });

  $( "#damperAngleSlider" ).slider({
    min : 0,
    max : 90,
    value : 0,
    change: function(event, ui) {
        console.log("damperAngleSlider change event");
        iosocket.emit('damperAngleChanged', ui.value);
        $( "#damperAngleManual" ).val(ui.value);
      }
  });

  // Init the desired blower speed input and slider event handlers
  $( "#blowerSpeedManual" ).change(function(event) {
      const value = Math.floor( $("#blowerSpeedManual").val() );
      console.log("blowerSpeedManual change event: value = " + value);
      $( "#blowerSpeedSlider" ).slider( "value", value);
  });

  $( "#blowerSpeedSlider" ).slider({
    min : 0,
    max : 100,
    value : 0,
    change: function(event, ui) {
      console.log("blowerSpeedSlider change event");
      iosocket.emit('blowerSpeedChanged', ui.value);
      $( "#blowerSpeedManual" ).val(ui.value);
    }
  });

  // Init the dataUpateRate input handler
  $( "#dataUpdateRateInput" ).change(function(event) {
      const value = Math.floor( $("#dataUpdateRateInput").val() );
      console.log("dataUpdateRateInput change event: value = " + value);
     iosocket.emit('dataUpdateRateChanged', value);
  });
}
