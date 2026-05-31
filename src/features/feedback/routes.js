'use strict';

/**
 * Feedback API Routes (spec §2: 3 endpoints)
 * - POST /api/feedback
 * - GET /api/feedback
 * - GET /api/feedback/:id
 *
 * References:
 *   - Specification: 02_specification-20260531-001.md
 *   - Schema: migrations/20260531_001_create_feedback_table.sql
 *
 * All endpoints require authentication (JWT token in Authorization header).
 * User feedback visibility enforced at server-side (user_id filter).
 */

const express = require('express');

const router = express.Router();

/**
 * Mock in-memory database for this MVP implementation.
 * In production, replace with actual database queries.
 */
const feedbackStore = new Map();
let feedbackIdCounter = 1;

/**
 * Helper: Extract user ID from request (mock auth).
 * In production, use JWT middleware to extract from token.
 */
function getUserIdFromRequest(req) {
  // Mock: extract from header or query, default to 'user-1'
  return req.headers['x-user-id'] || req.query.user_id || 'user-1';
}

/**
 * Helper: Validate feedback message.
 * Returns { valid: boolean, errors: string[] }
 */
function validateMessage(message) {
  const errors = [];
  if (!message || typeof message !== 'string') {
    errors.push({ field: 'message', rule: 'required', message: 'Message is required' });
  } else if (message.trim().length === 0) {
    errors.push({ field: 'message', rule: 'required', message: 'Message cannot be empty' });
  } else if (message.length < 1 || message.length > 500) {
    errors.push({
      field: 'message',
      rule: 'length',
      message: 'Message must be between 1 and 500 characters'
    });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Helper: Validate rating (1-5 or null).
 * Returns { valid: boolean, errors: string[] }
 */
function validateRating(rating) {
  const errors = [];
  if (rating !== undefined && rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push({
        field: 'rating',
        rule: 'range',
        message: 'Rating must be between 1 and 5'
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Helper: Validate feedback type (bug|feature|general).
 * Returns { valid: boolean, errors: string[] }
 */
function validateType(type) {
  const errors = [];
  const validTypes = ['bug', 'feature', 'general'];
  if (type !== undefined && type !== null && !validTypes.includes(type)) {
    errors.push({
      field: 'type',
      rule: 'enum',
      message: `Type must be one of: ${validTypes.join(', ')}`
    });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Helper: Validate email format (if provided).
 * Returns { valid: boolean, errors: string[] }
 */
function validateEmail(email) {
  const errors = [];
  if (email !== undefined && email !== null) {
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        rule: 'format',
        message: 'Invalid email format'
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Helper: Perform all validations.
 * Returns { valid: boolean, errors: string[] }
 */
function validateFeedbackInput(body) {
  const allErrors = [];

  const messageValidation = validateMessage(body.message);
  if (!messageValidation.valid) {
    allErrors.push(...messageValidation.errors);
  }

  const ratingValidation = validateRating(body.rating);
  if (!ratingValidation.valid) {
    allErrors.push(...ratingValidation.errors);
  }

  const typeValidation = validateType(body.type);
  if (!typeValidation.valid) {
    allErrors.push(...typeValidation.errors);
  }

  const emailValidation = validateEmail(body.email);
  if (!emailValidation.valid) {
    allErrors.push(...emailValidation.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Helper: Format timestamp in ISO 8601.
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * POST /api/feedback
 * Submit a new feedback from user.
 * Request body: { message, rating?, type?, email? }
 * Response: 201 Created with feedback object, 400 Bad Request if validation fails
 */
router.post('/feedback', (req, res) => {
  const { message, rating, type, email } = req.body;
  const userId = getUserIdFromRequest(req);

  // Validate input
  const validation = validateFeedbackInput({ message, rating, type, email });
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: validation.errors
      },
      timestamp: getTimestamp()
    });
  }

  // Create feedback object
  const feedbackId = `feedback-${feedbackIdCounter++}`;
  const now = getTimestamp();
  const feedback = {
    id: feedbackId,
    user_id: userId,
    message: message.trim(),
    rating: rating || null,
    type: type || 'general',
    email: email || null,
    status: 'new',
    created_at: now,
    updated_at: now
  };

  // Store in mock database
  feedbackStore.set(feedbackId, feedback);

  res.status(201).json({
    success: true,
    data: feedback,
    timestamp: now
  });
});

/**
 * GET /api/feedback
 * List all feedback for authenticated user (with pagination).
 * Query params: page=1, limit=10, status=new|read|responded
 * Response: 200 OK with paginated feedback array and pagination metadata
 */
router.get('/feedback', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const statusFilter = req.query.status;

  // Validate pagination
  if (page < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Page must be >= 1'
      },
      timestamp: getTimestamp()
    });
  }

  // Filter feedback by user_id
  let userFeedback = Array.from(feedbackStore.values()).filter(f => f.user_id === userId);

  // Apply status filter if provided
  if (statusFilter) {
    userFeedback = userFeedback.filter(f => f.status === statusFilter);
  }

  // Sort by created_at DESC (newest first)
  userFeedback.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Apply pagination
  const total = userFeedback.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedFeedback = userFeedback.slice(start, start + limit);

  // Truncate message to 100 chars in list view
  const feedbackList = paginatedFeedback.map(f => ({
    id: f.id,
    user_id: f.user_id,
    message: f.message.substring(0, 100),
    rating: f.rating,
    type: f.type,
    status: f.status,
    created_at: f.created_at
  }));

  res.status(200).json({
    success: true,
    data: feedbackList,
    pagination: {
      page,
      limit,
      total,
      pages
    },
    timestamp: getTimestamp()
  });
});

/**
 * GET /api/feedback/:id
 * Get detailed feedback by ID.
 * Response: 200 OK with full feedback object (not truncated)
 *           404 Not Found if ID doesn't exist
 *           403 Forbidden if feedback belongs to different user
 */
router.get('/feedback/:id', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { id } = req.params;

  // Look up feedback
  const feedback = feedbackStore.get(id);
  if (!feedback) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Feedback with ID ${id} not found`
      },
      timestamp: getTimestamp()
    });
  }

  // Check authorization: user can only access their own feedback
  if (feedback.user_id !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this feedback'
      },
      timestamp: getTimestamp()
    });
  }

  // Return full feedback (message not truncated)
  res.status(200).json({
    success: true,
    data: feedback,
    timestamp: getTimestamp()
  });
});

module.exports = router;
