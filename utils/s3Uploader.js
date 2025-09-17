require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: "us-east-1", // DO accepts us-east-1
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

async function uploadToSpaces(base64, filename) {
  if (!base64) return null;

  // Extract extension + base64 payload
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const ext = matches ? matches[1].split("/")[1] : "png";
  const data = matches ? matches[2] : base64;

  const buffer = Buffer.from(data, "base64");
  const key = `${filename}.${ext}`;

  const uploadParams = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: `image/${ext}`,
    ACL: "public-read", // ensures URL is public
  };

  await s3.send(new PutObjectCommand(uploadParams));

  // return `https://${process.env.DO_SPACES_BUCKET}.sfo3.digitaloceanspaces.com/${key}`;
  return `https://${process.env.DO_SPACES_URL}/${key}`;
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
module.exports = { uploadToSpaces, deleteFromSpaces };
