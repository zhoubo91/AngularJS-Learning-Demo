// call the packages we need
var mongoose      = require('mongoose');
var mongodbUri    = require('mongodb-uri');
var express       = require('express');
var path          = require('path');

process.env.NODE_CONFIG_DIR= path.resolve(__dirname, './config');
var config = require('config');
var DBUrl = mongodbUri.format(config.get('mongodb'));


var debug = require('debug')('app:appstart');
var favicon       = require('serve-favicon');
var morgan        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');

var routesWebsite = require('./routes/website');
var routesApi     = require('./routes/api');

var app = express();




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(morgan('dev'));

app.use(bodyParser.json()); // this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routesApi);
app.use('/', routesWebsite);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





mongoose.connect(DBUrl);
// http://theholmesoffice.com/mongoose-connection-best-practice/
var db = mongoose.connection;
db.on('error', function (err) {
    debug('MongoDB mongoose connection error:' + err);
});

db.once('open', function (callback) {
    debug('Successfully connected to MongoDB : ', DBUrl);
});

db.on('disconnected', function () {
    debug('Mongoose default connection disconnected');
});


/*db.once('open', function(response,request) {

  var socketio = require('socket.io').listen(server);
  global.gsocketio = socketio;
  require('./common/socketio').init(socketio);
});*/


// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  db.close(function () {
    debug('Mongoose default connection disconnected through nodejs app termination');
    process.exit(0);
  });
});


module.exports = app;
