// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const path = require("path");
// const swaggerUi = require("swagger-ui-express");
// const YAML = require("yamljs");
// const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

// const User = require("./models/WaitingUser");

// const {
//   generatePptTemplateHandler,
// } = require("./controllers/templateGenerateController");
// const {
//   validateTemplateInput,
// } = require("./middlewares/validateTemplateInput");
// const {
//   getPresentationHandler,
// } = require("./controllers/presentationController");

// // Import Middlewares & Controllers
// const { validate } = require("./middlewares/validateInput");
// const {
//   validateThemeImageInput,
// } = require("./middlewares/validateThemeImageInput");
// const { generateSlidesHandler } = require("./controllers/slideController");
// const { generateThemeImageHandler } = require("./controllers/themeController");
// const customSuggestionsHandler = require("./controllers/customSuggestionsController");
// const { editTextHandler } = require("./controllers/textEditController");
// const {
//   generateImageSuggestionsHandler,
// } = require("./controllers/regenerateImageController");
// const { getPosterTemplate } = require("./controllers/infographicController");

// // Load Swagger Docs
// const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

// // MongoDB Connection (Mongoose for ODM)
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log(" Connected to MongoDB Atlas"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Initialize App
// const app = express();

// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

// app.use(cors(corsOptions));

// app.use(express.json());

// // API Docs
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// // Slide/Presentation APIs
// app.post("/generate-slides", validate, generateSlidesHandler);
// app.post(
//   "/generate-theme-image",
//   validateThemeImageInput,
//   generateThemeImageHandler
// );
// app.post("/edit-text", editTextHandler);
// app.post("/generate-image-suggestions", generateImageSuggestionsHandler);
// app.post("/custom-suggestions", customSuggestionsHandler);
// app.post("/generate-poster-template", getPosterTemplate);
// app.post(
//   "/generate-ppt-template",
//   validateTemplateInput,
//   generatePptTemplateHandler
// );
// app.get("/presentation/:presentation_id", getPresentationHandler);

// // Waitlist Route
// app.post("/join-waitlist", async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }
//     const user = new User({ email });
//     await user.save();
//     return res.status(201).json({ message: "User added to waitlist" });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ error: "Email already exists" });
//     }
//     return res.status(500).json({ error: error.message });
//   }
// });

// app.get("/images/:id", async (req, res) => {
//   try {
//     const client = new MongoClient(process.env.MONGO_URI);
//     await client.connect();
//     const db = client.db("test");

//     const bucket = new GridFSBucket(db, { bucketName: "slides" });
//     const fileId = new ObjectId(req.params.id);

//     // Ensure file exists in metadata
//     const file = await db.collection("slides.files").findOne({ _id: fileId });
//     if (!file) {
//       return res.status(404).json({ error: "File not found" });
//     }

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

// // Start Server
// const port = process.env.PORT || 5000;
// app.listen(port, () => console.log(`Server running on port ${port}`));

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const infographicRoute = require("./routes/infographics");
// Models
const User = require("./models/WaitingUser");
const userRoutes = require("./routes/user");


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
app.use("/api/users", userRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/infographic", infographicRoute);
// --- API Docs ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Stripe API ---
app.use("/api/stripe", stripeRoutes);

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
app.get("/images/:id", async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("test");

    const bucket = new GridFSBucket(db, { bucketName: "slides" });
    const fileId = new ObjectId(req.params.id);

    const file = await db.collection("slides.files").findOne({ _id: fileId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // ✅ Explicitly allow CORS for image responses
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.set("Content-Type", file.contentType || "application/octet-stream");

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      console.error("GridFS Stream error:", err);
      res.status(500).json({ error: "Error streaming file" });
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});


// --- Start Server ---
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
