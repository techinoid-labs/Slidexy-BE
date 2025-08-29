const express = require("express");
const { MongoClient, ObjectId, GridFSBucket } = require("mongodb");

const router = express.Router();

router.get("/:id", async (req, res) => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("test"); 

  try {
    const bucket = new GridFSBucket(db, { bucketName: "slides" });
    const fileId = new ObjectId(req.params.id);

    // find file metadata first
    const files = await db.collection("slides.files").find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    res.set("Content-Type", file.contentType || "application/octet-stream");

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

module.exports = router;
