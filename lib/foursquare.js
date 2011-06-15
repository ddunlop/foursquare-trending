var url = require('url'),
  querystring = require('querystring'),
  https = require('https'),
  foursquareconfig = require('../config/foursquare.js');

var foursquare = function() {
  this.getTrending = function(ll, err, callback) {
    var re_url = 'https://api.foursquare.com/v2/venues/trending?'+querystring.stringify({
      ll: ll,
      limit: 50,
      radius: 1500,
      client_id: foursquareconfig.api.clientId,
      client_secret: foursquareconfig.api.secret,
      v: foursquareconfig.api.version
    });

    var search_url = url.parse(re_url);
    
    https.get({
      host: search_url.host,
      path: search_url.pathname + search_url.search
    }, function(res) {
      if('200' === res.statusCode) {
        err('foursquare non 200 response: ' + res.statusCode);
      }
      
      var buf = '';

      res.on('data', function(d) {
        buf += d;
      });
      
      res.on('end', function() {
        try {
          var response = JSON.parse(buf),
            venues = [];
          if(200 !== response.meta.code) {
            err('foursquare returned a bad code: ' + response.meta.code + ' - ' + response.meta.errorType);
            return;
          }

          callback(response.response.venues);
        } catch(e) {
          err("foursquare json didn't parse" + e);
        }
      });

      res.on('close', function(e) {
        err('foursquare unexpected close of connection from : ' + e)
      })
    }
    ).on('error', function(e) {
      err('foursquare trouble making request: ' + e);
    });
  }
};

module.exports = new foursquare();
