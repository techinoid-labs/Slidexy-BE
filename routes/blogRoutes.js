const express = require("express");
const Blog = require("../models/Blogs");
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const { uploadBufferToSpaces, deleteBufferFromSpaces } = require("../utils/s3Uploader");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Create blog (Admin only)
router.post(
  "/",
  auth,
  isAdmin,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "media", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { title, content, category } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Upload cover image
      let coverImageUrl = "";
      if (req.files.coverImage && req.files.coverImage[0]) {
        const file = req.files.coverImage[0];
        coverImageUrl = await uploadBufferToSpaces(file.buffer, file.originalname, file.mimetype);
      }

      // Upload media images
      let mediaUrls = [];
      if (req.files.media) {
        mediaUrls = await Promise.all(
          req.files.media.map((file) =>
            uploadBufferToSpaces(file.buffer, file.originalname, file.mimetype)
          )
        );
      }

      const blog = new Blog({
        title,
        content,
        category: category || "",
        coverImage: coverImageUrl,
        media: mediaUrls,
        author: req.user._id,
      });

      await blog.save();
      await blog.populate("author", "name email");
      res.status(201).json(blog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all blogs (Public)
router.get("/", async (req, res) => {
  try {
    const { category, limit, page } = req.query;
    
    let query = {};
    if (category) {
      query.category = category;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const skip = (pageNum - 1) * limitNum;

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog (Public)
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog (Admin only)
router.put(
  "/:id",
  auth,
  isAdmin,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "media", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { title, content, category } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // Update basic fields
      blog.title = title;
      blog.content = content;
      blog.category = category || "";
      blog.updatedAt = Date.now();

      // Upload new cover image if provided
      if (req.files.coverImage && req.files.coverImage[0]) {
        // Delete old cover image if exists
        if (blog.coverImage) {
          try {
            await deleteBufferFromSpaces(blog.coverImage);
          } catch (err) {
            console.error("Error deleting old cover image:", err);
          }
        }
        const file = req.files.coverImage[0];
        blog.coverImage = await uploadBufferToSpaces(file.buffer, file.originalname, file.mimetype);
      }

      // Upload new media images if provided
      if (req.files.media) {
        const newMediaUrls = await Promise.all(
          req.files.media.map((file) =>
            uploadBufferToSpaces(file.buffer, file.originalname, file.mimetype)
          )
        );
        blog.media = [...blog.media, ...newMediaUrls];
      }

      await blog.save();
      await blog.populate("author", "name email");
      res.json(blog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete blog (Admin only)
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Delete cover image from storage
    if (blog.coverImage) {
      try {
        await deleteBufferFromSpaces(blog.coverImage);
      } catch (err) {
        console.error("Error deleting cover image:", err);
      }
    }

    // Delete all media images from storage
    if (blog.media && blog.media.length > 0) {
      for (const mediaUrl of blog.media) {
        try {
          await deleteBufferFromSpaces(mediaUrl);
        } catch (err) {
          console.error("Error deleting media:", err);
        }
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog categories (Public)
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Blog.distinct("category");
    res.json(categories.filter(cat => cat)); // Filter out empty strings
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;