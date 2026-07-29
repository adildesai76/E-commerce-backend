import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initializeSocket } from "./socket/socket.js";
dotenv.config();

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/admin/inventory.routes.js";
import cookieParser from "cookie-parser";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminOrderRoutes from "./routes/admin/adminOrder.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import customerRoutes from "./routes/admin/customer.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import refundRoutes from "./routes/refund.routes.js";
import adminRefundRoutes from "./routes/admin/adminrefund.routes.js";
import analyticsRoutes from "./routes/admin/analytics.routes.js";
import adminStoreRoutes from "./routes/admin/adminStore.routes.js";
import storeRoutes from "./routes/store.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import aiRoutes from "./routes/admin/ai.routes.js";
import {
  apiLimiter,
  authLimiter,
  paymentLimiter,
} from "./middlewares/rateLimiter.middleware.js";

connectDB();

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(apiLimiter);
app.use(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
  }),
);
app.use(express.json());

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/admin/refunds", adminRefundRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/store", adminStoreRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/admin/ai", aiRoutes, aiRoutes);

// console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
