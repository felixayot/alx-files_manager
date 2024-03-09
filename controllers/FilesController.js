// Files Controller
const fs = require('fs').promises;
const mime = require('mime-types');
const Bull = require('bull');
const dbClient = require('../utils/db');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  // POST /files
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const {
      name,
      type = 'folder' || 'file' || 'image',
      parentId = 0,
      data = 'file' || 'image',
    } = req.body;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }
    if (parentId && !dbClient.filesCollection.findOne({ _id: parentId })) {
      return res.status(400).send({ error: 'Parent not found' });
    }
    if (
      parentId
      && !dbClient.filesCollection.findOne({ _id: parentId, type: 'folder' })
    ) {
      return res.status(400).send({ error: 'Parent is not a folder' });
    }

    const file = await FilesController.postUpload({ name, type, data });
    const result = await dbClient.filesCollection.insertOne(file);
    file._id = result.insertedId;
    file.owner = user._id;
    if (type === 'folder') {
      file.parentId = 0;
      file.isPublic = false;
      return res.status(201).send(file);
    }

    const path = `${FOLDER_PATH}/${file._id}`;
    if (type !== 'folder') {
      const buff = Buffer.from(data, 'base64');
      await fs.writeFile(path, buff);
      return res.status(201).send(file);
    }
    // Create a Bull queue called fileQueue
    const fileQueue = new Bull('fileQueue');

    // Add a job to the queue when a new image is stored
    if (type === 'image') {
      const jobData = {
        userId: user._id,
        fileId: file._id,
      };
      await fileQueue.add(jobData);
    }
    return res.status(400).send({ error: 'Missing data' });
  }

  // GET /files/:id
  static async getShow(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    const file = await dbClient.filesCollection.findOne({
      _id: fileId,
      owner: user._id,
    });
    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }
    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }
    const filePath = `${FOLDER_PATH}/${file._id}`;
    try {
      const fileData = await fs.readFile(filePath);
      const mimeType = mime.lookup(file.name);
      res.set('Content-Type', mimeType);
      return res.send(fileData);
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // GET /files
  static async getIndex(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({
      token,
    });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    const parentId = req.query.parentId || 0;
    const files = await dbClient.filesCollection
      .aggregate([{ $match: { parentId } }, { $skip: skip }, { $limit: limit }])
      .toArray();

    return res.status(200).send(files);
  }

  // PUT /files/:id/publish
  static async putPublish(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({
      token,
    });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const file = await dbClient.filesCollection.findOne({ _id: id });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (file.owner !== user._id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    const updateQuery = { $set: { isPublic: true } };
    const result = await dbClient.filesCollection.updateOne(
      { _id: id },
      updateQuery,
    );
    if (result.modifiedCount === 1) {
      return res.status(200).send({ ...file, isPublic: true });
    }
    return res.status(400).send({ error: 'Not found' });
  }

  // PUT /files/:id/unpublish
  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({
      token,
    });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const file = await dbClient.filesCollection.findOne({ _id: id });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (file.owner !== user._id) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    const updateQuery = { $set: { isPublic: false } };
    const result = await dbClient.filesCollection.updateOne(
      { _id: id },
      updateQuery,
    );
    if (result.modifiedCount === 1) {
      return res.status(200).send({ ...file, isPublic: false });
    }
    return res.status(400).send({ error: 'Not found' });
  }

  // GET /files/:id/data
  static async getFile(req, res) {
    const token = req.header('X-Token');
    const user = await dbClient.usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const file = await dbClient.filesCollection.findOne({ _id: id });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (file.isPublic || file.owner === user._id) {
      const path = `${FOLDER_PATH}/${file._id}`;
      const { size } = req.query;
      let filePath;
      if (size === '500') {
        filePath = `${path}_500`;
      } else if (size === '250') {
        filePath = `${path}_250`;
      } else if (size === '100') {
        filePath = `${path}_100`;
      } else {
        return res.status(400).send({ error: 'Invalid size' });
      }
      try {
        const data = await fs.readFile(filePath);
        return res.status(200).send(data);
      } catch (error) {
        console.error(`Error reading file: ${error}`);
        return res.status(404).send({ error: 'Not found' });
      }
    }
    return res.status(403).send({ error: 'Forbidden' });
  }
}

module.exports = FilesController;
