const optionDefinitions = [
	{ name: 'save', 	alias: 's', type: Boolean, defaultValue: true },
	{ name: 'verbose', 	alias: 'v', type: Boolean, defaultValue: false },
	{ name: 'device', 	alias: 'd', type: String,  defaultValue: 'pi' },
	{ name: 'minrssi', 	alias: 'r', type: Number,  defaultValue: -90 },
	{ name: 'period', 	alias: 'p', type: Number,  defaultValue: 60000 }, // one minute
	{ name: 'lat',		type: Number,  defaultValue: -1 },
	{ name: 'lng',		type: Number,  defaultValue: -1 },
]
const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)
const colors = require('colors')
console.log('\nBLE Device Sniffer'.cyan.bold)
for (let [key, value] of Object.entries(options)) {
	console.log(key.yellow + ': ', value.toString().bold)
}
console.log('==============\n'.cyan)
const nobleLib = options.device == 'mac' ? 'noble-mac' : 'noble'
const noble = require(nobleLib)
const fs = require('fs')

const checkInterval = options.period / 2
const recordedFrom = new Date()

var sessionOpen = true
let devices = []

noble.on('discover', (peripheral) => {
	if (peripheral.rssi < options.minrssi) {	return }
	let id = peripheral.id
  	let isNew = !devices[id]

  	if (isNew) {
    	devices[id] = {
    		id: peripheral.id,
    		uuid: peripheral.uuid,
    		address: peripheral.address,
    		addressType: peripheral.addressType,
    		connectable: peripheral.connectable,
    		rssi: peripheral.rssi,
    		// state: peripheral.state,   // not connecting to them anyway
    		localName: peripheral.advertisement.localName,
    		// manufacturerData: peripheral.advertisement.manufacturerData ? peripheral.advertisement.manufacturerData.toString() : '',
    		serviceUuids: peripheral.advertisement.serviceUuids ? peripheral.advertisement.serviceUuids : [],
    		datetime: Date.parse(new Date())
    	}

    	fs.appendFile('data/device-details.json', JSON.stringify(devices[id]) + ',\n', (err) => {
			if (err) throw err
		})

		if (options.verbose) console.log('* Found'.green, id.toString().bold)
  	}
  	devices[id].lastSeen = Date.now()
})

noble.on('stateChange', (state) => {
	if (state === 'poweredOn') {
		noble.startScanning([], true)
	} else {
		noble.stopScanning()
	}
})

let devicesInSession = {}

setInterval(function() {
	let devicesInPeriod = {
		datetime: Date.now(),
		devices: [],
	}

	for (let id in devices) {
		if (devices[id].lastSeen < (Date.now() - options.period)) {
			if (options.verbose) console.log('Lost', id)
			delete devices[id]
		} else {
			devicesInPeriod.devices.push(id)
			devicesInSession[id] = (devicesInSession[id] ? devicesInSession[id] : 0) + checkInterval
		}
	}

	fs.appendFile('data/devices-in-period.json', JSON.stringify(devicesInPeriod) + ',\n', (err) => {
		if (err) throw err
	})

	if (options.verbose) {
		console.log('\u001b[2J\u001b[0;0H')
		console.log('\nBLE Device Sniffer'.cyan.bold)
		console.log('==================='.yellow.bold)
		console.log('Devices found during session\n\n')
		console.log('Device'.bold, '\t\t\t\t', 'Duration'.bold)
		for (let [key, value] of Object.entries(devicesInSession)) {
			console.log(key.yellow, ':', value.toString())
		}
	}

}, checkInterval)

process.stdin.resume()

function exitHandler(exit, exitCode) {
	if (sessionOpen) {
		let recordedTo = new Date() + 0
		let output = []
		for (let [key, value] of Object.entries(devicesInSession)) {
			output.push(['{ "id":"', key, '","duration":', value, '}'].join(''))
		}
		output = ['{ "recorded_from": ', Date.parse(recordedFrom), ', "recorded_to": ', Date.parse(recordedTo), ', "latitude":', options.lat, ', "longitude:"', options.lng, ', "devices": [', output.join(','), ']}\n'].join('')
		fs.appendFileSync('data/devices-in-session.json', output)
		sessionOpen = false
	}
	if (exitCode || exitCode === 0) console.log(exitCode);
	if (exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null))
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, true))
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, true))
process.on('SIGUSR2', exitHandler.bind(null, true))