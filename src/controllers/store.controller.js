import AdminStore from "../models/AdminSetting.js";

/**
 * ------------------------------------------------------------------
 * GET BASIC STORE INFORMATION
 * GET /api/store/basic
 * ------------------------------------------------------------------
 */
export const getStoreBasic = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("storeName description logo")
      .lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store settings not found.",
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("Get Store Basic Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store information.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET CONTACT INFORMATION
 * GET /api/store/contact
 * ------------------------------------------------------------------
 */
export const getStoreContact = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("contact")
      .lean();

    return res.status(200).json({
      success: true,
      contact: store?.contact || {},
    });
  } catch (error) {
    console.error("Get Store Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact information.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET BUSINESS ADDRESS
 * GET /api/store/address
 * ------------------------------------------------------------------
 */
export const getStoreAddress = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("address")
      .lean();

    return res.status(200).json({
      success: true,
      address: store?.address || {},
    });
  } catch (error) {
    console.error("Get Store Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store address.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET BUSINESS INFORMATION
 * GET /api/store/business
 * ------------------------------------------------------------------
 */
export const getStoreBusiness = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("business")
      .lean();

    return res.status(200).json({
      success: true,
      business: store?.business || {},
    });
  } catch (error) {
    console.error("Get Store Business Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch business information.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET TAX SETTINGS
 * GET /api/store/tax
 * ------------------------------------------------------------------
 */
export const getStoreTax = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("tax")
      .lean();

    return res.status(200).json({
      success: true,
      tax: store?.tax || {},
    });
  } catch (error) {
    console.error("Get Store Tax Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tax settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET SHIPPING SETTINGS
 * GET /api/store/shipping
 * ------------------------------------------------------------------
 */
export const getStoreShipping = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("shipping")
      .lean();

    return res.status(200).json({
      success: true,
      shipping: store?.shipping || {},
    });
  } catch (error) {
    console.error("Get Store Shipping Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipping settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET CURRENCY AND TIMEZONE
 * GET /api/store/currency
 * ------------------------------------------------------------------
 */
export const getStoreCurrency = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("currency timezone")
      .lean();

    return res.status(200).json({
      success: true,
      currency: store?.currency || {},
      timezone: store?.timezone || "",
    });
  } catch (error) {
    console.error("Get Store Currency Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch currency settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET SOCIAL LINKS
 * GET /api/store/social-links
 * ------------------------------------------------------------------
 */
export const getStoreSocialLinks = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("socialLinks")
      .lean();

    return res.status(200).json({
      success: true,
      socialLinks: store?.socialLinks || {},
    });
  } catch (error) {
    console.error("Get Store Social Links Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch social links.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET SEO SETTINGS
 * GET /api/store/seo
 * ------------------------------------------------------------------
 */
export const getStoreSeo = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("seo")
      .lean();

    return res.status(200).json({
      success: true,
      seo: store?.seo || {},
    });
  } catch (error) {
    console.error("Get Store SEO Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch SEO settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET MAINTENANCE STATUS
 * GET /api/store/maintenance
 * ------------------------------------------------------------------
 */
export const getStoreMaintenance = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("maintenance acceptOrders")
      .lean();

    return res.status(200).json({
      success: true,
      maintenance: store?.maintenance || {},
      acceptOrders: store?.acceptOrders ?? true,
    });
  } catch (error) {
    console.error("Get Store Maintenance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance status.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET RETURN SETTINGS
 * GET /api/store/returns
 * ------------------------------------------------------------------
 */
export const getStoreReturns = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("returns")
      .lean();

    return res.status(200).json({
      success: true,
      returns: store?.returns || {},
    });
  } catch (error) {
    console.error("Get Store Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch return settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * GET ACTIVE BANNERS
 * GET /api/store/banners
 * ------------------------------------------------------------------
 */
export const getStoreBanners = async (req, res) => {
  try {
    const store = await AdminStore.findOne()
      .select("banners")
      .lean();

    const banners = (store?.banners || [])
      .filter((banner) => banner.active)
      .sort((a, b) => a.order - b.order);

    return res.status(200).json({
      success: true,
      banners,
    });
  } catch (error) {
    console.error("Get Store Banners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners.",
      error: error.message,
    });
  }
};