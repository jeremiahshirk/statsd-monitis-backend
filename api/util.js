function debug() {
	if (global.monitis.debug === true) {
		console.log(arguments);
	}
}

module.exports.debug = debug;