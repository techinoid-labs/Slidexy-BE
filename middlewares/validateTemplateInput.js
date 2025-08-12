// middlewares/validateTemplateInput.js
const { body, validationResult } = require("express-validator");

const validateTemplateInput = [
  body("topic").notEmpty().withMessage("Topic is required"),
  body("slideCount").optional().isInt({ min: 1, max: 50 }),
  body("style").optional().isString(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateTemplateInput };
