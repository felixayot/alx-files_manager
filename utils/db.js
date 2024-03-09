// Mongodb connection
/* eslint-disabljue */
import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DbClient {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      this.db = client.db(DB_DATABASE);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    } catch (error) {
      console.log('YOUR MACHINE LIKELY HAS NO MONGODB INSTALLED');
      this.db = false;
    }
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const users = await this.usersCollection.countDocuments();
    return users;
  }

  async nbFiles() {
    const files = await this.filesCollection.countDocuments();
    return files;
  }
}

const dbClient = new DbClient();
module.exports = dbClient;
