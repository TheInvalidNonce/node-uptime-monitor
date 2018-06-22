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
      callback('OUTAGE')
    }
  }
  )
}

const pingInterval = 5*1000*60 // 5 minute interval
let serviceStatus = {}

services.forEach( service => {

  serviceStatus[service.url] = {
    status: 'OPERATIONAL', // initialize all services as operational when we start
    responseTimes: [], // array containing the responses times for last 3 pings
    timeout: service.timeout, // load up the timeout from the config 
  }

  setInterval( () => {
    pingService(service.url, serviceResponse => {
      if (serviceResponse === 'OUTAGE' && serviceStatus[service.url].status !== 'OUTAGE') {
        // only update and post to Slack on state change
        serviceStatus[service.url].status = 'OUTAGE'
        postToSlack(service.url)
      }
      else {
        let responseTimes = serviceStatus[service.url].responseTimes
        responseTimes.push(serviceResponse)
      }

      // check degraded performance if we have 3 responses so we can average them

      if (responseTimes.length > 3) {
      // remove the oldest response time from the beginning of array
        responseTimes.shift()

      // compute average of last 3 response times
      let avgRespTime = responseTimes.reduce( (a, b) => a + b, 0 ) / responseTimes.length
      let currService = serviceStatus[service.url]
      
      if (avgResTime > currService.timeout && currService.status !== 'DEGRADED') {
        currService.status = 'DEGRADED'
        postToSlack(service.url)
      } 
      else if (avgResTime < currService.timeout && currService.status !== 'OPERATIONAL') {
        currService.status = 'OPERATIONAL'
        postToSlack(service.url)
        }
      }

    })

  }, pingInterval)
})

