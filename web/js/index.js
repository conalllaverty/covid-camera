var bluetoothDevice;
var thermalLevelCharacteristic;

var tempRangeLow = 17.0;
var tempRangeHigh = 37.0;
var tempRange = tempRangeHigh - tempRangeLow;
   
var rawNumbersArray = [];

function onReadBatteryLevelButtonClick() {
  return (bluetoothDevice ? Promise.resolve() : requestDevice())
  .then(connectDeviceAndCacheCharacteristics)
  .then(_ => {
    console.log('Reading thermal level...');
    return thermalLevelCharacteristic.readValue();
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

function requestDevice() {
  console.log('Requesting any Bluetooth Device...');
  return navigator.bluetooth.requestDevice({
   // filters: [...] <- Prefer filters to save energy & show relevant devices.
    acceptAllDevices: true,
    optionalServices: ['fa860f46-42cb-4509-a234-57e7aa12d1e2']})
.then(device => {
    bluetoothDevice = device;
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    console.log("connectDeviceAndCacheCharacteristics");
    connectDeviceAndCacheCharacteristics();
})
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

function connectDeviceAndCacheCharacteristics() {
  if (bluetoothDevice.gatt.connected && thermalLevelCharacteristic) {
    return Promise.resolve();
  }

  console.log('Connecting to GATT Server...');
  return bluetoothDevice.gatt.connect()
  .then(server => {
    console.log('Getting thermal service...');
    return server.getPrimaryService('fa860f46-42cb-4509-a234-57e7aa12d1e2');
  })
  .then(service => {
    console.log('Getting thermal characteristic...');
    return service.getCharacteristic('0ec3e1a7-9e07-4c7c-b1d9-8bab39cb2c43');
  })
  .then(characteristic => {
    thermalLevelCharacteristic = characteristic;
    console.log(characteristic);
    thermalLevelCharacteristic.addEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    console.log("Starting notifications."); 
    startNotifications();
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

function startNotifications() {
  console.log('Starting thermal level notifications...');
  thermalLevelCharacteristic.startNotifications()
  .then(_ => {
    console.log('Notifications started');
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
function handleCharacteristicValueChanged(event) {
    var enc = new TextDecoder("utf-8");
    var arr = event.target.value.buffer;
    var encodedString = enc.decode(arr);
    // console.log(encodedString);
    var splitStr = encodedString.split(':');

    // Get the rows  
    var firstRowNumber = parseInt(splitStr[0]) * 3;
    var secondRowNumber = firstRowNumber + 1;
    var thirdRowNumber = firstRowNumber + 2;
    // console.log(`FIRST: ${firstRowNumber}   SECOND: ${secondRowNumber}`);

    var dataArr = splitStr[1].split(',');
    // console.log(`---- DATA SPLIT LENGTH  ${dataArr.length}  -----`);

    drawRow(firstRowNumber, dataArr);
    drawRow(secondRowNumber, dataArr);
    drawRow(thirdRowNumber, dataArr);
}

function drawRow(rowNumber, dataArr) {
    // Get the row
    var rowQuery = `tr:eq(${rowNumber})`;
    var row = $( "#pixel-table" ).find(rowQuery);
    var arrayBase = 0;

    if (rowNumber % 3) {
        arrayBase = 64;
    } else if (rowNumber % 2) {
        arrayBase = 32;
    }

    // console.log(`${row}  base: ${arrayBase}`);

    for (var i=0;i<dataArr.length;i++) {
        var item = row.find(`td:eq(${i})`);
        var content = item.find(".content");
        var tempNum = parseFloat(dataArr[arrayBase + i]) / 10;
        if (isNaN(tempNum)){
            return;
        }
        rawNumbersArray[rowNumber + i] = tempNum;
        var tempDiff = tempNum - tempRangeLow;
        var tempPercent = Math.min((tempDiff / tempRange), 1).toFixed(4);

        var red = (255 * tempPercent).toFixed(0);
        var green;
        if (tempPercent > 0.5) {
            green = (255 * (tempPercent - 0.5)).toFixed(0);
        } else {
            green = (255 * tempPercent).toFixed(0);
        }
        var blue = (255 * Math.abs((1 - tempPercent))).toFixed(0)
    
        var backgroundColorValue = "rgb(" + red + "," + green + "," + blue + ")";
        // console.log(`Row: ${rowNumber}  Column: ${i}     Temp: ${tempNum}   Percent: ${tempPercent}    RGB: ${backgroundColorValue}`);
        content.css("background-color", backgroundColorValue);
    };
}

function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

function onDisconnected() {
  console.log('Bluetooth Device disconnected');
  connectDeviceAndCacheCharacteristics()
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

function onStartNotificationsButtonClick() {
    console.log('Starting thermal level Notifications...');
    requestDevice();
  }

document.querySelector('#startNotifications').addEventListener('click', function(event) {
    // if (isWebBluetoothEnabled()) {
        onStartNotificationsButtonClick();
    // }
});

setInterval(function() {
    var tempNum = 0.0;
    // Store all data in array and move to separate timer function
    var highTemp = 0;
    var lowTemp = 100;

    for (var i=0;i<rawNumbersArray.length;i++) {
        tempNum = rawNumbersArray[i];
        if (tempNum > highTemp) {
            highTemp = tempNum;
        }
        if (tempNum < lowTemp) {
            lowTemp = tempNum;
        }
    }

    console.log(`HIGH TEMP: ${highTemp}   LOW TEMP: ${lowTemp}`);
    $( "#high-temp" ).text(highTemp);
    $( "#low-temp" ).text(lowTemp);
}, 2500);