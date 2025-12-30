require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const infographicRoute = require("./routes/infographicsV2");
const explainerInfographicRoute = require("./routes/explainerInfographicRoutes");
const dynamicInfographicRoute = require("./routes/dynamicInfographics");
const blogRoutes = require("./routes/blogRoutes");
const websiteDownloadRoutes = require("./routes/websiteZipDownload");

// Models
const User = require("./models/WaitingUser");

//Routes
const userRoutes = require("./routes/user");
const aiChatRoutes = require("./routes/aiChatRoutes");
const contactRoutes = require("./routes/contact");
const planRoutes = require("./routes/planRoutes");
const vidGenImg = require("./routes/vidGenImg");
const generateImageRoute = require("./routes/generateImage");

const templateRoutes = require("./routes/templateRoutes");
const rawTextDeckRoutes = require("./routes/rawTextDeckRoutes"); // Raw Text Deck Service
const imageDeckRoutes = require("./routes/imageDeckRoutes"); // Image Deck Service
const stylesheetDeckRoutes = require("./routes/stylesheetDeckRoutes"); // Stylesheet Deck Service
const unifiedWebDeckRoutes = require("./routes/unifiedWebDeckRoutes"); // Unified Web Deck Service (CEO Final)
const websiteGeneratorRoutes = require("./routes/websiteGeneratorRoutes"); // Website Generator Service (CEO New Feature)
const linkedinRoutes = require("./routes/linkedinRoutes"); // LinkedIn Integration
const telegramRoutes = require("./routes/telegramRoutes"); // Telegram Integration
const redditRoutes = require("./routes/redditRoutes"); // Reddit Integration
const discordRoutes = require("./routes/discordRoutes"); // Discord Integration

// Controllers
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
const { getPosterTemplate } = require("./controllers/infographicController");
const presentationRoutes = require("./routes/presentation");
// Middlewares
const {
  validateTemplateInput,
} = require("./middlewares/validateTemplateInput");
const { validate } = require("./middlewares/validateInput");
const {
  validateThemeImageInput,
} = require("./middlewares/validateThemeImageInput");

// Stripe Routes
const stripeRoutes = require("./routes/stripeRoutes");

// Swagger Docs
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Initialize App ---
const app = express();

// CORS Config
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle raw body only for Stripe webhooks
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.json());

// --- Static File Serving ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/website-codes', express.static(path.join(__dirname, 'website-codes')));

app.use("/api/users", userRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/infographic", infographicRoute);
app.use("/api/explainer-infographic", explainerInfographicRoute);
app.use("/api/dynamicInfographic", dynamicInfographicRoute);
app.use("/api/blogs", blogRoutes);
app.use("/api/vidGenImg", vidGenImg);
// --- API Docs ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Stripe API ---
app.use("/api/stripe", stripeRoutes);

// AI CHAT
app.use("/api/chat", aiChatRoutes);

app.use("/api", generateImageRoute);


// Contact

app.use("/api/contact", contactRoutes);
// Plans
app.use("/api/plans", planRoutes);

// Template Routes
app.use("/api/templates", templateRoutes);
// After your other routes
app.use("/template-presentation", require("./routes/templatePresentationRoutes"));

// --- Raw Text Deck Service (Separate Service) ---
app.use("/api/raw-text-deck", rawTextDeckRoutes);

// --- Image Deck Service (Separate Service) ---
app.use("/api/image-deck", imageDeckRoutes);

// --- Stylesheet Deck Service (Separate Service) ---
app.use("/api/stylesheet-deck", stylesheetDeckRoutes);

// --- Unified Web Deck Service (Orchestrates all 3 services) ---
app.use("/api/unified-web-deck", unifiedWebDeckRoutes);

// --- Website Generator Service (CEO New Feature: Generate HTML websites) ---
app.use("/api/website-generator", websiteGeneratorRoutes);
app.use("/api/website-zip-download", websiteDownloadRoutes);

// --- Website Editor Service (Edit generated websites with natural language) ---
const websiteEditorRoutes = require("./routes/websiteEditorRoutes");
app.use("/api/website-editor", websiteEditorRoutes);

// --- Dynamic Website Generator Service (Enhanced version with adaptive structure) ---
const dynamicWebsiteRoutes = require("./routes/dynamicWebsiteRoutes");
app.use("/api/dynamic-website", dynamicWebsiteRoutes);

// --- Improved Dynamic Website Generator Service (Enhanced with better structure & responsiveness) ---
const improvedDynamicWebsiteRoutes = require("./routes/improvedDynamicWebsiteRoutes");
app.use("/api/improved-dynamic", improvedDynamicWebsiteRoutes);

// --- Social Media Integrations ---
app.use("/api/linkedin", linkedinRoutes); // LinkedIn Integration
app.use("/api/telegram", telegramRoutes); // Telegram Integration
app.use("/api/reddit", redditRoutes); // Reddit Integration
app.use("/api/discord", discordRoutes); // Discord Integration

// --- Slide/Presentation APIs ---
app.post("/generate-slides", validate, generateSlidesHandler);
app.post(
  "/generate-theme-image",
  validateThemeImageInput,
  generateThemeImageHandler
);
app.post("/edit-text", editTextHandler);
app.post("/generate-image-suggestions", generateImageSuggestionsHandler);
app.post("/custom-suggestions", customSuggestionsHandler);
app.post("/generate-poster-template", getPosterTemplate);
app.post(
  "/generate-ppt-template",
  validateTemplateInput,
  generatePptTemplateHandler
);
app.get("/presentation/:presentation_id", getPresentationHandler);

// --- Waitlist Route ---
app.post("/join-waitlist", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = new User({ email });
    await user.save();
    return res.status(201).json({ message: "User added to waitlist" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: error.message });
  }
});

// --- Image Fetching Route ---
// app.get("/images/:id", async (req, res) => {
//   try {
//     const client = new MongoClient(process.env.MONGO_URI);
//     await client.connect();
//     const db = client.db("test");

//     const bucket = new GridFSBucket(db, { bucketName: "slides" });
//     const fileId = new ObjectId(req.params.id);

//     const file = await db.collection("slides.files").findOne({ _id: fileId });
//     if (!file) {
//       return res.status(404).json({ error: "File not found" });
//     }

//     // ✅ Explicitly allow CORS for image responses
//     res.set("Access-Control-Allow-Origin", "*");
//     res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
//     res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

//     res.set("Content-Type", file.contentType || "application/octet-stream");

//     const downloadStream = bucket.openDownloadStream(fileId);
//     downloadStream.on("error", (err) => {
//       console.error("GridFS Stream error:", err);
//       res.status(500).json({ error: "Error streaming file" });
//     });

//     downloadStream.pipe(res);
//   } catch (err) {
//     console.error("Error fetching image:", err);
//     res.status(500).json({ error: "Failed to fetch image" });
//   }
// });

// --- Start Server ---
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
