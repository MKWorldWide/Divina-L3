// Quantum Documentation: Logger utility for GameDin L3
// Feature Context: Provides a consistent, extensible logging interface for all backend and service modules.
// Dependency: winston (installed via npm)
// Usage Example:
//   import { Logger } from '../utils/Logger';
//   const logger = new Logger('MyService');
//   logger.info('Service started');
//
// Performance: Winston is highly performant and supports async logging, transports, and log rotation.
// Security: Avoid logging sensitive data. Winston supports log redaction and custom formats.
// Changelog: Initial version for unified logging (2025-07-11)

import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(context: string) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.label({ label: context }),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, label }) => {
          return `[${timestamp}] [${label}] ${level}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string, error?: any) {
    this.logger.error(`${message}${error ? ' ' + (error.stack || error) : ''}`);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
} 