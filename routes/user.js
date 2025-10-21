const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/userController");
const auth = require("../middlewares/auth");

router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.get("/me", auth, userCtrl.getProfile);
router.put("/me", auth, userCtrl.updateProfile);
router.delete("/me", auth, userCtrl.deleteUser);
router.post("/request-password-reset", userCtrl.requestPasswordReset);
router.post("/reset-password", userCtrl.resetPassword);

module.exports = router;