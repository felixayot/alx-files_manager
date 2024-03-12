// Module for basic program utilities

const objectId = require('mongodb').ObjectId;

class BasicUtils {
  static isObjectID(id) {
    return objectId.isValid(id);
  }
}

module.exports = BasicUtils;
