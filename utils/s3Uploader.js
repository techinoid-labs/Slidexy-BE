require("dotenv").config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

async function uploadToSpaces(base64, filename) {
  if (!base64) return null;

  // Extract extension + base64 payload
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 string");

  const mimeType = matches[1]; // e.g., image/png
  const ext = mimeType.split("/")[1];
  const data = matches[2];

  const buffer = Buffer.from(data, "base64");
  const key = `${filename}-${crypto.randomUUID()}.${ext}`;

  const uploadParams = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `https://${process.env.DO_SPACES_URL}/${key}`;
}
async function uploadBufferToSpaces(buffer, filename, mimetype) {
  const ext = filename.split(".").pop();
  const key = `${crypto.randomUUID()}.${ext}`;

  const uploadParams = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `https://${process.env.DO_SPACES_URL}/${key}`;
}

async function deleteBufferFromSpaces(filename) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: filename,
      })
    );
    console.log(`Deleted from Spaces: ${filename}`);
  } catch (err) {
    console.error("Failed to delete from Spaces:", err.message);
  }
}
async function deleteFromSpaces(filename) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: filename,
      })
    );
    console.log(`Deleted from Spaces: ${filename}`);
  } catch (err) {
    console.error("Failed to delete from Spaces:", err.message);
  }
}

module.exports = { uploadToSpaces, deleteFromSpaces, uploadBufferToSpaces, deleteBufferFromSpaces };
