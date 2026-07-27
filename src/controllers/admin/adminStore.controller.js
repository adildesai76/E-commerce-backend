import AdminStore from "../../models/AdminSetting.js";

/**
 * ------------------------------------------------------------------
 * GET STORE SETTINGS
 * GET /api/admin/store
 * ------------------------------------------------------------------
 */
export const getAdminStore = async (req, res) => {
  try {
    let store = await AdminStore.findOne();

    // Create default document if none exists
    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store settings fetched successfully.",
      store,
    });
  } catch (error) {
    console.error("Get Admin Store Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * UPDATE STORE SETTINGS
 * PUT /api/admin/store
 * ------------------------------------------------------------------
 */
export const updateAdminStore = async (req, res) => {
  try {
    let store = await AdminStore.findOne();

    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    Object.assign(store, req.body);

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Store settings updated successfully.",
      store,
    });
  } catch (error) {
    console.error("Update Admin Store Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store settings.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * UPLOAD STORE LOGO
 * POST /api/admin/store/logo
 * ------------------------------------------------------------------
 */
export const uploadStoreLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo is required.",
      });
    }

    let store = await AdminStore.findOne();

    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    store.logo = req.file.path;

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully.",
      logo: store.logo,
    });
  } catch (error) {
    console.error("Upload Logo Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload logo.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * UPLOAD INVOICE SIGNATURE
 * POST /api/admin/store/invoice/signature
 * ------------------------------------------------------------------
 */
export const uploadInvoiceSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Signature image is required.",
      });
    }

    let store = await AdminStore.findOne();

    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    store.invoice.signature = req.file.path;

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Invoice signature uploaded successfully.",
      signature: store.invoice.signature,
    });
  } catch (error) {
    console.error("Upload Invoice Signature Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload invoice signature.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * UPLOAD INVOICE STAMP
 * POST /api/admin/store/invoice/stamp
 * ------------------------------------------------------------------
 */
export const uploadInvoiceStamp = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Stamp image is required.",
      });
    }

    let store = await AdminStore.findOne();

    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    store.invoice.stamp = req.file.path;

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Invoice stamp uploaded successfully.",
      stamp: store.invoice.stamp,
    });
  } catch (error) {
    console.error("Upload Invoice Stamp Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload invoice stamp.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * ADD BANNER
 * POST /api/admin/store/banner
 * ------------------------------------------------------------------
 */

export const addBanner = async (req, res) => {
  try {
    // console.log("BODY:", req.body);
    // console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required.",
      });
    }

    let store = await AdminStore.findOne();

    if (!store) {
      store = await AdminStore.create({
        storeName: "My Store",
      });
    }

    store.banners.push({
      image: req.file.path,
      title: req.body.title || "",
      subtitle: req.body.subtitle || "",
      buttonText: req.body.buttonText || "",
      buttonLink: req.body.buttonLink || "",
      active: req.body.active === "false" ? false : true,
      order: Number(req.body.order) || 0,
    });

    await store.save();

    return res.status(201).json({
      success: true,
      message: "Banner added successfully.",
      banners: store.banners,
    });
  } catch (error) {
    console.error("Add Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * ------------------------------------------------------------------
 * UPDATE BANNER
 * PUT /api/admin/store/banner/:bannerId
 * ------------------------------------------------------------------
 */
export const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const store = await AdminStore.findOne();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const banner = store.banners.id(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    if (req.file) {
      banner.image = req.file.path;
    }

    if (req.body.title !== undefined) banner.title = req.body.title;

    if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;

    if (req.body.buttonText !== undefined)
      banner.buttonText = req.body.buttonText;

    if (req.body.buttonLink !== undefined)
      banner.buttonLink = req.body.buttonLink;

    if (req.body.active !== undefined) banner.active = req.body.active;

    if (req.body.order !== undefined) banner.order = req.body.order;

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully.",
      banner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update banner.",
      error: error.message,
    });
  }
};

/**
 * ------------------------------------------------------------------
 * DELETE BANNER
 * DELETE /api/admin/store/banner/:bannerId
 * ------------------------------------------------------------------
 */
export const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const store = await AdminStore.findOne();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const banner = store.banners.id(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    banner.deleteOne();

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully.",
      banners: store.banners,
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete banner.",
      error: error.message,
    });
  }
};
