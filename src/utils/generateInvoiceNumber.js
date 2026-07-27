import AdminStore from "../models/AdminSetting.js";
import Order from "../models/Order.js";

export const generateInvoiceNumber = async () => {
  const store = await AdminStore.findOne().select("invoice.prefix").lean();

  const prefix = store?.invoice?.prefix || "INV";

  const invoiceCount = await Order.countDocuments({
    "invoice.invoiceNumber": {
      $exists: true,
      $ne: "",
    },
  });

  const invoiceNumber = invoiceCount + 1;

  return `${prefix}-${String(invoiceNumber).padStart(4, "0")}`;
};
