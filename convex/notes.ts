import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// list all non-deleted notes, ordered by updatedAt desc
export const list = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_deletion", (q) => q.eq("isDeleted", false))
      .order("desc")
      .collect();

    // sort by updatedAt descending
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// get a single note by id (null if deleted)
export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);

    if (!note || note.isDeleted) {
      return null;
    }

    return note;
  },
});

// create a new note
export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("notes", {
      title: args.title,
      body: args.body,
      tags: args.tags,
      isDeleted: false,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// update an existing note
export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

// soft delete a note
export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
  },
});
