var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = function (db) {
  var filePath = path.join(__dirname, 'sqls', '20260607000002-create-skill-invocations-up.sql');
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) return reject(err);
      db.runSql(data).then(resolve).catch(reject);
    });
  });
};

exports.down = function (db) {
  var filePath = path.join(__dirname, 'sqls', '20260607000002-create-skill-invocations-down.sql');
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) return reject(err);
      db.runSql(data).then(resolve).catch(reject);
    });
  });
};

exports._meta = {
  version: 1,
};
