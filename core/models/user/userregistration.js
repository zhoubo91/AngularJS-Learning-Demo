/**
 * Created by jinwyp on 2/2/2016.
 */


/**
 * Module dependencies
 */

var Promise = require('bluebird');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


mongoose.Promise = Promise;

var validator = require('validator');
var moment = require('moment');
var ipaddr = require('ipaddr.js');


var config = require('config');
var smsConfig = config.get('settingSMS');
var emailConfig = config.get('settingEmail');


var ValidatonError = require('../../errors/ValidationError');
var UnauthorizedAccessError = require('../../errors/UnauthorizedAccessError');

var MUserToken = require('./usertoken.js');
var MUser = require('./user.js');

var rn = require('../../libs/randomnumber.js');


/**
 * Mongoose schema
 */


var UserRegistrationSchema = new Schema({

    user: { type: Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, trim: true},
    mobile: { type: String},
    email: { type: String, lowercase: true, trim: true },

    messageType : { type: String },
    sendType : { type: String },

    code: { type: String },
    expireDate: { type: Date, required: true },

    ipv4: { type: String },
    ipv6: { type: String },
    userAgent: { type: String},
    deviceType: { type: String}


}, {
    toObject: { virtuals: false },
    toJSON: { virtuals: false },
    timestamps: true
});

/**
 * Mongoose plugin
 */









/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */






/**
 * Mongoose Schema Statics
 *
 * http://mongoosejs.com/docs/guide.html
 *
 */


 var constantMessageType = {
     signup : 'signup',
     signin : 'signin',
     resetpw : 'resetpw'
 };

 var constantMessageTypeList = ['signup', 'signin', 'resetpw'];
 UserRegistrationSchema.statics.constantMessageType = constantMessageType;

 var constantSendType = {
     email : 'email',
     sms : 'sms'
 };
 UserRegistrationSchema.statics.constantSendType = constantSendType;





var validation = {
    messageType : function (type){
        if (constantMessageTypeList.indexOf(type) === -1)  throw new ValidatonError(ValidatonError.code.user.messageTypeWrong, "Field validation error, messageType wrong", "messageType");
    },
    code : function (code){
        if (!validator.isLength(code, 6, 6))  throw new ValidatonError(ValidatonError.code.user.SMSCodeLengthWrong, "Field validation error,  SMSCode length must be 6-6", "smscode");
    },

    codeNotFound : function (code){
        if (!code) throw new ValidatonError(ValidatonError.code.user.SMSCodeNotFound, "Field validation error, SMScode not found", "smscode");
    },
    codeExpired : function (isExpired){
        if (isExpired) throw new ValidatonError(ValidatonError.code.user.SMSCodeExpired, "Field validation error, SMScode expired", "smscode");
    },
};

UserRegistrationSchema.statics.validation = validation;







UserRegistrationSchema.statics.sendMessage = function(user, req){
    MUser.validation.userMobile(user.mobile);
    validation.messageType(user.messageType);

    var newUser = {

        mobile: user.mobile,
        messageType: user.messageType,
        sendType: user.sendType,

        code : rn(100001, 999999),
        expireDate : moment().add(smsConfig.verifyCodeExpireHours, 'hours'),

        userAgent: req.get('User-Agent'),
        deviceType : MUserToken.constantDeviceType.pc

    };

    if (ipaddr.IPv4.isValid(req.ip)) {
        // ipString is IPv4
        newUser.ipv4 = req.ip;
    } else if (ipaddr.IPv6.isValid(req.ip)) {
        newUser.ipv6 = req.ip;
        var currentIP = ipaddr.IPv6.parse(req.ip);

        if (currentIP.isIPv4MappedAddress()) {
            // ip.toIPv4Address().toString() is IPv4
            newUser.ipv4 = currentIP.toIPv4Address().toString();
        } else {
            // ipString is IPv6
        }
    } else {
        // ipString is invalid
    }

    // desktop, tv, tablet, phone, bot or car
    if (req.device.type === 'phone') newUser.deviceType = MUserToken.constantDeviceType.mobilephone;
    if (req.device.type === 'tablet') newUser.deviceType = MUserToken.constantDeviceType.tablet;

    return UserRegistration.findOneAndUpdate({mobile:user.mobile, messageType: user.messageType}, newUser, {upsert:true, new:true}).exec();
};




UserRegistrationSchema.statics.verifySMSCode = function(user){

    MUser.validation.userMobile(user.mobile);
    validation.code(user.smscode);

    return UserRegistration.findOne({mobile:user.mobile, code: user.smscode}).exec().then(function(result){
        validation.codeNotFound(result);
        validation.codeExpired(result.isExpired());

        return result;
    });

};

/**
 * Mongoose Schema Instance Methods
 *
 * Instances of Models are documents. Documents have many of their own built-in instance methods. We may also define our own custom document instance methods too.
 *
 * http://mongoosejs.com/docs/guide.html
 */




UserRegistrationSchema.methods.isExpired = function () {
    var date = moment(this.expireDate);
    return moment().isAfter(date);
};





/**
 * Register Model
 */

var UserRegistration = mongoose.model("UserRegistration", UserRegistrationSchema);
module.exports = UserRegistration;
