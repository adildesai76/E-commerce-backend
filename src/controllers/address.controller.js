import User from "../models/User.js";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from "../validators/adderss.validations.js";

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const validatedData = createAddressSchema.parse(req.body);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.addresses.length >= 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 addresses allowed.",
      });
    }

    const address = {
      ...validatedData,
      isDefault: user.addresses.length === 0,
    };

    user.addresses.push(address);

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Add Address Error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
};

// PUT /api/address/:addressId
export const updateAddress = async (req, res) => {
  try {
    const validatedData = updateAddressSchema.parse(req.body);

    const { addressId } = addressIdSchema.parse({
      params: req.params,
    }).params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    address.fullName = validatedData.fullName;
    address.phone = validatedData.phone;
    address.address1 = validatedData.address1;
    address.address2 = validatedData.address2 || "";
    address.city = validatedData.city;
    address.state = validatedData.state;
    address.country = validatedData.country;
    address.pincode = validatedData.pincode;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};

// DELETE /api/address/:addressId
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      // data: user.addresses,
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const addressExists = user.addresses.some(
      (address) => address._id.toString() === addressId,
    );

    if (!addressExists) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    user.addresses.forEach((address) => {
      address.isDefault = address._id.toString() === addressId;
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      // data: user.addresses,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update default address",
    });
  }
};
