const express = require("express");
const router = express.Router();
const { getVidGenImgService } = require("../services/unit-services/getVidGenImg");
const Infographic = require("../models/Infographics");
router.post("/", async (req, res) => {
  try {
    const { prompt} = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1. Generate infographic
    const result = await getVidGenImgService(prompt);

    // 2. Save infographic in MongoDB
    const newInfographic = new Infographic({
      prompt,
      type: result.data?.type || "generic", 
      title: result.data?.title || "Untitled",
      subtitle: result.data?.subtitle || "",
      data: result.data,
      html: result.html,
      meta: result.meta,
    });

    await newInfographic.save();

    // 3. Respond with saved doc
    return res.json({ success: true, infographic: newInfographic });

  } catch (err) {
    console.error("Infographic generation failed:", err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;
