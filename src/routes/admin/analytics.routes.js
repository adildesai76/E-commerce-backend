import express from "express";

import {
  getSalesSummary,
  getPaymentAnalytics,
  getOrderStatusAnalytics,
  getRefundAnalytics,
  getDiscountAnalytics,
  getCategoryRevenueAnalytics,
  getSalesAnalytics,
} from "../../controllers/admin/analytics/sales.controller.js";

import { verifyAdminToken } from "../../middlewares/auth.middleware.js";
import {
  getLeastSellingProducts,
  getProductSummary,
  getProfitByProduct,
  getRevenueByProduct,
  getTopSellingProducts,
} from "../../controllers/admin/analytics/products.controller.js";
import {
  getCustomerOrderFrequency,
  getCustomerRegistrationTrend,
  getCustomerSummary,
  getFavoriteCategories,
  getRepeatVsNewCustomers,
  getTopCustomers,
} from "../../controllers/admin/analytics/customers.controller.js";
import {
  getCampaignPerformance,
  getInfluencerPerformance,
  getMarketingChannels,
  getMarketingMediumPerformance,
  getMarketingOverview,
} from "../../controllers/admin/analytics/marketing.controller.js";

const router = express.Router();

// Sales Analytics Summary
router.get("/sales/summary", verifyAdminToken, getSalesSummary);
router.get("/sales/payment-methods", verifyAdminToken, getPaymentAnalytics);
router.get("/sales/order-status", verifyAdminToken, getOrderStatusAnalytics);
router.get("/sales/refunds", verifyAdminToken, getRefundAnalytics);
router.get("/sales/discounts", verifyAdminToken, getDiscountAnalytics);
router.get("/sales/categories", verifyAdminToken, getCategoryRevenueAnalytics);
router.get("/sales/salesanalytics", verifyAdminToken, getSalesAnalytics);

//Product Analytics
router.get("/products/summary", verifyAdminToken, getProductSummary);
router.get("/products/top-selling", verifyAdminToken, getTopSellingProducts);
router.get(
  "/products/least-selling",
  verifyAdminToken,
  getLeastSellingProducts,
);
router.get("/products/revenue", verifyAdminToken, getRevenueByProduct);
router.get("/products/profit", verifyAdminToken, getProfitByProduct);

//Customer Analytics
router.get("/customers/summary", verifyAdminToken, getCustomerSummary);
router.get("/customers/top-customers", verifyAdminToken, getTopCustomers);
router.get("/customers/trend", verifyAdminToken, getCustomerRegistrationTrend);
router.get(
  "/customers/repeat-vs-new",
  verifyAdminToken,
  getRepeatVsNewCustomers,
);
router.get(
  "/customers/order-frequency",
  verifyAdminToken,
  getCustomerOrderFrequency,
);
router.get(
  "/customers/favorite-categories",
  verifyAdminToken,
  getFavoriteCategories,
);

//Marketing Analytics
router.get("/marketing/overview", verifyAdminToken, getMarketingOverview);
router.get("/marketing/channels", verifyAdminToken, getMarketingChannels);

router.get("/marketing/campaigns", verifyAdminToken, getCampaignPerformance);

router.get(
  "/marketing/mediums",
  verifyAdminToken,
  getMarketingMediumPerformance,
);

router.get(
  "/marketing/influencers",
  verifyAdminToken,
  getInfluencerPerformance,
);
export default router;
