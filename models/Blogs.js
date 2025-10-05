const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  content: { 
    type: String, 
    required: true 
  },
  category: {
    type: String,
    trim: true,
    default: ""
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: { 
    type: String, 
    trim: true 
  },
  media: [{ 
    type: String, 
    trim: true 
  }],
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Index for faster queries
blogSchema.index({ createdAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ tags: 1 });

// Update the updatedAt field before saving
blogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for excerpt
blogSchema.virtual("excerpt").get(function() {
  const strippedContent = this.content.replace(/<[^>]*>/g, '');
  return strippedContent.substring(0, 150) + (strippedContent.length > 150 ? '...' : '');
});

module.exports = mongoose.model("Blog", blogSchema);