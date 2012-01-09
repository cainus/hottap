const should = require('should');
var http = require('http');
var https = require('https');
const HotTap = require('../hottap').HotTap;



describe('HotTap', function(){

  it('should return its url as a string', function(done){
    HotTap("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf.com:8080/asdf?asdf=1234&qwer=4321#hash")
    HotTap("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash").toString().should.equal("http://asdf:1234@asdf.com:8080/asdf?asdf=1234&qwer=4321#hash")
    HotTap("http://asdf.com").toString().should.equal("http://asdf.com/")
    done();
  });

  it('should return its querystring as an object', function(done){
    HotTap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.asdf.should.equal("1234")
    HotTap("http://asdf.com:8080/asdf?asdf=1234&qwer=qwer#somehash").query.qwer.should.equal("qwer")
    done();
  });
  
  it('should return its auth value as a string', function(done){
    HotTap("http://someauth@asdf.com:8080/asdf#hash").auth.should.equal("someauth")
    done();
  });

  it('should return its hash value as a string', function(done){
    HotTap("http://asdf.com:8080/asdf#hash").hash.should.equal("hash")
    done();
  });

  it('should return an empty string for a hash if it has no value', function(done){
    HotTap("http://asdf.com:8080/asdf#").hash.should.equal("")
    done();
  });

  it('should return an empty string for a hash if it is unset', function(done){
    HotTap("http://asdf.com:8080/asdf").hash.should.equal("")
    done();
  });

  it('should return its port when it is http and the port is not defined', function(done){
    HotTap("http://asdf.com/asdf").port.should.equal('80')
    done();
  });

  it('should return its port when it is http and the port is not defined', function(done){
    HotTap("https://asdf.com/asdf").port.should.equal('443')
    done();
  });

  it('should return its port when it is defined', function(done){
    HotTap("http://asdf.com:82/asdf").port.should.equal('82')
    done();
  });

  it('should return its protocol when it is http', function(done){
    HotTap("http://asdf.com").protocol.should.equal('http')
    done();
  });

  it('should return its protocol when it is https', function(done){
    HotTap("https://asdf.com").protocol.should.equal('https')
    done();
  });

  it('should throw an exception when the protocol is unknown', function(done){
    try {
      HotTap("ftp://asdf.com")
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Unknown protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('should throw an exception when the protocol cannot be determined', function(done){
    try {
      HotTap("~~~~")
      should.fail("Exception wasn't thrown!");
    } catch (err){
      err.should.equal("Missing protocol.  Supported protocols are http and https.");
      done();
    }
  });

  it('should raise exception when hostname does not exist', function(done){
      try {
        HotTap("http://").hostname;
        should.fail("Exception wasn't thrown!");
      } catch (err) {
        err.should.equal("Missing hostname.");
        done();
      }
  });

  it('should have a hostname', function(done){
      HotTap("http://asdf.museum:8080/this/is/the/path").hostname.should.equal('asdf.museum');
      done();
  });

  it('should have return its path when set', function(done){
      HotTap("http://asdf.museum/this/is/the/path").path.should.equal('/this/is/the/path');
      done();
  });

  it('should return its path as / when not set', function(done){
      HotTap("http://asdf.museum").path.should.equal('/');
      done();
  });

  describe('#request()', function(){

    it('should support a simple GET', function(done){
      var  server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })

      server.listen(1337, "127.0.0.1", function(){

          HotTap("http://127.0.0.1:1337").request("GET", function(error, response){
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
            HotTap("http://127.0.0.1:1337").request("GET")
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

          HotTap("http://127.0.0.1:1337/api/message/")
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
          HotTap("http://127.0.0.1:1337/api/message/").request("GET", 42, 
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

          HotTap("http://127.0.0.1:1337/api/message/")
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

          HotTap("http://127.0.0.1:1337/api/message/")
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

    // pending because I don't know how to make an https server that listens
    it('should support GET via https' /* , function(done){
      var server = https.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n' + req.method);
      })

      server.listen(1337, "127.0.0.1", function(){
          HotTap("https://127.0.0.1:1337").request("GET", function(error, response){
            if (!!error) { should.fail(error); }
            response.body.should.equal('Hello World\nGET');
            response.status.should.equal(200);
            response.should.have.property('headers');
            server.close();
            done();
          });

      });
    }*/);

    it('should pass on the provided headers');  // how do I check this?  better server?
    it('should pass on the provided querystring');  // how do I check this?  better server?
    it('should pass on the provided hash');  // how do I check this?  better server?

    // pending because it takes too long, and mocha's timeout seems to be buggy
    it('should handle large response bodies' /*, function(done){
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
          HotTap("http://127.0.0.1:1337").request("GET", function(error, response){
            if (!!error) { should.fail(error); }
            response.body.length.should.equal(10000004);
            response.status.should.equal(200);
            response.should.have.property('headers');
            server.close();
            done();
          });

      });
    
    }*/);

  });

});
