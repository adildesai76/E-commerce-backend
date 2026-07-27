import Order from "../../models/Order.js";
import { sendNotification } from "../../utils/sendNotification.js";
import { updateOrderStatusSchema } from "../../validators/order.validations.js";

// export const getAllOrders = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       status,
//       year,
//       month,
//       from,
//       to,
//     } = req.query;

//     const skip = (Number(page) - 1) * Number(limit);

//     const filter = {};

//     // Status filter
//     if (status) {
//       filter.status = status;
//     }

//     // Date filters
//     if (year) {
//       const startDate = new Date(`${year}-01-01`);
//       const endDate = new Date(`${Number(year) + 1}-01-01`);

//       filter.createdAt = {
//         $gte: startDate,
//         $lt: endDate,
//       };
//     }

//     if (year && month) {
//       const startDate = new Date(
//         `${year}-${String(month).padStart(2, "0")}-01`,
//       );

//       const endDate = new Date(Number(year), Number(month), 0);

//       filter.createdAt = {
//         $gte: startDate,
//         $lte: endDate,
//       };
//     }

//     // Custom date range
//     if (from && to) {
//       filter.createdAt = {
//         $gte: new Date(from),
//         $lte: new Date(to),
//       };
//     }

//     // Search
//     let ordersQuery = Order.find(filter).populate("userId", "name email").sort({
//       createdAt: -1,
//     });

//     const orders = await ordersQuery.lean();

//     let filteredOrders = orders;

//     if (search) {
//       const searchValue = search.toLowerCase();

//       filteredOrders = orders.filter((order) => {
//         return (
//           order.orderNumber.toLowerCase().includes(searchValue) ||
//           order.userId?.name?.toLowerCase().includes(searchValue) ||
//           order.userId?.email?.toLowerCase().includes(searchValue)
//         );
//       });
//     }

//     const total = filteredOrders.length;

//     const paginatedOrders = filteredOrders.slice(skip, skip + Number(limit));

//     return res.status(200).json({
//       orders: paginatedOrders,

//       pagination: {
//         page: Number(page),
//         limit: Number(limit),
//         total,
//         totalPages: Math.ceil(total / Number(limit)),
//         hasNextPage: Number(page) < Math.ceil(total / Number(limit)),

//         hasPreviousPage: Number(page) > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Admin Get Orders Error:", error);

//     return res.status(500).json({
//       message: "Failed to fetch orders",
//       error: error.message,
//     });
//   }
// };

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      year,
      month,
      startDate,
      endDate,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Custom date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Year filter
    else if (year && month) {
      const startDateValue = new Date(Number(year), Number(month) - 1, 1);

      const endDateValue = new Date(Number(year), Number(month), 1);

      filter.createdAt = {
        $gte: startDateValue,
        $lt: endDateValue,
      };
    }

    // Year-only filter
    else if (year) {
      const startDateValue = new Date(Number(year), 0, 1);

      const endDateValue = new Date(Number(year) + 1, 0, 1);

      filter.createdAt = {
        $gte: startDateValue,
        $lt: endDateValue,
      };
    }

    // Search
    let ordersQuery = Order.find(filter).populate("userId", "name email").sort({
      createdAt: -1,
    });

    const orders = await ordersQuery.lean();

    let filteredOrders = orders;

    if (search) {
      const searchValue = search.toLowerCase();

      filteredOrders = orders.filter((order) => {
        return (
          order.orderNumber?.toLowerCase().includes(searchValue) ||
          order.userId?.name?.toLowerCase().includes(searchValue) ||
          order.userId?.email?.toLowerCase().includes(searchValue)
        );
      });
    }

    const total = filteredOrders.length;

    const paginatedOrders = filteredOrders.slice(skip, skip + Number(limit));

    return res.status(200).json({
      orders: paginatedOrders,

      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPreviousPage: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Admin Get Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({
        message: "Cannot update completed order",
      });
    }

    order.status = status;

    await order.save();
    console.log("Order status updated:", order.status);
    console.log("Order ID:", order._id);
    console.log("Order User ID:", order.userId);
    // console.log("Order updated:", order);

    await sendNotification({
      userId: order.userId.toString(),
      title: "Order Updated",
      message: `Your order is now ${order.status}.`,
      type: "order",
      link: `/orders/${order._id}`,
      metadata: {
        orderId: order._id,
        status: order.status,
      },
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      message: "Failed to update order status",

      error: error.message,
    });
  }
};
