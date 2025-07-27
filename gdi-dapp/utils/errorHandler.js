/**
 * GameDin L3 - Error Handling and Logging
 * 
 * This module provides a centralized error handling and logging system
 * for the GameDin L3 frontend application.
 */

import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Error severity levels
const ERROR_SEVERITY = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug',
};

// Error categories
const ERROR_CATEGORY = {
  AUTH: 'authentication',
  NETWORK: 'network',
  VALIDATION: 'validation',
  RUNTIME: 'runtime',
  BLOCKCHAIN: 'blockchain',
  UI: 'ui',
  API: 'api',
  UNKNOWN: 'unknown',
};

// Error codes
const ERROR_CODES = {
  // Authentication errors (1000-1099)
  AUTH_REQUIRED: 1001,
  AUTH_EXPIRED: 1002,
  AUTH_INVALID: 1003,
  
  // Network errors (2000-2099)
  NETWORK_OFFLINE: 2001,
  NETWORK_TIMEOUT: 2002,
  NETWORK_UNREACHABLE: 2003,
  
  // Validation errors (3000-3099)
  VALIDATION_FAILED: 3001,
  INVALID_INPUT: 3002,
  
  // Blockchain errors (4000-4099)
  TX_REJECTED: 4001,
  TX_FAILED: 4002,
  INSUFFICIENT_FUNDS: 4003,
  WRONG_NETWORK: 4004,
  
  // API errors (5000-5099)
  API_ERROR: 5001,
  NOT_FOUND: 5004,
  RATE_LIMITED: 5029,
  
  // Runtime errors (6000-6099)
  UNEXPECTED_ERROR: 6001,
  NOT_IMPLEMENTED: 6002,
  
  // UI errors (7000-7099)
  COMPONENT_ERROR: 7001,
  
  // External service errors (8000-8099)
  EXTERNAL_SERVICE_ERROR: 8001,
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(
    message,
    {
      code = ERROR_CODES.UNEXPECTED_ERROR,
      category = ERROR_CATEGORY.UNKNOWN,
      severity = ERROR_SEVERITY.ERROR,
      originalError = null,
      context = {},
      report = true,
      showToUser = false,
      userMessage = null,
      tags = {},
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.originalError = originalError;
    this.context = context;
    this.report = report;
    this.showToUser = showToUser;
    this.userMessage = userMessage || message;
    this.timestamp = new Date().toISOString();
    this.id = uuidv4();
    this.tags = tags;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      userMessage: this.userMessage,
      showToUser: this.showToUser,
      tags: this.tags,
    };
  }
}

/**
 * Error handler class
 */
class ErrorHandler {
  constructor() {
    this.initialized = false;
    this.user = null;
  }
  
  /**
   * Initialize error tracking
   */
  init() {
    if (this.initialized) return;
    
    // Initialize Sentry if DSN is provided
    if (config.analytics.sentryDsn) {
      Sentry.init({
        dsn: config.analytics.sentryDsn,
        environment: config.app.environment,
        release: `gamedin-l3@${config.app.version}`,
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // Filter out benign errors
        beforeSend(event, hint) {
          const error = hint.originalException;
          
          // Ignore errors with specific codes
          if (error?.code === 4001) {
            // User rejected the transaction
            return null;
          }
          
          // Ignore network errors when offline
          if (error?.message?.includes('Failed to fetch')) {
            return null;
          }
          
          return event;
        },
      });
      
      // Set user context if available
      if (this.user) {
        Sentry.setUser(this.user);
      }
    }
    
    this.initialized = true;
  }
  
  /**
   * Set the current user for error tracking
   * @param {Object} user - User object with id, email, etc.
   */
  setUser(user) {
    this.user = user;
    
    if (this.initialized && config.analytics.sentryDsn) {
      Sentry.setUser(user);
    }
  }
  
  /**
   * Clear the current user
   */
  clearUser() {
    this.user = null;
    
    if (this.initialized && config.analytics.sentryDsn) {
      Sentry.setUser(null);
    }
  }
  
  /**
   * Handle an error
   * @param {Error|string} error - The error to handle
   * @param {Object} options - Additional options
   */
  handle(error, options = {}) {
    // Ensure we have an Error object
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Extract error information
    const {
      category = ERROR_CATEGORY.UNKNOWN,
      severity = ERROR_SEVERITY.ERROR,
      code = ERROR_CODES.UNEXPECTED_ERROR,
      context = {},
      report = true,
      showToUser = false,
      userMessage = null,
      tags = {},
    } = options;
    
    // Create app error if not already one
    const appError = errorObj instanceof AppError 
      ? errorObj 
      : new AppError(errorObj.message, {
          code,
          category,
          severity,
          originalError: errorObj,
          context,
          report,
          showToUser,
          userMessage: userMessage || errorObj.message,
          tags,
        });
    
    // Log to console in development
    if (!config.app.isProduction || config.features.enableDebug) {
      console.error(appError);
    }
    
    // Report to error tracking service if enabled
    if (report && config.analytics.sentryDsn) {
      this.reportError(appError);
    }
    
    // Show error to user if needed
    if (showToUser) {
      this.showUserError(appError);
    }
    
    return appError;
  }
  
  /**
   * Report an error to the error tracking service
   * @param {AppError} error - The error to report
   */
  reportError(error) {
    if (!this.initialized) {
      this.init();
    }
    
    if (!config.analytics.sentryDsn) return;
    
    const { originalError, context, tags, ...errorData } = error;
    
    // Capture exception in Sentry
    Sentry.withScope((scope) => {
      // Add tags
      scope.setTags({
        category: error.category,
        code: error.code,
        ...tags,
      });
      
      // Add context
      scope.setContext('error', {
        ...errorData,
        stack: error.stack,
      });
      
      if (Object.keys(context).length > 0) {
        scope.setContext('context', context);
      }
      
      // Capture the error
      Sentry.captureException(originalError || error);
    });
  }
  
  /**
   * Show an error message to the user
   * @param {AppError} error - The error to show
   */
  showUserError(error) {
    // In a real app, this would use a toast or modal component
    // For now, we'll just log it
    console.log(`[USER ERROR] ${error.userMessage || error.message}`);
    
    // Example using a toast system
    // import { toast } from 'react-toastify';
    // toast.error(error.userMessage || error.message);
  }
  
  /**
   * Create a boundary error for React error boundaries
   */
  createBoundaryError(error, componentStack) {
    return this.handle(error, {
      category: ERROR_CATEGORY.UI,
      severity: ERROR_SEVERITY.ERROR,
      code: ERROR_CODES.COMPONENT_ERROR,
      context: { componentStack },
      showToUser: true,
      userMessage: 'Something went wrong. Please refresh the page and try again.',
    });
  }
  
  /**
   * Handle API errors
   */
  handleApiError(error, context = {}) {
    let errorMessage = 'An error occurred while processing your request.';
    let errorCode = ERROR_CODES.API_ERROR;
    let showToUser = false;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request';
          errorCode = ERROR_CODES.VALIDATION_FAILED;
          break;
        case 401:
          errorMessage = 'Please log in to continue';
          errorCode = ERROR_CODES.AUTH_REQUIRED;
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          errorCode = ERROR_CODES.AUTH_INVALID;
          break;
        case 404:
          errorMessage = 'The requested resource was not found';
          errorCode = ERROR_CODES.NOT_FOUND;
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          errorCode = ERROR_CODES.RATE_LIMITED;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Our servers are experiencing issues. Please try again later.';
          errorCode = ERROR_CODES.API_ERROR;
          break;
        default:
          errorMessage = data.message || `An error occurred (${status})`;
      }
      
      showToUser = true;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      errorCode = ERROR_CODES.NETWORK_UNREACHABLE;
      showToUser = true;
    }
    
    return this.handle(error, {
      message: errorMessage,
      code: errorCode,
      category: ERROR_CATEGORY.API,
      context: {
        ...context,
        originalError: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      },
      showToUser,
      userMessage: errorMessage,
    });
  }
  
  /**
   * Handle blockchain transaction errors
   */
  handleBlockchainError(error, context = {}) {
    let errorMessage = 'Transaction failed';
    let errorCode = ERROR_CODES.TX_FAILED;
    let showToUser = true;
    
    // Handle common blockchain errors
    if (error.code === 4001) {
      // User rejected the transaction
      errorMessage = 'Transaction was rejected';
      errorCode = ERROR_CODES.TX_REJECTED;
      showToUser = false;
    } else if (error.code === -32603) {
      // Internal JSON-RPC error
      if (error.data?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
        errorCode = ERROR_CODES.INSUFFICIENT_FUNDS;
      } else if (error.data?.message?.includes('wrong network')) {
        errorMessage = 'Please switch to the correct network';
        errorCode = ERROR_CODES.WRONG_NETWORK;
      }
    } else if (error.message?.includes('User denied transaction')) {
      errorMessage = 'Transaction was rejected';
      errorCode = ERROR_CODES.TX_REJECTED;
      showToUser = false;
    }
    
    return this.handle(error, {
      message: errorMessage,
      code: errorCode,
      category: ERROR_CATEGORY.BLOCKCHAIN,
      context: {
        ...context,
        originalError: {
          message: error.message,
          code: error.code,
          data: error.data,
        },
      },
      showToUser,
      userMessage: errorMessage,
    });
  }
}

// Create a singleton instance
const errorHandler = new ErrorHandler();

export {
  errorHandler as default,
  AppError,
  ERROR_SEVERITY,
  ERROR_CATEGORY,
  ERROR_CODES,
};
