require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { validate } = require("./middlewares/validateInput");
const { generateSlidesHandler } = require("./controllers/slideController");
const { generateThemeImageHandler } = require("./controllers/themeController");
const customSuggestionsHandler = require("./controllers/customSuggestionsController");
const {
  validateThemeImageInput,
} = require("./middlewares/validateThemeImageInput");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { editTextHandler } = require("./controllers/textEditController");
const {
  generateImageSuggestionsHandler,
} = require("./controllers/regenerateImageController");

const {
  generatePptTemplateHandler,
} = require("./controllers/templateGenerateController");
const {
  validateTemplateInput,
} = require("./middlewares/validateTemplateInput");

// Import the new poster template controller
const { getPosterTemplate } = require("./controllers/infographicController");

const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post("/generate-slides", validate, generateSlidesHandler);
app.post(
  "/generate-theme-image",
  validateThemeImageInput,
  generateThemeImageHandler
);
app.post("/edit-text", editTextHandler);
app.post("/generate-image-suggestions", generateImageSuggestionsHandler);
app.post("/custom-suggestions", customSuggestionsHandler);

// Add the new route for the poster template image generation
app.post("/generate-poster-template", getPosterTemplate);
app.post(
  "/generate-ppt-template",
  validateTemplateInput,
  generatePptTemplateHandler
);

app.listen(port, () => console.log(`Server running on port ${port}`));
