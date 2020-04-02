# Contactless Covid Camera
> Health services and staff around the world are struggling to measure
> a patient's body and head temperature without making some form of
> contact. This project intends to provide a low-cost solution to
> build out a contactless thermal camera using the Melexis MLX90640
> and ESP32 (Wia Dot One in the video) connected over I2C.

View on YouTube [here](https://youtu.be/yu9xXQP38FY)

![](https://img.youtube.com/vi/yu9xXQP38FY/0.jpg)

## Installation & Development setup

On ESP32, connect `pin 21 to SDA` and `pin 22 to SCL`.

To run the device code, the Arduino IDE is required. You can download it [here](https://www.arduino.cc/en/main/software). Once installed, support for ESP32 will need to be added. Steps to do that can be seen [here](https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/).

To run the web code, drag `index.html` into a Chrome browser or host on a web server of your choice.

## Meta

Conall Laverty ([@ConallLaverty](https://twitter.com/ConallLaverty))

Distributed under the MIT license. See ``LICENSE`` for more information.

[https://github.com/conalllaverty/covid-camera](https://github.com/conalllaverty/)

## Contributing

1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request