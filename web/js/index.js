'use strict';

// Constants
const TEMP_RANGE_LOW = 17.0;
const TEMP_RANGE_HIGH = 37.0;
const TEMP_RANGE = TEMP_RANGE_HIGH - TEMP_RANGE_LOW;

const BLE_PRIMARY_SERVICE = "fa860f46-42cb-4509-a234-57e7aa12d1e2";
const BLE_THERMAL_CAMERA_CHARACTERISTIC = "0ec3e1a7-9e07-4c7c-b1d9-8bab39cb2c43";
const BLE_PAGE_SIZE = 32;

// Variables
let bluetoothDevice;
let thermalLevelCharacteristic;

let rawNumbersArray = [];

function requestDevice () {
    console.log("Requesting any Bluetooth Device...");

    return navigator.bluetooth.requestDevice({
        // "filters": [
        //     {"services": [BLE_PRIMARY_SERVICE]}
        // ],
        "optionalServices": [BLE_PRIMARY_SERVICE],
        "acceptAllDevices": true
    }).
    then((device) => {
        bluetoothDevice = device;
        bluetoothDevice.addEventListener("gattserverdisconnected", onDisconnected);
        console.log("connectDeviceAndCacheCharacteristics");
        connectDeviceAndCacheCharacteristics();
    }).
    catch((error) => {
        console.log(`Argh! ${error}`);
    });
}

function connectDeviceAndCacheCharacteristics () {
    if (bluetoothDevice.gatt.connected && thermalLevelCharacteristic) {
        return Promise.resolve();
    }

    console.log("Connecting to GATT Server...");

    return bluetoothDevice.gatt.connect().
        then((server) => {
            console.log("Getting thermal service...");
            return server.getPrimaryService(BLE_PRIMARY_SERVICE);
        }).
        then((service) => {
            console.log("Getting thermal characteristic...");
            return service.getCharacteristic(BLE_THERMAL_CAMERA_CHARACTERISTIC);
        }).
        then((characteristic) => {
            thermalLevelCharacteristic = characteristic;
            thermalLevelCharacteristic.addEventListener(
                "characteristicvaluechanged",
                handleCharacteristicValueChanged
            );
            console.log("Starting notifications.");
            startNotifications();
        }).
        catch((error) => {
            console.log(`Argh! ${error}`);
        });
}

function startNotifications () {
    console.log("Starting thermal level notifications...");
    thermalLevelCharacteristic.startNotifications().
        then((_) => {
            console.log("Notifications started");
        }).
        catch((error) => {
            console.log(`Argh! ${error}`);
        });
}

function onDisconnected () {s
    console.log("Bluetooth Device disconnected");
    connectDeviceAndCacheCharacteristics().
        catch((error) => {
            console.log(`Argh! ${error}`);
        });
}

document.querySelector("#startNotifications").addEventListener("click", (event) => {
    console.log("Starting thermal level Notifications...");
    requestDevice();
});

// Draw new values on row
function drawRow (rowNumber, dataArr) {
    // Get the row
    let rowQuery = `tr:eq(${rowNumber})`,
        row = $("#pixel-table").find(rowQuery),
        arrayBase = 0;

    if (rowNumber % 3) {
        arrayBase = BLE_PAGE_SIZE * 2;
    } else if (rowNumber % 2) {
        arrayBase = BLE_PAGE_SIZE;
    }

    let item, content, tempNum, tempDiff, tempPercent;
    let red, green, blue, backgroundColorValue;
    
    for (let i = 0; i < dataArr.length; i++) {
        item = row.find(`td:eq(${i})`);
        content = item.find(".content");
        tempNum = parseFloat(dataArr[arrayBase + i]) / 10;

        if (isNaN(tempNum)) {
            return;
        }

        rawNumbersArray[rowNumber + i] = tempNum;

        tempDiff = tempNum - TEMP_RANGE_LOW;
        tempPercent = Math.min(tempDiff / TEMP_RANGE, 1).toFixed(4);

        red = (255 * tempPercent).toFixed(0);
        if (tempPercent > 0.5) {
            green = (255 * (tempPercent - 0.5)).toFixed(0);
        } else {
            green = (255 * tempPercent).toFixed(0);
        }
        blue = (255 * Math.abs(1 - tempPercent)).toFixed(0);

        backgroundColorValue = `rgb(${red},${green},${blue})`;
        // Console.log(`Row: ${rowNumber}  Column: ${i}     Temp: ${tempNum}   Percent: ${tempPercent}    RGB: ${backgroundColorValue}`);

        content.css("background-color", backgroundColorValue);
    }
}

function handleCharacteristicValueChanged (event) {
    const enc = new TextDecoder("utf-8");
    const arr = event.target.value.buffer;
    const encodedString = enc.decode(arr);
    const splitStr = encodedString.split(":");

    // Get the rows
    const firstRowNumber = parseInt(splitStr[0]) * 3;
    const secondRowNumber = firstRowNumber + 1;
    const thirdRowNumber = firstRowNumber + 2;

    const  dataArr = splitStr[1].split(",");

    drawRow(firstRowNumber, dataArr);
    drawRow(secondRowNumber, dataArr);
    drawRow(thirdRowNumber, dataArr);
}

// Run this every x (default: 2500) milliseconds to update the high.
// low and average temperatures
setInterval(() => {
    let avgTemp = 0.0;
    let highTemp = 0;
    let lowTemp = 100;
    let tempNum = 0.0;
    let totalTemp = 0.0;

    for (let i = 0; i < rawNumbersArray.length; i++) {
    tempNum = rawNumbersArray[i];

    if (tempNum > highTemp) {
        highTemp = tempNum;
    }
    if (tempNum < lowTemp) {
        lowTemp = tempNum;
    }

    totalTemp += tempNum;
    }

    avgTemp = totalTemp / rawNumbersArray.length;

    // console.log(`HIGH TEMP: ${highTemp}   LOW TEMP: ${lowTemp}   AVG TEMP: ${avgTemp}`);

    $("#high-temp").text(highTemp);
    $("#low-temp").text(lowTemp);
    $("#avg-temp").text(avgTemp.toFixed(1));
}, 2500);
