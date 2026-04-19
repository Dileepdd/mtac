import dotenv from "dotenv";
import { PermissionModel } from "../modules/permission/permission.model.js";
import { DEFAULT_PERMISSIONS } from "../config/permissions.js";
import mongoose from "mongoose";
dotenv.config();

const seedPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_URL as string);

    const bulkOps = DEFAULT_PERMISSIONS.map((p) => ({
      updateOne: {
        filter: { name: p.name },
        update: { $setOnInsert: p },
        upsert: true,
      },
    }));
    const result = await PermissionModel.bulkWrite(bulkOps);

    console.log("seeding completed");
    console.log("result:", result);
  } catch (err: any) {
    console.error("Seed Error", err);
    process.exit(1);
  }
};

seedPermissions();
