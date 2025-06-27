const { body } = require("express-validator");

const validateThemeImageInput = [
  body("prompt")
    .isString()
    .notEmpty()
    .withMessage("Prompt is required to generate a theme image."),
  body("count")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Count must be a number between 1 and 10."),
];

module.exports = { validateThemeImageInput };
