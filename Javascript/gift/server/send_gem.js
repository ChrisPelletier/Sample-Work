var extractData           = require('./request').extractData;
var checkStringParameters = require('./request').checkStringParameters;
var checkPassword         = require('./request').checkPassword;
var checkRevision         = require('./request').checkRevision;
var reply                 = require('./response').reply;
var replyError            = require('./response').replyError;
var updateDoc             = require('./db').updateDoc;
var getDoc                = require('./db').getDoc;
var db                    = require('./db');


exports.handle = function(req, res) {
  // Pass request through appropriate filters before performing end goal processing.
  extractData(req, 256, function(data) {
    checkStringParameters(data, ['_id', 'friendId', '_rev', 'pw'], req, function() {
      checkPassword(data._id, data.pw, res, function(userDoc) {
        checkRevision(userDoc, data._rev, res, function() {
          if (userDoc.gems <= 0) {
            return reply(res, { 'insufficientGems': true });
          }
          if (data.friendId === userDoc._id) {
            return reply(res, { 'isCheating': true })
          }
          if (data.friendId.length === 0 || data.friendId[0] === ' ') {
            return reply(res, { 'noUserId': true })
          }
          processRequest1(userDoc, data.friendId, res);
        });
      });
    });
  });
};

processRequest1 = function(userDoc, friendId, res) {
  getDoc(friendId, function(err, friendDoc) {
    if (err) {
      console.log(err.message);
      replyError(res);
    }
    if (friendDoc === null) {
      return reply(res, { 'notFound': true });
    }
    ++friendDoc.gems;
    updateDoc(friendDoc, function(err, result) {
      if (err) {
        console.log(err.message);
        replyError(res);
      } else if (result.old) {
        processOld(friendDoc, res);
      } else if (result.rev) {
        friendDoc._rev = result.rev;
        processRequest2(userDoc, res);
      } else {
        console.log('logic error');
        replyError(res);
      }
    });
  });  
};

processRequest2 = function(userDoc, res) {
  --userDoc.gems;
  updateDoc(userDoc, function(err, result) {
    if (err) {
      console.log(err.message);
      replyError(res);
    } else if (result.old) {
      processOld(userDoc, res);
    } else if (result.rev) {
      userDoc._rev = result.rev;
      reply(res, { doc: userDoc });
    } else {
      console.log('logic error');
      replyError(res);
    }
  });
};

function processOld(oldDoc, res) {
  // Get a fresh version of the doc and return it to the client.
  checkPassword(oldDoc._id, oldDoc.pw, res, function(newDoc) {
    reply(res, { old: true, doc: newDoc });
  });
}