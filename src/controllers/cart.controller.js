// controllers/cart.controller.js

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js"
import AdminStore from "../models/AdminSetting.js";

const getCart = async (req, res) => {
  try {
    const [cart, store] = await Promise.all([
      Cart.findOne({ userId: req.user.id }),
      AdminStore.findOne().select("shipping").lean(),
    ]);

    if (!cart) {
      return res.status(200).json({
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          couponDiscount: 0,
          deliveryCharge: 0,
          total: 0,
          itemCount: 0,
          savings: 0,
        },
      });
    }

    const summary = cart.items.reduce(
      (acc, item) => {
        const originalPrice = item.price;
        const sellingPrice = item.discountPrice ?? item.price;

        acc.subtotal += originalPrice * item.quantity;
        acc.total += sellingPrice * item.quantity;
        acc.itemCount += item.quantity;

        return acc;
      },
      {
        subtotal: 0,
        total: 0,
        itemCount: 0,
      },
    );

    const productDiscount = summary.subtotal - summary.total;

    let couponDiscount = 0;

    /*
    |--------------------------------------------------------------------------
    | Validate Applied Coupon
    |--------------------------------------------------------------------------
    */

    if (cart.appliedCoupon && summary.total > 0) {
      const minimumOrderAmount = cart.appliedCoupon.minimumOrderAmount ?? 0;

      if (summary.total >= minimumOrderAmount) {
        couponDiscount = Math.min(
          cart.appliedCoupon.discount ?? 0,
          summary.total,
        );
      } else {
        // Coupon is no longer eligible
        cart.appliedCoupon = undefined;
        await cart.save();
      }
    } else if (cart.appliedCoupon) {
      // Cart is empty, remove coupon
      cart.appliedCoupon = undefined;
      await cart.save();
    }

    const discountedTotal = Math.max(summary.total - couponDiscount, 0);

    /*
    |--------------------------------------------------------------------------
    | Delivery
    |--------------------------------------------------------------------------
    */

    const shipping = store?.shipping;

    let deliveryCharge = 0;

    if (summary.itemCount > 0 && shipping?.enabled) {
      if (
        shipping.freeShipping &&
        discountedTotal >= shipping.freeShippingAmount
      ) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = shipping.defaultCharge ?? 0;
      }
    }

    const total = discountedTotal + deliveryCharge;

    return res.status(200).json({
      ...cart.toObject(),

      // Make sure the response also reflects the removed coupon
      appliedCoupon: cart.appliedCoupon || null,

      summary: {
        subtotal: summary.subtotal,
        discount: productDiscount,
        couponDiscount,
        deliveryCharge,
        total,
        itemCount: summary.itemCount,
        savings: productDiscount + couponDiscount,
      },
    });
  } catch (error) {
    console.error("[CART GET]", error);

    return res.status(500).json({
      error: "Failed to fetch cart",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const {
      productId,
      name,
      image,
      price,
      discountPrice,
      stock,
      category,
      quantity = 1,
    } = req.body;

    if (!productId || !name || price == null || stock == null || !category) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive number" });
    }

    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [
          {
            productId,
            name,
            image,
            price,
            discountPrice,
            stock,
            category,
            quantity,
          },
        ],
      });

      return res.status(201).json(cart);
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + quantity;

      if (newQty > stock) {
        return res.status(400).json({ error: "Cannot exceed available stock" });
      }

      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        productId,
        name,
        image,
        price,
        discountPrice,
        stock,
        category,
        quantity,
      });
    }

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    console.error("[CART ADD]", error);
    return res.status(500).json({ error: "Failed to add to cart" });
  }
};

// ─── PATCH /api/cart/:productId ───────────────────────────────────────────────
// Update the quantity of a specific item. Enforces stock limit.
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive number" });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    const item = cart.items[itemIndex];
    if (quantity > item.stock) {
      return res
        .status(400)
        .json({ error: `Only ${item.stock} units available` });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    console.error("[CART UPDATE]", error);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};

// ─── DELETE /api/cart/:productId ──────────────────────────────────────────────
// Remove a single item from the cart by productId.
// ─── DELETE /api/cart/:productId ──────────────────────────────────────────────
// Remove a single item from the cart by productId.
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        error: "Cart not found",
      });
    }

    const itemExists = cart.items.some(
      (item) => item.productId.toString() === productId,
    );

    if (!itemExists) {
      return res.status(404).json({
        error: "Item not found in cart",
      });
    }

    // Remove item
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    // If cart becomes empty, remove the coupon
    if (cart.items.length === 0) {
      cart.appliedCoupon = undefined;
    } else if (cart.appliedCoupon) {
      // Recalculate current cart total
      const cartTotal = cart.items.reduce((total, item) => {
        const sellingPrice = item.discountPrice ?? item.price;

        return total + sellingPrice * item.quantity;
      }, 0);

      // Fetch the actual coupon again
      const coupon = await Coupon.findOne({
        code: cart.appliedCoupon.code,
      });

      // Remove coupon if it no longer exists or minimum amount is not satisfied
      if (
        !coupon ||
        (coupon.minimumOrderAmount && cartTotal < coupon.minimumOrderAmount)
      ) {
        cart.appliedCoupon = undefined;
      }
    }

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    console.error("[CART REMOVE ITEM]", error);

    return res.status(500).json({
      error: "Failed to remove item",
    });
  }
};

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
// Wipe the entire cart document for the current user.
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id });
    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("[CART CLEAR]", error);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};

export { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
