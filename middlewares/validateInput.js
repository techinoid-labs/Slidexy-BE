const { body, validationResult } = require("express-validator");

const validate = [
  body("source")
    .isIn(["youtube", "text", "website", "file"])
    .withMessage("Invalid source. Must be 'youtube', 'text', 'website', or 'file'."),
  body("inputUrl")
    .if(body("source").equals("youtube"))
    .isURL()
    .withMessage("Must be a valid YouTube URL."),
  body("textContent")
    .if(body("source").equals("text"))
    .notEmpty()
    .withMessage("Text content is required when source is 'text'."),
  body("inputWebsiteUrl")
    .if(body("source").equals("website"))
    .isURL()
    .withMessage("Must be a valid Website URL."),
];

module.exports = { validate };
