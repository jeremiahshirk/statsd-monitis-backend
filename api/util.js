function debug() {
	if (global.monitis.debug) {
		console.log(arguments);
	}
}

module.exports.debug = debug;