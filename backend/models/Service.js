import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    serviceLocation: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    availableCities: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);