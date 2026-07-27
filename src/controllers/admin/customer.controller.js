import User from "../../models/User.js";
import Order from "../../models/Order.js";

import {
  getCustomersSchema,
  customerIdSchema,
  updateCustomerSchema,
} from "../../validators/customer.validations.js";
import { createNotification } from "../notification.controller.js";
import { sendNotification } from "../../utils/sendNotification.js";

export const getCustomers = async (req, res) => {
  try {
    const validated = getCustomersSchema.parse({
      query: req.query,
    });

    const page = Number(validated.query.page || 1);
    const limit = Number(validated.query.limit || 10);
    const search = validated.query.search || "";

    const skip = (page - 1) * limit;

    const filter = {
      role: "customer",
    };

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const total = await User.countDocuments(filter);

    const customers = await User.find(filter)
      .select("-password")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const customerIds = customers.map((customer) => customer._id);

    const orderStats = await Order.aggregate([
      {
        $match: {
          userId: {
            $in: customerIds,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          orderCount: {
            $sum: 1,
          },
          totalSpent: {
            $sum: "$summary.total",
          },
          lastOrderDate: {
            $max: "$createdAt",
          },
        },
      },
    ]);

    const statsMap = new Map();

    orderStats.forEach((item) => {
      statsMap.set(item._id.toString(), item);
    });

    const data = customers.map((customer) => {
      const stats = statsMap.get(customer._id.toString());

      return {
        ...customer,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
        lastOrderDate: stats?.lastOrderDate || null,
      };
    });

    return res.status(200).json({
      customers: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      message: "Failed to fetch customers.",
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const validated = customerIdSchema.parse({
      params: req.params,
    });

    const { customerId } = validated.params;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    })
      .select("-password")
      .lean();

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const orders = await Order.find({
      userId: customerId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const totalOrders = orders.length;

    const totalSpent = orders.reduce(
      (sum, order) => sum + order.summary.total,
      0,
    );

    const lastOrderDate = totalOrders > 0 ? orders[0].createdAt : null;

    return res.status(200).json({
      customer,
      addresses: customer.addresses,
      statistics: {
        totalOrders,
        totalSpent,
        lastOrderDate,
      },
      orders,
    });
  } catch (error) {
    console.error("Get Customer Error:", error);

    return res.status(500).json({
      message: "Failed to fetch customer.",
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const validated = updateCustomerSchema.parse({
      params: req.params,
      body: req.body,
    });

    const { customerId } = validated.params;
    const { name, email } = validated.body;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    if (email && email !== customer.email) {
      const existing = await User.findOne({
        email,
        _id: { $ne: customerId },
      });

      if (existing) {
        return res.status(409).json({
          message: "Email already exists.",
        });
      }

      customer.email = email;
    }

    if (name) {
      customer.name = name;
    }

    await customer.save();

    return res.status(200).json({
      message: "Customer updated successfully.",
      customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    return res.status(500).json({
      message: "Failed to update customer.",
    });
  }
};

export const blockCustomer = async (req, res) => {
  try {
    const validated = customerIdSchema.parse({
      params: req.params,
    });

    const { customerId } = validated.params;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    if (customer.isBlocked) {
      return res.status(400).json({
        message: "Customer is already blocked.",
      });
    }

    customer.isBlocked = true;

    await customer.save();

    await sendNotification({
      userId: customer._id,
      title: "Account Blocked",
      message: "Your account has been blocked by the administrator.",
      type: "system",
    });
    return res.status(200).json({
      message: "Customer blocked successfully.",
    });
  } catch (error) {
    console.error("Block Customer Error:", error);

    return res.status(500).json({
      message: "Failed to block customer.",
    });
  }
};

export const unblockCustomer = async (req, res) => {
  try {
    const validated = customerIdSchema.parse({
      params: req.params,
    });

    const { customerId } = validated.params;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    if (!customer.isBlocked) {
      return res.status(400).json({
        message: "Customer is already active.",
      });
    }

    customer.isBlocked = false;

    await customer.save();

    await sendNotification({
      userId: customer._id,
      title: "Account Activated",
      message: "Your account has been reactivated.",
      type: "system",
    });
    return res.status(200).json({
      message: "Customer unblocked successfully.",
    });
  } catch (error) {
    console.error("Unblock Customer Error:", error);

    return res.status(500).json({
      message: "Failed to unblock customer.",
    });
  }
};
