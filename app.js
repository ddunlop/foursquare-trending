var foursquare = require('./lib/foursquare.js'),
  mongo = require('./lib/mongo.js'),
  locations = require('./config/locations');

mongo.start(function() {
  function update(location, ll) {
    foursquare.getTrending(ll, function(e) {
      console.error(e);
    }, function(venues) {
      console.log(location + ' hot venues: ' + venues.length);

      var date = new Date(),
        today = new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        min = Math.floor( (date.getTime() - today.getTime()) / (60*1000) );

      for(var i = 0 ; i < venues.length ; i++ ) {
        var id = venues[i]['id'],
          now = venues[i]['hereNow'].count;
        
        delete venues[i]['id'];
        delete venues[i]['hereNow'];
        
        var sets = {};
        sets['here.' + min] = now;
        
        mongo.update(id,
          {'$set': sets},
          venues[i]);
      }
    });
  }
  
  function updateLocations() {
    for(var location in locations) {
      update(location, locations[location]);
    }
  }
  
  updateLocations();
  setInterval(updateLocations, 1000*60);

//  mongo.end();
});
