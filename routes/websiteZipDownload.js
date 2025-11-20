const express = require("express");
const router = express.Router(); 
const GeneratedWebsite = require("../models/generateWebsite");

router.get("/download/:id", async (req, res) => {
  try {
    const website = await GeneratedWebsite.findById(req.params.id);
    if (!website || !website.zipUrl) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Increment download count
    website.downloadCount += 1;
    website.downloadedAt = new Date();
    await website.save();

    // Redirect to ZIP
    res.redirect(website.zipUrl);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;