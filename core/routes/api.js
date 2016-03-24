var express = require('express');
var api = express.Router();

var auth = require('../expressmidderware/auth.js');

var movieController = require('../controllers/movie.js');
var userController = require('../controllers/user/user.js');






api.get('/movie', movieController.campaignSingleInfo);
api.get('/movieadd', movieController.addCampaign);







api.post('/user/signup', userController.signUp);
api.post('/user/login', userController.login);
api.post('/user/logout', userController.logout);



/* GET users listing. */
api.get('/users', function(req, res, next) {
    res.send('respond with a resource');
});

api.get('/user/info', auth.loginToken(), userController.userInfo);






module.exports = api;