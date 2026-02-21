import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    isDeleted: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_deletion", ["isDeleted"])
    .index("by_updated", ["updatedAt"]),
});
