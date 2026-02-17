require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

// Routes
const infographicRoute = require("./routes/infographicsV2"); // ← Your V2 route with file support
const explainerInfographicRoute = require("./routes/explainerInfographicRoutes");
const dynamicInfographicRoute = require("./routes/dynamicInfographics");
const blogRoutes = require("./routes/blogRoutes");
const websiteDownloadRoutes = require("./routes/websiteZipDownload");

const userRoutes = require("./routes/user");
const aiChatRoutes = require("./routes/aiChatRoutes");
const contactRoutes = require("./routes/contact");
const planRoutes = require("./routes/planRoutes");
const vidGenImg = require("./routes/vidGenImg");
const generateImageRoute = require("./routes/generateImage");

const templateRoutes = require("./routes/templateRoutes");
const rawTextDeckRoutes = require("./routes/rawTextDeckRoutes");
const imageDeckRoutes = require("./routes/imageDeckRoutes");
const stylesheetDeckRoutes = require("./routes/stylesheetDeckRoutes");
const unifiedWebDeckRoutes = require("./routes/unifiedWebDeckRoutes");
const websiteGeneratorRoutes = require("./routes/websiteGeneratorRoutes");
const linkedinRoutes = require("./routes/linkedinRoutes");
const telegramRoutes = require("./routes/telegramRoutes");
const redditRoutes = require("./routes/redditRoutes");
const discordRoutes = require("./routes/discordRoutes");
const glmImageRoutes = require("./routes/glmImageRoutes");

// Presentation routes & controllers
const presentationRoutes = require("./routes/presentation");
const {
  generatePptTemplateHandler,
} = require("./controllers/templateGenerateController");
const {
  getPresentationHandler,
} = require("./controllers/presentationController");
const { generateSlidesHandler } = require("./controllers/slideController");
const { generateThemeImageHandler } = require("./controllers/themeController");
const customSuggestionsHandler = require("./controllers/customSuggestionsController");
const { editTextHandler } = require("./controllers/textEditController");
const {
  generateImageSuggestionsHandler,
} = require("./controllers/regenerateImageController");

// Middlewares
const {
  validateTemplateInput,
} = require("./middlewares/validateTemplateInput");
const { validate } = require("./middlewares/validateInput");
const {
  validateThemeImageInput,
} = require("./middlewares/validateThemeImageInput");

// Stripe
const stripeRoutes = require("./routes/stripeRoutes");

// Swagger
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

// Models
const User = require("./models/WaitingUser");

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Initialize App ---
const app = express();

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any origin - necessary for 'credentials: true' to work with 'all'
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Handle raw body for Stripe webhook only
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// --- Static Files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/website-codes', express.static(path.join(__dirname, 'website-codes')));

// --- Multer Setup for File Uploads ---
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, TXT, DOCX, and images allowed."), false);
    }
  }
});

// Helper middleware to handle upload errors cleanly
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File too large. Max 20MB allowed." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// --- ROUTES ---

// Core APIs
app.use("/api/users", userRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/infographic", infographicRoute); // ← Critical: apply multer here
app.use("/api/explainer-infographic", explainerInfographicRoute);
app.use("/api/dynamicInfographic", dynamicInfographicRoute);
app.use("/api/blogs", blogRoutes);
app.use("/api/vidGenImg", vidGenImg);
app.use("/api", generateImageRoute);

// Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Stripe
app.use("/api/stripe", stripeRoutes);

// AI Chat & Contact
app.use("/api/chat", aiChatRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/plans", planRoutes);

// Templates & Decks
app.use("/api/templates", templateRoutes);
app.use("/api/raw-text-deck", rawTextDeckRoutes);
app.use("/api/image-deck", imageDeckRoutes);
app.use("/api/stylesheet-deck", stylesheetDeckRoutes);
app.use("/api/unified-web-deck", unifiedWebDeckRoutes);
app.use("/api/website-generator", websiteGeneratorRoutes);
app.use("/api/website-zip-download", websiteDownloadRoutes);

// Website Editor & Dynamic Versions
app.use("/api/website-editor", require("./routes/websiteEditorRoutes"));
app.use("/api/dynamic-website", require("./routes/dynamicWebsiteRoutes"));
app.use("/api/improved-dynamic", require("./routes/improvedDynamicWebsiteRoutes"));

// Social Integrations
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/reddit", redditRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/glm-image", glmImageRoutes);

// Template Presentation Route
app.use("/template-presentation", require("./routes/templatePresentationRoutes"));

// --- Slide & Presentation Endpoints ---
app.post("/api/generate-slides", uploadMiddleware, validate, generateSlidesHandler);
app.post("/api/generate-theme-image", validateThemeImageInput, generateThemeImageHandler);
app.post("/api/edit-text", editTextHandler);
app.post("/api/generate-image-suggestions", generateImageSuggestionsHandler);
app.post("/api/custom-suggestions", customSuggestionsHandler);
app.post("/api/generate-ppt-template", validateTemplateInput, generatePptTemplateHandler);
app.get("/api/presentation/:presentation_id", getPresentationHandler);

// Backward compatibility for old root routes
app.post("/generate-slides", uploadMiddleware, validate, generateSlidesHandler);
app.post("/generate-theme-image", validateThemeImageInput, generateThemeImageHandler);
app.post("/edit-text", editTextHandler);
app.post("/generate-image-suggestions", generateImageSuggestionsHandler);
app.post("/custom-suggestions", customSuggestionsHandler);
app.post("/generate-ppt-template", validateTemplateInput, generatePptTemplateHandler);
app.get("/presentation/:presentation_id", getPresentationHandler);

// --- REMOVED: Old streaming endpoint ---
// app.post("/generate-poster-template", uploadMiddleware, getPosterTemplate); ← Deleted!

// --- Waitlist ---
app.post("/join-waitlist", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = new User({ email });
    await user.save();
    res.status(201).json({ message: "Joined waitlist successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// --- Start Server ---
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;