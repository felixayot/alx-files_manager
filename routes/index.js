// Module for the app's routes

const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const mapRoutes = express.Router();

mapRoutes.get('/status', AppController.getStatus);
mapRoutes.get('/stats', AppController.getStats);
mapRoutes.post('/users', UsersController.postNew);
mapRoutes.get('/connect', AuthController.getConnect);
mapRoutes.get('/disconnect', AuthController.getDisconnect);
mapRoutes.get('/users/me', UsersController.getMe);
mapRoutes.post('/files', FilesController.postUpload);
mapRoutes.get('/files/:id', FilesController.getShow);
mapRoutes.get('/files', FilesController.getIndex);
mapRoutes.put('/files/:id/publish', FilesController.putPublish);
mapRoutes.put('/files/:id/publish', FilesController.putUnpublish);
mapRoutes.put('/files/:id/unpublish', FilesController.putPublish);
mapRoutes.get('/files/:id/data', FilesController.getFile);

module.exports = mapRoutes;
