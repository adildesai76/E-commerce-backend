import express from "express";

import { verifyAdminToken } from "../../middlewares/auth.middleware.js";

import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  blockCustomer,
  unblockCustomer,
} from "../../controllers/admin/customer.controller.js";

const router = express.Router();

/**
 * GET /api/admin/customers
 * List customers
 */
router.get("/", verifyAdminToken, getCustomers);

/**
 * GET /api/admin/customers/:customerId
 * Customer details
 */
router.get("/:customerId", verifyAdminToken, getCustomerById);

/**
 * PATCH /api/admin/customers/:customerId
 * Update customer
 */
router.patch("/:customerId", verifyAdminToken, updateCustomer);

/**
 * PATCH /api/admin/customers/:customerId/block
 * Block customer
 */
router.patch("/:customerId/block", verifyAdminToken, blockCustomer);

/**
 * PATCH /api/admin/customers/:customerId/unblock
 * Unblock customer
 */
router.patch("/:customerId/unblock", verifyAdminToken, unblockCustomer);

export default router;
