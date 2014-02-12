var should = require('should');
var http = require('http');
var https = require('https');
var express = require('express');
var fs = require('fs');
var hottap = require('../hottap').hottap;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';



describe('hottap', function(){

  it('return its url as a string', function(done){
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash");
    hottap("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash");
    hottap("http://asdf.com").toString().should.equal("http://asdf.com/");
    done();
  });

  it('return its querystring as an object', function(done){
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.asdf.should.equal("1234");
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.qwer.should.equal("qwer");
    done();
  });
  
  it('return its auth value as a string', function(done){
    hottap("http://someauth@asdf.com:8080/asdf#hash").auth.should.equal("someauth");
    done();
  });

  it('return its hash value as a string', function(done){
    hottap("http://asdf.com:8080/asdf#hash").hash.should.equal("hash");
    done();
  });

  it('return an empty string for a hash if it has no value', function(done){
    hottap("http://asdf.com:8080/asdf#").hash.should.equal("");
    done();
  });

  it('return an empty string for a hash if it is unset', function(done){
    hottap("http://asdf.com:8080/asdf").hash.should.equal("");
    done();
  });

  it('return its port when it is http and the port is not defined', function(done){
    hottap("http://asdf.com/asdf").port.should.equal('80');
    done();
  });

  it('return its port when it is http and the port is not defined', function(done){
    hottap("https://asdf.com/asdf").port.should.equal('443');
    done();
  });

  it('return its port when it is defined', function(done){
    hottap("http://asdf.com:82/asdf").port.should.equal('82');
    done();
  });

  it('return its protocol when it is http', function(done){
    hottap("http://asdf.com").protocol.should.equal('http');
    done();
  });

  it('return its protocol when it is https', function(done){
    hottap("https://asdf.com").protocol.should.equal('https');
    done();
  });

  it('throw an exception when the protocol is unknown', function(done){
    try {
      hottap("ftp://asdf.com");
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Unknown protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('throw an exception when the protocol cannot be determined', function(done){
    try {
      hottap("~~~~");
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Unknown protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('raise exception when hostname does not exist', function(done){
      try {
        var hostname = hottap("http://").hostname;
        should.fail("Exception wasn't thrown!");
      } catch (err) {
        err.should.equal("Missing hostname.");
        done();
      }
  });

  it('have a hostname', function(done){
      hottap("http://asdf.museum:8080/this/is/the/path").hostname.should.equal('asdf.museum');
      done();
  });

  it('return its path when set', function(done){
      hottap("http://asdf.museum/this/is/the/path").path.should.equal('/this/is/the/path');
      done();
  });

  it('return its path as / when not set', function(done){
      hottap("http://asdf.museum").path.should.equal('/');
      done();
  });

  describe("#request before making the actual request", function(){
    it('throw an exception if it does not get a callback parameter', function(done){
      try {
        hottap("http://127.0.0.1:9999").request("GET");
        should.fail("exception was not raised");
      } catch (err){
        err.should.equal('request() expects a callback for the last parameter.');
        done();
      }
    });
    it('throw an error for requests with an invalid headers object', function(done){
      try {
          hottap("http://127.0.0.1:9999/api/message/").request("GET", 42, 
                   function(err, response){ should.fail("should not get this far!"); }
          );
      } catch (err) {
          err.should.equal("Argument Error: Expected an (headers) object for the second argument.");
          done();
      }
    });
  });

  describe("#request with https", function(){
    var server = null;
    var app = null;

    beforeEach(function(done){
      var creds = {
        key: fs.readFileSync(__dirname + '/agent2-key.pem', 'utf8'),
        cert: fs.readFileSync(__dirname + '/agent2-cert.pem', 'utf8')
      };
      app = express();
      server = https.createServer(creds, app);
      server.listen(9999, "127.0.0.1", function(err){
        done(err);
      });
    });

    afterEach(function(done){
      server.close(function(err){
        done(err);
      });
    });
    it('supports GET via https', function(done){
      app.get('/', function (req, res) {
        res.send('Hello World\n' + req.method);
      });
      hottap("https://127.0.0.1:9999").request("GET", function(error, response){
        if (!!error) {
          console.log("error: ", error);
          should.fail(error);
        }
        response.body.should.equal('Hello World\nGET');
        response.status.should.equal(200);
        response.should.have.property('headers');
        done();
      });
    });
  });

  describe('#request()', function(){
    var server = null;
    var app = null;

    beforeEach(function(done){
      app = express();
      server = http.createServer(app);
      server.listen(9999, "127.0.0.1", function(err){
        done(err);
      });
    });

    afterEach(function(done){
      server.close(function(err){
        done(err);
      });
    });
    

    it('supports a simple GET', function(done){
      app.get('/', function (req, res) {
        res.send('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999").request("GET", function(error, response){
        if (!!error) { should.fail(error); }
        response.body.should.equal('Hello World\nGET');
        response.status.should.equal(200);
        response.should.have.property('headers');
        done();
      });
    });


    it('supports a GET with headers', function(done){
      app.get('/api/message', function (req, res) {
        res.send({'HelloWorld':req.method});
      });
      hottap("http://127.0.0.1:9999/api/message/")
        .request("GET", 
                 {"Content-Type" : "application/json"}, 
                 function(error, response){
                    if (!!error) { should.fail(error); }
                    JSON.parse(response.body).HelloWorld.should.equal('GET');
                    response.status.should.equal(200);
                    response.should.have.property('headers');
                    done();
                }
        );

    });


    it('supports a POST with headers and body', function(done){
      app.post('/api/message', function (req, res) {
        res.send('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999/api/message/")
        .request("POST",
                 {"Content-Type" : "application/json"},
                 '{"some" : "json"}',
                 function(error, response){
                    if (!!error) { should.fail(error); }
                    response.body.should.equal('Hello World\nPOST');
                    response.status.should.equal(200);
                    response.should.have.property('headers');
                    done();
                }
        );

    });

    it('return errors for failed requests', function(done){
      app.post('/', function (req, res) {
        res.send('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999/api/message/")
        .request("UNKNOWN_METHOD",
                 {"content-type" : "application/json"},
                 '{"some" : "json"}',
                 function(err, response){
                    err.should.have.property('message');
                    done();
                }
        );
    });


    it('pass on the provided headers', function(done){
      app.get('/', function (req, res) {
        req.headers['content-type'].should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999")
          .request("GET", {'Content-Type' : 'application/json'}, function(error, response){
        if (!!error) { should.fail(error); }
        response.body.should.equal('Hello World\nGET');
        response.status.should.equal(200);
        response.should.have.property('headers');
        response.headers['content-type'].should.equal('text/plain');
        done();
      });
    });

    it('pass on the provided querystring', function(done){
      app.get('/', function (req, res) {
        req.param('this').should.equal('is');
        req.param('a').should.equal('test');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999?this=is&a=test")
          .request("GET", function(error, response){
        if (!!error) { should.fail(error); }
        response.status.should.equal(200);
        done();
      });
    });

    it('not pass on the provided hash', function(done){
      app.get('/', function (req, res) {
        req.param('x').should.equal('y');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      });
      hottap("http://127.0.0.1:9999?x=y#wakawaka")
          .request("GET", function(error, response){
        if (!!error) { should.fail(error); }
        response.status.should.equal(200);
        done();
      });
    });

    it('handle large response bodies' , function(done){
      this.timeout(10000);
      app.get('/', function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        var long_string = '';
        for(var i=0; i < 1000000; i++){
          long_string += '1234567890';
        }
        res.end(long_string + '\n' + req.method);
      });
      hottap("http://127.0.0.1:9999").request("GET", function(error, response){
        if (!!error) { should.fail(error); }
        response.body.length.should.equal(10000004);
        response.status.should.equal(200);
        response.should.have.property('headers');
        done();
      });
    });

  });

  describe('#json()', function(){

    var server = null;
    var app = null;

    beforeEach(function(done){
      app = express();
      app.use(express.json());
      server = http.createServer(app);
      server.listen(9999, "127.0.0.1", function(err){
        done(err);
      });
    });

    afterEach(function(done){
      server.close(function(err){
        done(err);
      });
    });

    it('set json content-type and accept headers', function(done){

      this.timeout(10000);
      app.post('/', function (req, res) {
        should.exist(req.body);
        req.body.asdf.should.equal('asdf');
        req.headers['content-type'].should.equal('application/json');
        req.headers.accept.should.equal('application/json');
        res.send(req.body);
      });
      hottap("http://127.0.0.1:9999")
          .json("POST", {}, {"asdf" : "asdf"}, function(error, response){
        if (!!error) { should.fail(error); }
        response.body.asdf.should.equal('asdf');
        response.status.should.equal(200);
        response.should.have.property('headers');
        response.headers['content-type'].should.equal('application/json; charset=utf-8');
        done();
      });

    });
    it('allow an empty json object', function(done){

      this.timeout(10000);
      app.post('/', function (req, res) {
        should.exist(req.body);
        ('*' + JSON.stringify(req.body) + '*').should.equal('*{}*');
        req.headers['content-type'].should.equal('application/json');
        req.headers.accept.should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(req.body));
        res.end();
      });
      hottap("http://127.0.0.1:9999")
          .json("POST", {}, {}, function(error, response){
        if (!!error) { should.fail(error); }
        JSON.stringify(response.body).should.equal('{}');
        response.status.should.equal(200);
        response.headers['content-type'].should.equal('application/json');
        done();
      });
     });


    it('not blow up when the response has invalid json', function(done){
      this.timeout(10000);
      app.post('/', function (req, res) {
        should.exist(req.body);
        ('*' + JSON.stringify(req.body) + '*').should.equal('*{}*');
        req.headers['content-type'].should.equal('application/json');
        req.headers.accept.should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write("hey this isn't json!");
        res.end();
      });
      hottap("http://127.0.0.1:9999")
          .json("POST", {}, {}, function(error, response){
        if (!!error) { should.fail(error); }
        response.body.should.equal("hey this isn't json!");
        response.status.should.equal(200);
        response.headers['content-type'].should.equal('application/json');
        done();
      });
     });



   });  // #json
}); // #hottap
