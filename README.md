#HotTap is an HTTP client library for node that just does what you expect.

hottap.js has no dependencies other than the node standard library.

##Example Usage:

###Simple GET:
    const HotTap = require('hottap').HotTap;
    Hottap("https://asdf.com/api/message/1").request("GET", function(err, response){
      console.log(response.body);
    });

###Simple POST:
    const HotTap = require('hottap').HotTap;
    Hottap("http://sdf.com/api/message/")
      .request("POST", 
               {"Content-Type" : "application/json"}, 
               '{"subject":"blah"}', 
               function(err, response){
                  console.log(response.status);
               }
      );

##About the response object:
    response.status  // status code as a Number
    response.body    // http body as a string
    response.headers // headers as an object/hash

##About the Url object 
    var url = Hottap("http://login:password@asdf.com/some/path?some_var=some_value#testhash");
    url.port = 80
    url.protocol = "http"
    url.path = "/some/path"
    url.hostname = "asdf.com"
    url.hash = "testhash"
    url.querystring.some_var =  "some_value"
    url.auth = 'login:password'

Invalid Urls will throw exceptions!

##Running the Tests:
Running tests requires a few dependencies (listed in package.json).  To install them, simply type:

    npm install

To run the tests, at the project root, simply type:

    mocha
