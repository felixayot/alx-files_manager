// File processing with Bull
/* eslint-disable no-unused-vars */
const Queue = require('bull');
const thumbnail = require('image-thumbnail');
const dbClient = require('./utils/db'); // Assuming you have a separate file for database operations

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const document = await dbClient.filesCollection.findOne(fileId, userId);

  if (!document) {
    throw new Error('File not found');
  }

  const thumbnailSizes = [500, 250, 100];

  const generateThumbnail = async (size) => {
    const thumbnailOptions = { width: size };
    const thumbnailBuffer = await thumbnail(document.filePath, thumbnailOptions);
    const thumbnailPath = `${document.filePath}_${size}`;

    // Save the thumbnail to the same location as the original file
    // You can use a file system module like fs to save the thumbnail
    // fs.writeFileSync(thumbnailPath, thumbnailBuffer);

    // For demonstration purposes, we'll just log the thumbnail path
    console.log(`Thumbnail generated: ${thumbnailPath}`);
  };

  if (!userId) {
    throw new Error('Missing userId');
  }

  const userDocument = await dbClient.usersCollection.findOne(userId);

  if (!userDocument) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${userDocument.email}!`);

  await Promise.all(thumbnailSizes.map(generateThumbnail));

  userQueue.add('sendEmail', {
    userId,
    fileId,
  });
});

module.exports = fileQueue;
