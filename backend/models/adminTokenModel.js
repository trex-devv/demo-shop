import mongoose from "mongoose";

const adminTokenSchema = new mongoose.Schema({
  fcmToken: {
    type: [String],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const adminTokenModel =
  mongoose.models.adminToken || mongoose.model("adminToken", adminTokenSchema);

export default adminTokenModel;
