const express = require("express");
const Blog = require("../models/Blogs");
const isAdmin = require("../middlewares/isAdmin");
const router = express.Router();

// Create blog (Admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    const { title, content, coverImage, media } = req.body;

    const blog = new Blog({
      title,
      content,
      coverImage,
      media,
      author: req.user._id,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "name email");
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog (Admin only)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { title, content, coverImage, media } = req.body;

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, coverImage, media, updatedAt: Date.now() },
      { new: true }
    );

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog (Admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
