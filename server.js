require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const {
  generatePptTemplateHandler,
} = require("./controllers/templateGenerateController");
const {
  validateTemplateInput,
} = require("./middlewares/validateTemplateInput");

// Import the new poster template controller
// ====== MongoDB Connection ======
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ====== Import Middlewares & Controllers ======
const { validate } = require("./middlewares/validateInput");
const {
  validateThemeImageInput,
} = require("./middlewares/validateThemeImageInput");
const { generateSlidesHandler } = require("./controllers/slideController");
const { generateThemeImageHandler } = require("./controllers/themeController");
const customSuggestionsHandler = require("./controllers/customSuggestionsController");
const { editTextHandler } = require("./controllers/textEditController");
const {
  generateImageSuggestionsHandler,
} = require("./controllers/regenerateImageController");
const { getPosterTemplate } = require("./controllers/infographicController");

// ====== Load Swagger Docs ======
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

// ====== Initialize App ======
const app = express();
app.use(cors());
app.use(express.json());

// ====== API Docs ======
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ====== Existing Routes ======
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

const User = require("./models/WaitingUser");

app.post("/join-waitlist", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = new User({ email });
    await user.save();

    res.status(201).json({ message: "User added to waitlist" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// ====== Start Server ======
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
