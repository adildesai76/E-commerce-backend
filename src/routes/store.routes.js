import express from "express";

import {
  getStoreBasic,
  getStoreContact,
  getStoreAddress,
  getStoreBusiness,
  getStoreTax,
  getStoreShipping,
  getStoreCurrency,
  getStoreSocialLinks,
  getStoreSeo,
  getStoreMaintenance,
  getStoreReturns,
  getStoreBanners,
} from "../controllers/store.controller.js";

const router = express.Router();

router.get("/basic", getStoreBasic);
router.get("/contact", getStoreContact);
router.get("/address", getStoreAddress);
router.get("/business", getStoreBusiness);
router.get("/tax", getStoreTax);
router.get("/shipping", getStoreShipping);
router.get("/currency", getStoreCurrency);
router.get("/social-links", getStoreSocialLinks);
router.get("/seo", getStoreSeo);
router.get("/maintenance", getStoreMaintenance);
router.get("/returns", getStoreReturns);
router.get("/banners", getStoreBanners);

export default router;