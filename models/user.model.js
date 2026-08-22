import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    currency: {
      type: String,
      enum: [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        "SEK",
        "NZD",
      ],
      default: "USD",
    },

    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 month"],
    },

    frequency: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    category: {
      type: String,
      enum: [
        "sport",
        "news",
        "entertainment",
        "education",
        "lifestyle",
        "technology",
        "health",
        "finance",
        "travel",
        "food",
        "fashion",
        "music",
        "gaming",
        "other",
      ],
      default: "other",
    },

    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "bank_transfer", "crypto", "other"],
      default: "credit_card",
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator(value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const start = new Date(value);
          start.setHours(0, 0, 0, 0);

          return start > today;
        },
        message: "Start date must be a future date",
      },
    },

    renewalDate: {
      type: Date,
      validate: {
        validator(value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Calculate renewal date BEFORE validation
 */
subscriptionSchema.pre("validate", function (next) {
  if (!this.startDate) return next();

  const renewal = new Date(this.startDate);

  if (this.frequency === "yearly") {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else {
    renewal.setMonth(renewal.getMonth() + this.duration);
  }

  this.renewalDate = renewal;

  if (renewal < new Date()) {
    this.status = "expired";
  }

  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
