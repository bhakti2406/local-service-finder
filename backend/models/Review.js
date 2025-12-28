import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);