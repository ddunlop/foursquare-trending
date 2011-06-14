var mongodb = require('mongodb'),
  mongoconfig = require('../config/mongo.js');

var Mongo = function() {
  var server = new mongodb.Server(mongoconfig.server, mongoconfig.port, {}),
    trending, trendingCollection, venues, venuCache= {}, db, self = this, venues = {},
    mongo = new mongodb.Db(mongoconfig.database, server, {});
    
  function pad(length, number) {
    number += "";
    while(number.length < length) {
      number = '0' + number;
    }
    return number;
  }
  
  this.getDate = function() {
    var today = new Date();
    today = today.getFullYear() + pad(2, today.getMonth()+1) + pad(2, today.getDate());

    return today;
  }
  
  this.getTrendingCollectionName = function() {
    return 'trending_'+this.getDate();
  }
    
  this.start = function(callback) {
    mongo.open(function (error, client) {
      if (error) throw error;
      db = client;
      
       trendingCollection = self.getTrendingCollectionName() + "_junk";
      trending = new mongodb.Collection(client, trendingCollection);
      venues = new mongodb.Collection(client, 'venues');

      callback();
    });
  };
  
  this.update = function(id, update, venue) {
    var criteria = {_id: id};//db.bson_serializer.ObjectID.createFromHexString(id)};
    
    var todaysCollection = this.getTrendingCollectionName();
    if(trendingCollection !== todaysCollection) {
      // do we need to close the old trending collection?
      trendingCollection = todaysCollection;
      trending = new mongodb.Collection(db, trendingCollection);
      console.log('new trending Collection: ', trendingCollection);
    }

    if(!(id in venuCache)) {
      console.log('need to check/add venue');
      venue['_id'] = id;
      venues.update(criteria, venue, {safe:true, upsert: true}, function(err, count) {
        if(null === err && 1 === count ) {
          venuCache[id] = true;
        }
      });
    }

    trending.update(criteria, update, {safe: true, upsert: true}, function(err, count) {
      /** If the update failed, we need to insert the object prior to updating **/
      if(null === err && 1 === count) {
        return;
      }
      console.error('update failed for ', criteria);
    });
  }
  
  this.add = function(data, callback) {
    trending.insert(data, {safe: true}, callback);
  };
  
  this.end = function() {
    mongo.close();
  };
}


module.exports = new Mongo();
