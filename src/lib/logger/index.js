const pino = require("pino");

class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    this.logger = pino({
      transport: {
        target: "pino-pretty",
      },
    });
    Logger.instance = this;
  }
}

const loggerInstance = new Logger();
Object.freeze(loggerInstance);

module.exports = loggerInstance.logger;
