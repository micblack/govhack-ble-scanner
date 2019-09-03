# govhack-ble-scanner
Simple BLE scanning device to record devices within the area for MacOS and Raspberry Pi 3+
## Installation
```
npm install
```
*Important: this project uses [Noble](https://github.com/noble/noble), and seems to have node-gyp compiler errors on later versions of node. I have been able to get this to work on v8.11.1 in the root installation. This is because to access BLE the process must be run as sudo when on Raspbian*
## Run on MacOS
```
node index.js -d mac
```
## Run on Raspbian
```
sudo node index.js
```
## Command line parameters
| flag      | alias | default |                                                              |
|-----------|-------|---------|--------------------------------------------------------------|
| --save    | -s    | true    | Saves to JSON file                                           |
| --verbose | -v    | false   | Writes diagnostic information to the terminal window         |
| --device  | -d    | "pi"    | Use *mac* for MacOS library, or leave blank for Pi or others |
| --minrssi | -r    | -90     | Minimum RSSI strength to register device                     |
| --period  | -p    | 60000   | Time in milliseconds to aggregate BLE visible duration       |
| --lat     |       | -1      | Latitude of the device                                       |
| --lng     |       | -1      | Longitude of the device                                      |
## File outputs
JSON file outputs can be found in the /data folder

1. *devices-in-session.json* shows the duration and unique devices found since starting and stopping the service
2. *devices-in-period.json* shows the ID of the devices found each polling period
3. *device-details.json* full details of the devices found as they are found (likely to contain duplicates)