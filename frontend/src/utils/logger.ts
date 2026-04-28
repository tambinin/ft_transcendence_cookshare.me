const noop = (..._args: any[]): void => {};

const logger = {
	log: noop,
	warn: noop,
	error: noop,
	info: noop,
	debug: noop,
};

export default logger;
