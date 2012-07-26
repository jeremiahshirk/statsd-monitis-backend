# Monitis Backend for StatsD

## Overview
StatsD is a Node.js daemon that accepts metrics over a simple and lightweight UDP protocol, aggregates those metrics, and sends the results to one or more backend systems for long-term time series data storage, graphing, alerting, etc.  Existing backends included with StatsD support graphite and console output for testing.  Third-party backends exist for Librato, Ganglia, and AMQP. Using statsd-monitis-backend, the same aggregated metrics can be sent to Monitis, with custom monitors automatically created as necessary.

## Requirements

- Node.js
- StatsD, with patches for Raw metrics
- NPM
- Monitis account

## Installation

### Prerequisites

- Install Node.js and NPM (Node Package Manager)

### StatsD

StatsD can be installed via npm, or cloned from GitHub.  Using Git, clone your own local copy of StatsD.

	$ git clone git://github.com/etsy/statsd.git

### Monitis account

Sign up for a Monitis account at <https://www.monitis.com/free_signup.jsp>.  Once signed up, log in at <https://www.monitis.com/login.jsp>.  When you're logged in, you can retrieve API keys under:

- _Tools_ -> _API_ -> _API Key_.

### StatsD configuration

In a new StatsD install, you'll typically copy exampleConfig.js to local.config.  Edit your local.config to use the Monitis backend.  It should have someting like the following:

	{
	  backends: ["statsd-monitis-backend"],
	  flushInterval: 60000,
	  dumpMessages: true,
	  monitis: {
	    apikey: '_your_api_key_',
	    secretkey: '_your_secret_key_'
	  }
	}

## More information

For more information, contact Jeremiah Shirk <jshirk@gmail.com>.