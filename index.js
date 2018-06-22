// load the variables from the .env file
require('dotenv').config()

const request = require('request')

// list of services to monitor
const services = require('./services.js') 

// take a url and cb (callback) as parameters
// use the request library to make a GET request to the specified url
// return the response time computed by the request library or an OUTAGE status if the response is not a 200

const pingService = (url, callback) => {
  request({
    method: 'GET',
    uri: url,
    time: true,
  }, (err, resp, body) => {
    if (!err && resp.statusCode === 200) {
      // we'll use the time from the point we try to establish a connection with
      // the service until the first byte is received
      callback(resp.timingPhases.firstByte)
    }
    else {
      callback('OUTAGE!!!')
    }
  }
  )
}

