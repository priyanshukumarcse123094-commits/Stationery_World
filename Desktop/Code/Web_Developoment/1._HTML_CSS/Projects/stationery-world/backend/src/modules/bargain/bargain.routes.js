const express = require('express');
const router = express.Router();
const {
  getBargainEligibility,
  getBargainConfig,
  getBargainAttempts,
  makeBargainAttempt,
  setBargainConfig,
  getBargainAnalytics,
  grantBargainPermission,
  revokeBargainPermission
} = require('./bargain.controller');
const { authMiddleware, adminMiddleware } = require('../user/user.middleware');
const { bargainRateLimiter, attemptValidator } = require('./bargain.middleware');

// =============================================================================
// PUBLIC ROUTES (Customer)
// =============================================================================

// Check eligibility (can be called by guests or logged-in users)
router.get('/eligibility/:productId', getBargainEligibility);

// Get bargain configuration
router.get('/config/:productId', getBargainConfig);

// Get user's attempts (requires auth)
router.get('/attempts/:productId', authMiddleware, getBargainAttempts);

// Make bargain attempt (requires auth + rate limiting + validation)
router.post(
  '/attempt',
  authMiddleware,
  bargainRateLimiter,
  attemptValidator,
  makeBargainAttempt
);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Set/update bargain configuration
router.post(
  '/config/:productId',
  authMiddleware,
  adminMiddleware,
  setBargainConfig
);

// Get bargain analytics
router.get(
  '/admin/analytics/:productId',
  authMiddleware,
  adminMiddleware,
  getBargainAnalytics
);

// Grant special bargain permission to a customer for a product
router.post(
  '/admin/permission',
  authMiddleware,
  adminMiddleware,
  grantBargainPermission
);

// Revoke previously granted permission
router.delete(
  '/admin/permission',
  authMiddleware,
  adminMiddleware,
  revokeBargainPermission
);

module.exports = router;