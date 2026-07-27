import Order from "../../../models/Order.js";

export const getMarketingOverview = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          "marketing.source": {
            $exists: true,
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1,
          },

          totalRevenue: {
            $sum: "$summary.total",
          },

          sources: {
            $addToSet: "$marketing.source",
          },

          campaigns: {
            $addToSet: "$marketing.campaign",
          },
        },
      },
      {
        $project: {
          _id: 0,

          totalOrders: 1,

          totalRevenue: 1,

          totalSources: {
            $size: "$sources",
          },

          totalCampaigns: {
            $size: {
              $filter: {
                input: "$campaigns",
                as: "campaign",
                cond: {
                  $ne: ["$$campaign", ""],
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: result[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalSources: 0,
        totalCampaigns: 0,
      },
    });
  } catch (error) {
    console.error("Marketing Overview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch marketing overview",
      error: error.message,
    });
  }
};

export const getMarketingChannels = async (req, res) => {
  try {
    const channels = await Order.aggregate([
      {
        $match: {
          "marketing.source": {
            $exists: true,
            $ne: "",
          },
        },
      },

      {
        $addFields: {
          channel: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      {
                        $eq: ["$marketing.source", "facebook"],
                      },
                      {
                        $eq: ["$marketing.medium", "cpc"],
                      },
                    ],
                  },
                  then: "Facebook Ads",
                },

                {
                  case: {
                    $and: [
                      {
                        $eq: ["$marketing.source", "google"],
                      },
                      {
                        $eq: ["$marketing.medium", "cpc"],
                      },
                    ],
                  },
                  then: "Google Ads",
                },

                {
                  case: {
                    $eq: ["$marketing.source", "instagram"],
                  },
                  then: "Instagram Ads",
                },

                {
                  case: {
                    $and: [
                      {
                        $eq: ["$marketing.source", "google"],
                      },
                      {
                        $eq: ["$marketing.medium", "organic"],
                      },
                    ],
                  },
                  then: "Organic Search",
                },

                {
                  case: {
                    $eq: ["$marketing.source", "email"],
                  },
                  then: "Email Campaigns",
                },

                {
                  case: {
                    $eq: ["$marketing.source", "whatsapp"],
                  },
                  then: "WhatsApp Campaigns",
                },

                {
                  case: {
                    $eq: ["$marketing.source", "influencer"],
                  },
                  then: "Influencer Sales",
                },
              ],

              default: "Other",
            },
          },
        },
      },

      {
        $group: {
          _id: "$channel",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: "$summary.total",
          },
        },
      },

      {
        $project: {
          _id: 0,

          channel: "$_id",

          orders: 1,

          revenue: 1,
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("Marketing Channel Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch marketing channels",
      error: error.message,
    });
  }
};

export const getCampaignPerformance = async (req, res) => {
  try {
    const campaigns = await Order.aggregate([
      {
        $match: {
          "marketing.campaign": {
            $exists: true,
            $ne: "",
          },
        },
      },

      {
        $group: {
          _id: "$marketing.campaign",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: "$summary.total",
          },
        },
      },

      {
        $project: {
          _id: 0,

          campaign: "$_id",

          orders: 1,

          revenue: 1,

          averageOrderValue: {
            $round: [
              {
                $divide: ["$revenue", "$orders"],
              },
              2,
            ],
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Campaign Performance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaign performance",
      error: error.message,
    });
  }
};

export const getMarketingMediumPerformance = async (req, res) => {
  try {
    const mediums = await Order.aggregate([
      {
        $match: {
          "marketing.medium": {
            $exists: true,
            $ne: "",
          },
        },
      },

      {
        $group: {
          _id: "$marketing.medium",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: "$summary.total",
          },
        },
      },

      {
        $project: {
          _id: 0,

          medium: "$_id",

          orders: 1,

          revenue: 1,

          averageOrderValue: {
            $round: [
              {
                $divide: ["$revenue", "$orders"],
              },
              2,
            ],
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: mediums,
    });
  } catch (error) {
    console.error("Marketing Medium Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch medium performance",
      error: error.message,
    });
  }
};

export const getInfluencerPerformance = async (req, res) => {
  try {
    const influencers = await Order.aggregate([
      {
        $match: {
          "marketing.source": "influencer",
          "marketing.campaign": {
            $exists: true,
            $ne: "",
          },
        },
      },

      {
        $group: {
          _id: "$marketing.campaign",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: "$summary.total",
          },
        },
      },

      {
        $project: {
          _id: 0,

          influencer: "$_id",

          orders: 1,

          revenue: 1,

          averageOrderValue: {
            $round: [
              {
                $divide: ["$revenue", "$orders"],
              },
              2,
            ],
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: influencers,
    });
  } catch (error) {
    console.error("Influencer Performance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch influencer performance",
      error: error.message,
    });
  }
};
