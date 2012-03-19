const should = require('should');
var http = require('http');
var https = require('https');
const express = require('express');
const fs = require('fs');
const hottap = require('../hottap').hottap;



describe('hottap', function(){

  it('should return its url as a string', function(done){
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash")
    hottap("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash")
    hottap("http://asdf.com").toString().should.equal("http://asdf.com/")
    done();
  });

  it('should return its querystring as an object', function(done){
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.asdf.should.equal("1234")
    hottap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.qwer.should.equal("qwer")
    done();
  });
  
  it('should return its auth value as a string', function(done){
    hottap("http://someauth@asdf.com:8080/asdf#hash").auth.should.equal("someauth")
    done();
  });

  it('should return its hash value as a string', function(done){
    hottap("http://asdf.com:8080/asdf#hash").hash.should.equal("hash")
    done();
  });

  it('should return an empty string for a hash if it has no value', function(done){
    hottap("http://asdf.com:8080/asdf#").hash.should.equal("")
    done();
  });

  it('should return an empty string for a hash if it is unset', function(done){
    hottap("http://asdf.com:8080/asdf").hash.should.equal("")
    done();
  });

  it('should return its port when it is http and the port is not defined', function(done){
    hottap("http://asdf.com/asdf").port.should.equal('80')
    done();
  });

  it('should return its port when it is http and the port is not defined', function(done){
    hottap("https://asdf.com/asdf").port.should.equal('443')
    done();
  });

  it('should return its port when it is defined', function(done){
    hottap("http://asdf.com:82/asdf").port.should.equal('82')
    done();
  });

  it('should return its protocol when it is http', function(done){
    hottap("http://asdf.com").protocol.should.equal('http')
    done();
  });

  it('should return its protocol when it is https', function(done){
    hottap("https://asdf.com").protocol.should.equal('https')
    done();
  });

  it('should throw an exception when the protocol is unknown', function(done){
    try {
      hottap("ftp://asdf.com")
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Unknown protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('should throw an exception when the protocol cannot be determined', function(done){
    try {
      hottap("~~~~")
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Missing protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('should raise exception when hostname does not exist', function(done){
      try {
        hottap("http://").hostname;
        should.fail("Exception wasn't thrown!");
      } catch (err) {
        err.should.equal("Missing hostname.");
        done();
      }
  });

  it('should have a hostname', function(done){
      hottap("http://asdf.museum:8080/this/is/the/path").hostname.should.equal('asdf.museum');
      done();
  });

  it('should return its path when set', function(done){
      hottap("http://asdf.museum/this/is/the/path").path.should.equal('/this/is/the/path');
      done();
  });

  it('should return its path as / when not set', function(done){
      hottap("http://asdf.museum").path.should.equal('/');
      done();
  });

  describe('#request()', function(){

    it('should support a simple GET', function(done){
      var  server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })

      server.listen(1337, "127.0.0.1", function(){

          hottap("http://127.0.0.1:1337").request("GET", function(error, response){
            if (!!error) { should.fail(error); }
            response.body.should.equal('Hello World\nGET');
            response.status.should.equal(200);
            response.should.have.property('headers');
            server.close();
            done();
          });

      });
    });

    it('should throw an exception if it does not get a callback parameter', function(done){
          try {
            hottap("http://127.0.0.1:1337").request("GET")
            should.fail("exception was not raised")
          } catch (err){
            err.should.equal('request() expects a callback for the last parameter.')
            done();
          }
    });

    it('should support a GET with headers', function(done){
      var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      });
      server.listen(1337, "127.0.0.1", function(){

          hottap("http://127.0.0.1:1337/api/message/")
            .request("GET", 
                     {"Content-Type" : "application/json"}, 
                     function(error, response){
                        if (!!error) { should.fail(error); }
                        response.body.should.equal('Hello World\nGET');
                        response.status.should.equal(200);
                        response.should.have.property('headers');
                        server.close();
                        done();
                    }
            );

      });
    });

    it('should throw an error for requests with an invalid headers object', function(done){
      try {
          hottap("http://127.0.0.1:1337/api/message/").request("GET", 42, 
                   function(err, response){ should.fail("should not get this far!") }
          );
      } catch (err) {
          err.should.equal("Argument Error: Expected an (headers) object for the second argument.");
          done();
      }
    });

    it('should support a POST with headers and body', function(done){
      var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method );
      });
      server.listen(1337, "127.0.0.1", function(){

          hottap("http://127.0.0.1:1337/api/message/")
            .request("POST",
                     {"Content-Type" : "application/json"},
                     '{"some" : "json"}',
                     function(error, response){
                        if (!!error) { should.fail(error); }
                        response.body.should.equal('Hello World\nPOST');
                        response.status.should.equal(200);
                        response.should.have.property('headers');
                        server.close();
                        done();
                    }
            );

      });
    });

    it('should return errors for failed requests', function(done){
      var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      });
      server.listen(1337, "127.0.0.1", function(){

          hottap("http://127.0.0.1:1337/api/message/")
            .request("UNKNOWN_METHOD",
                     {"content-type" : "application/json"},
                     '{"some" : "json"}',
                     function(err, response){
                        err.should.have.property('message');
                        server.close();
                        done();
                    }
            );

      });
    });

    it('should support GET via https', function(done){
      var options = {
        key: fs.readFileSync(__dirname + '/agent2-key.pem'),
        cert: fs.readFileSync(__dirname + '/agent2-cert.pem')
      };
      var app = express.createServer(options);
      app.get('/', function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })

      app.listen(1337, "127.0.0.1", function(){
          hottap("https://127.0.0.1:1337").request("GET", function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.body.should.equal('Hello World\nGET');
            response.status.should.equal(200);
            response.should.have.property('headers');
            done();
          });

      });
    });

    it('should pass on the provided headers', function(done){
      var app = express.createServer();
      app.get('/', function (req, res) {
        req.headers['content-type'].should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337")
              .request("GET", {'Content-Type' : 'application/json'}, function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.body.should.equal('Hello World\nGET');
            response.status.should.equal(200);
            response.should.have.property('headers');
            response.headers['content-type'].should.equal('text/plain');
            done();
          });
      });
    });

    it('should pass on the provided querystring', function(done){
      var app = express.createServer();
      app.get('/', function (req, res) {
        req.param('this').should.equal('is')
        req.param('a').should.equal('test')
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337?this=is&a=test")
              .request("GET", function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.status.should.equal(200);
            done();
          });
      });
    });

    it('should not pass on the provided hash', function(done){
      var app = express.createServer();
      app.get('/', function (req, res) {
        req.param('x').should.equal('y')
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337?x=y#wakawaka")
              .request("GET", function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.status.should.equal(200);
            done();
          });
      });
    });

    it('should handle large response bodies' , function(done){
      this.timeout(10000);
      var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        var long_string = '';
        for(var i=0; i < 1000000; i++){
          long_string += '1234567890'
        }
        res.end(long_string + '\n' + req.method);
      })

      server.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337").request("GET", function(error, response){
            server.close();
            if (!!error) { should.fail(error); }
            response.body.length.should.equal(10000004);
            response.status.should.equal(200);
            response.should.have.property('headers');
            done();
          });

      });
    });

  });

  describe('#json()', function(){
    it('should set json content-type and accept headers', function(done){

      this.timeout(10000);
      // patch express
      express.bodyParser.parse['application/json'] = function(req, options, fn){
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          try {
            req.body = JSON.parse(buf)
          } catch (err){
            req.error = buf;
          }
          fn();
        });
      };

      var app = express.createServer();
      app.configure(function(){
        app.use(express.bodyParser());
      });
      app.post('/', function (req, res) {
        should.exist(req.body);
        req.body['asdf'].should.equal('asdf');
        req.headers['content-type'].should.equal('application/json');
        req.headers['accept'].should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(req.body));
        res.end();
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337")
              .json("POST", {}, {"asdf" : "asdf"}, function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.body['asdf'].should.equal('asdf');
            response.status.should.equal(200);
            response.should.have.property('headers');
            response.headers['content-type'].should.equal('application/json');
            done();
          });
      });

    });
    it('should allow an empty json object', function(done){

      this.timeout(10000);
      // patch express
      express.bodyParser.parse['application/json'] = function(req, options, fn){
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          try {
            req.body = JSON.parse(buf)
          } catch (err){
            req.error = buf;
          }
          fn();
        });
      };

      var app = express.createServer();
      app.configure(function(){
        app.use(express.bodyParser());
      });
      app.post('/', function (req, res) {
        should.exist(req.body);
        ('*' + JSON.stringify(req.body) + '*').should.equal('*{}*');
        req.headers['content-type'].should.equal('application/json');
        req.headers['accept'].should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(req.body));
        res.end();
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337")
              .json("POST", {}, {}, function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            JSON.stringify(response.body).should.equal('{}');
            response.status.should.equal(200);
            response.headers['content-type'].should.equal('application/json');
            done();
          });
      });
     });


    it('should not blow up when the response has invalid json', function(done){

      this.timeout(10000);
      // patch express
      express.bodyParser.parse['application/json'] = function(req, options, fn){
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          try {
            req.body = JSON.parse(buf)
          } catch (err){
            req.error = buf;
          }
          fn();
        });
      };

      var app = express.createServer();
      app.configure(function(){
        app.use(express.bodyParser());
      });
      app.post('/', function (req, res) {
        should.exist(req.body);
        ('*' + JSON.stringify(req.body) + '*').should.equal('*{}*');
        req.headers['content-type'].should.equal('application/json');
        req.headers['accept'].should.equal('application/json');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write("hey this isn't json!");
        res.end();
      })
      app.listen(1337, "127.0.0.1", function(){
          hottap("http://127.0.0.1:1337")
              .json("POST", {}, {}, function(error, response){
            app.close();
            if (!!error) { should.fail(error); }
            response.body.should.equal("hey this isn't json!");
            response.status.should.equal(200);
            response.headers['content-type'].should.equal('application/json');
            done();
          });
      });
     });



   });  // #json
}); // #hottap
