import { Counter } from "./counter.model.js";

export const getNextUserCode = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { key: "user_code" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  return `USR-${String(counter!.value).padStart(5, "0")}`;
};
