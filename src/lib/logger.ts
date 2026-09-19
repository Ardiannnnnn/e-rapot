/**
 * Logger Library - e-Rapor Kurikulum Merdeka
 * Otomatis menghiraukan (silence) log info dan debug pada environment production.
 * Error dan Warning tetap dicatat demi pemantauan integritas sistem.
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  /**
   * Log standar / debug - diabaikan di production
   */
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },

  /**
   * Log informasi umum - diabaikan di production
   */
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },

  /**
   * Log trace / debug teknis - diabaikan di production
   */
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },

  /**
   * Log peringatan non-fatal - tetap aktif di dev & production
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log error fatal atau exception - tetap aktif di dev & production
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
};

export default logger;
