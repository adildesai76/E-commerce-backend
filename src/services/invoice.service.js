// services/invoice.service.js

import PDFDocument from "pdfkit";
import axios from "axios";

const loadImage = async (url) => {
  if (!url) return null;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Failed to load invoice image:", error.message);
    return null;
  }
};

export const generateInvoicePDF = async ({ order, store, res }) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  const invoiceNumber =
    order.invoice?.invoiceNumber || `INV-${order.orderNumber}`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${invoiceNumber}.pdf"`,
  );

  doc.pipe(res);

  // Load assets in parallel
  const [logo, signature, stamp] = await Promise.all([
    loadImage(store.logo),
    loadImage(store.invoice?.signature),
    loadImage(store.invoice?.stamp),
  ]);

  // Design Tokens
  const PRIMARY_COLOR = "#1A365D";
  const SECONDARY_COLOR = "#4A5568";
  const LIGHT_BG = "#F8FAFC";
  const LINE_COLOR = "#E2E8F0";

  // --------------------------------------------------
  // 1. Accent Bar
  // --------------------------------------------------
  doc.rect(0, 0, 595.28, 6).fill(PRIMARY_COLOR);

  // --------------------------------------------------
  // 2. Header
  // --------------------------------------------------
  let currentY = 30;

  if (logo) {
    doc.image(logo, 40, currentY, { fit: [110, 45] });
  }

  doc
    .fillColor(PRIMARY_COLOR)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("INVOICE", 300, currentY, { align: "right", width: 255 });

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(SECONDARY_COLOR)
    .text(`#${invoiceNumber}`, 300, currentY + 24, {
      align: "right",
      width: 255,
    });

  const issueDate = new Date(
    order.invoice?.issuedAt || order.createdAt,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .text(`Date: ${issueDate}`, 300, currentY + 38, {
      align: "right",
      width: 255,
    });

  currentY = 95;

  // --------------------------------------------------
  // 3. Address Blocks (Dynamic Height Calculation)
  // --------------------------------------------------
  const merchantAddr = [
    store.business?.businessName || store.storeName,
    store.address?.street,
    `${store.address?.city || ""}, ${store.address?.state || ""}`,
    `${store.address?.country || ""} ${store.address?.pincode || ""}`.trim(),
    store.contact?.email ? `Email: ${store.contact.email}` : null,
  ].filter(Boolean);

  const customerAddr = [
    order.shippingAddress.fullName,
    order.shippingAddress.address1,
    order.shippingAddress.address2,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    `Phone: ${order.shippingAddress.phone}`,
  ].filter(Boolean);

  const maxLines = Math.max(merchantAddr.length, customerAddr.length);
  const cardHeight = Math.max(85, maxLines * 12 + 30);

  // Background Cards
  doc.roundedRect(40, currentY, 250, cardHeight, 4).fill(LIGHT_BG);
  doc.roundedRect(305, currentY, 250, cardHeight, 4).fill(LIGHT_BG);

  // Left Column - Merchant
  let leftY = currentY + 10;
  doc
    .fillColor(PRIMARY_COLOR)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("ISSUED BY", 50, leftY);

  leftY += 14;
  doc.font("Helvetica").fontSize(8).fillColor(SECONDARY_COLOR);
  merchantAddr.forEach((line) => {
    doc.text(line, 50, leftY, { width: 230 });
    leftY += 11;
  });

  // Right Column - Customer
  let rightY = currentY + 10;
  doc
    .fillColor(PRIMARY_COLOR)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("BILLED TO", 315, rightY);

  rightY += 14;
  doc.font("Helvetica").fontSize(8).fillColor(SECONDARY_COLOR);
  customerAddr.forEach((line) => {
    doc.text(line, 315, rightY, { width: 230 });
    rightY += 11;
  });

  currentY += cardHeight + 20;

  // --------------------------------------------------
  // 4. Line Items Table Header
  // --------------------------------------------------
  doc.rect(40, currentY, 515, 20).fill(PRIMARY_COLOR);

  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");

  doc.text("ITEM DESCRIPTION", 50, currentY + 6);
  doc.text("QTY", 290, currentY + 6, { width: 40, align: "center" });
  doc.text("PRICE", 340, currentY + 6, { width: 100, align: "right" });
  doc.text("AMOUNT", 450, currentY + 6, { width: 95, align: "right" });

  currentY += 20;

  // --------------------------------------------------
  // 5. Table Rows with Dynamic Height Tracking
  // --------------------------------------------------
  doc.font("Helvetica").fontSize(8);

  order.items.forEach((item, index) => {
    const sellingPrice =
      item.discountPrice > 0 ? item.discountPrice : item.price;
    const itemTotal = sellingPrice * item.quantity;

    const textHeight = doc.heightOfString(item.name, { width: 220 });
    const rowHeight = Math.max(22, textHeight + 10);

    if (index % 2 === 0) {
      doc.rect(40, currentY, 515, rowHeight).fill(LIGHT_BG);
    }

    doc.fillColor("#2D3748");
    doc.text(item.name, 50, currentY + 5, { width: 220 });
    doc.text(String(item.quantity), 290, currentY + 5, {
      width: 40,
      align: "center",
    });
    doc.text(`INR ${sellingPrice.toLocaleString("en-IN")}`, 340, currentY + 5, {
      width: 100,
      align: "right",
    });
    doc.text(`INR ${itemTotal.toLocaleString("en-IN")}`, 450, currentY + 5, {
      width: 95,
      align: "right",
    });

    currentY += rowHeight;
  });

  doc
    .moveTo(40, currentY)
    .lineTo(555, currentY)
    .strokeColor(LINE_COLOR)
    .stroke();

  // --------------------------------------------------
  // 6. Summary Section
  // --------------------------------------------------
  currentY += 15;
  const summaryX = 310;

  const renderSummaryRow = (
    label,
    value,
    isBold = false,
    color = "#2D3748",
  ) => {
    doc
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(color)
      .fontSize(isBold ? 9 : 8);

    doc.text(label, summaryX, currentY);
    doc.text(value, 440, currentY, { width: 105, align: "right" });
    currentY += 15;
  };

  renderSummaryRow(
    "Subtotal",
    `INR ${order.summary.subtotal.toLocaleString("en-IN")}`,
  );

  if (order.summary.discount > 0) {
    renderSummaryRow(
      "Product Discount",
      `- INR ${order.summary.discount.toLocaleString("en-IN")}`,
      false,
      "#C53030",
    );
  }

  if (order.summary.couponDiscount > 0) {
    renderSummaryRow(
      "Coupon Discount",
      `- INR ${order.summary.couponDiscount.toLocaleString("en-IN")}`,
      false,
      "#C53030",
    );
  }

  if (order.summary.deliveryCharge > 0) {
    renderSummaryRow(
      "Delivery Fee",
      `INR ${order.summary.deliveryCharge.toLocaleString("en-IN")}`,
    );
  }

  // Total Box
  currentY += 5;
  doc.rect(summaryX - 5, currentY, 250, 24).fill(LIGHT_BG);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(PRIMARY_COLOR)
    .text("Total", summaryX + 5, currentY + 7);

  doc.text(
    `INR ${order.summary.total.toLocaleString("en-IN")}`,
    440,
    currentY + 7,
    { width: 100, align: "right" },
  );

  currentY += 35;

  // --------------------------------------------------
  // 7. Signature & Stamp (Right Aligned under Total)
  // --------------------------------------------------
  if (signature || stamp) {
    // Keep signature above the footer
    const sigY = Math.min(currentY + 15, 660);

    if (stamp) {
      doc.image(stamp, 360, sigY - 10, { fit: [50, 50] });
    }

    if (signature) {
      doc.image(signature, 420, sigY, { fit: [110, 40] });
    }

    doc
      .moveTo(410, sigY + 45)
      .lineTo(545, sigY + 45)
      .strokeColor(LINE_COLOR)
      .stroke();

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(SECONDARY_COLOR)
      .text("Authorized Signature", 410, sigY + 50, {
        align: "right",
        width: 135,
      });
  }

  // --------------------------------------------------
  // 8. Footer Block (Positioned at 750px near page bottom)
  // --------------------------------------------------
  const footerY = 750;

  // Separator line
  doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(LINE_COLOR).stroke();

  // Message
  const customMessage =
    store.invoice?.footer && !store.invoice.footer.toLowerCase().includes("footer")
      ? store.invoice.footer
      : "Thank you for your business!";

  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor(PRIMARY_COLOR)
    .text(customMessage, 40, footerY + 10, {
      align: "center",
      width: 515,
    });

  // Support Contacts
  const supportEmail =
    store.business?.supportEmail || store.contact?.email || "";
  const supportPhone =
    store.business?.supportPhone || store.contact?.phone || "";

  const supportInfo = [
    supportEmail && `Email: ${supportEmail}`,
    supportPhone && `Phone: ${supportPhone}`,
  ]
    .filter(Boolean)
    .join("  |  ");

  if (supportInfo) {
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(SECONDARY_COLOR)
      .text(`For support: ${supportInfo}`, 40, footerY + 22, {
        align: "center",
        width: 515,
      });
  }

  // Computer generated statement
  doc
    .fontSize(7)
    .font("Helvetica-Oblique")
    .fillColor("#A0AEC0")
    .text(
      "This is a computer-generated invoice and requires no physical signature.",
      40,
      footerY + 33,
      {
        align: "center",
        width: 515,
      },
    );

  doc.end();
};