const archiver = require('archiver');
const { uploadBufferToSpaces } = require('./s3Uploader'); // your existing file

async function createAndUploadZip(folderName, files, presentationId) {
  return new Promise(async (resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const chunks = [];
    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const zipFilename = `${folderName}.zip`;

      try {
        const zipUrl = await uploadBufferToSpaces(buffer, zipFilename, 'application/zip');
        console.log(`ZIP uploaded: ${zipUrl}`);
        resolve(zipUrl);
      } catch (err) {
        reject(err);
      }
    });

    archive.on('error', err => reject(err));

    // Add all files
    files.forEach(file => {
      archive.append(Buffer.from(file.content), {
        name: file.type === 'html' ? 'index.html' :
          file.type === 'css' ? 'styles.css' :
            file.type === 'js' ? 'app.js' :
              file.type === 'readme' ? 'README.md' : `${file.type}`
      });
    });

    archive.finalize();
  });
}

module.exports = { createAndUploadZip };