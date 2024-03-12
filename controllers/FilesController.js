// Files Controller
const { ObjectId } = require('mongodb');
const mime = require('mime-types');
const Bull = require('bull');
const dbClient = require('../utils/db');
const fileUtils = require('../utils/file');
const userUtils = require('../utils/user');
const basicUtils = require('../utils/basic');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

// Create a Bull queue called fileQueue
const fileQueue = new Bull('fileQueue');

class FilesController {
  // POST /files
  static async postUpload(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);
    if (!basicUtils.isObjectID(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (!userId && req.body.type === 'image') {
      await fileQueue.add({});
    }

    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { error: validationError, fileParams } = await fileUtils.validateFile(req);
    if (validationError) { return res.status(400).send({ error: validationError }); }

    if (fileParams.parentId !== 0 && !basicUtils.isObjectID(fileParams.parentId)) { return res.status(400).send({ error: 'Parent not found' }); }

    const { error, code, newFile } = await fileUtils.saveFile(
      userId,
      fileParams,
      FOLDER_PATH,
    );

    if (error) {
      if (res.body.type === 'image') await fileQueue.add({ userId });
      return res.status(code).send(error);
    }

    if (fileParams.type === 'image') {
      await fileQueue.add({
        fileId: newFile.id.toString(),
        userId: newFile.userId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  // GET /files/:id
  static async getShow(req, res) {
    const fileId = req.params.id;

    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    if (!basicUtils.isObjectID(fileId) || !basicUtils.isObjectID(userId)) { return res.status(404).send({ error: 'Not found' }); }

    const result = await fileUtils.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!result) return res.status(404).send({ error: 'Not found' });

    const file = fileUtils.processFile(result);

    return res.status(200).send(file);
  }

  // GET /files
  static async getIndex(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    let parentId = req.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!basicUtils.isObjectID(parentId)) { return res.status(401).send({ error: 'Unauthorized' }); }

      parentId = ObjectId(parentId);

      const folder = await fileUtils.getFile({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') { return res.status(200).send([]); }
    }

    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];

    const fileCursor = await fileUtils.getFilesOfParentId(pipeline);

    const fileList = [];
    await fileCursor.forEach((doc) => {
      const document = fileUtils.processFile(doc);
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }

  // PUT /files/:id/publish
  static async putPublish(req, res) {
    const { error, code, updatedFile } = await fileUtils.publishUnpublish(
      req,
      true,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  // PUT /files/:id/unpublish
  static async putUnpublish(req, res) {
    const { error, code, updatedFile } = await fileUtils.publishUnpublish(
      req,
      false,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  // GET /files/:id/data
  static async getFile(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);
    const { id: fileId } = req.params;
    const size = req.query.size || 0;

    if (!basicUtils.isObjectID(fileId)) { return res.status(404).send({ error: 'Not found' }); }

    const file = await fileUtils.getFile({
      _id: ObjectId(fileId),
    });

    if (!file || !fileUtils.isOwnerAndPublic(file, userId)) { return res.status(404).send({ error: 'Not found' }); }

    if (file.type === 'folder') {
      return res
        .status(400)
        .send({ error: "A folder doesn't have content" });
    }

    const { error, code, data } = await fileUtils.getFileData(file, size);

    if (error) return res.status(code).send({ error });

    const mimeType = mime.contentType(file.name);

    res.setHeader('Content-Type', mimeType);

    return res.status(200).send(data);
  }
}

module.exports = FilesController;
