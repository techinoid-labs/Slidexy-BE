require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { validate } = require("./middlewares/validateInput");
const { generateSlidesHandler } = require("./controllers/slideController");
const { generateThemeImageHandler } = require("./controllers/themeController");
const {
  validateThemeImageInput,
} = require("./middlewares/validateThemeImageInput");

const { editTextHandler } = require("./controllers/textEditController");
const {
  generateImageSuggestionsHandler,
} = require("./controllers/regenerateImageController");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.post("/generate-slides", validate, generateSlidesHandler);
app.post(
  "/generate-theme-image",
  validateThemeImageInput,
  generateThemeImageHandler
);
app.post("/edit-text", editTextHandler);
app.post("/generate-image-suggestions", generateImageSuggestionsHandler);

app.listen(port, () => console.log(`Server running on port ${port}`));
