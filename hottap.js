var node_url = require('url');
var http = require('http');
var https = require('https');

function hottap(url){
  return new Url(url);
}

var getPort = function(url_object){
  if (!!url_object.port){
    return url_object.port;
  } else {
    if (url_object.protocol == 'https:'){
       return '443';
    } else {
       return '80';
    }
  }
};

var getProtocol = function(url_object){
  if (typeof(url_object.protocol) == 'undefined'){
    throw 'Missing protocol.  Supported protocols are http and https.';
  } else {
    var protocol = url_object.protocol;
    if (!~(["https:", "http:"].indexOf(protocol))){
      throw 'Unknown protocol.  Supported protocols are http and https.';
    }
    if (protocol[protocol.length - 1] == ':'){
      protocol = protocol.substring(0, protocol.length -1);
    }
    return protocol;
  }
};

var getQueryString = function(url_object){
  var result = {},
      queryString = url_object.query,
      re = /([^&=]+)=([^&]*)/g,
      match;

  match = re.exec(queryString);
  while (match) {
    result[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    match = re.exec(queryString);
  }

  return result;
};

var get_params = function(argz){

  var method = argz[0] || null;
  var cb;

  // the last param is always the callback.
  if ((argz.length > 1) && (typeof(argz[argz.length - 1]) == 'function') ){
    cb = argz[argz.length - 1];
  } else {
    throw "request() expects a callback for the last parameter.";
  }

  // the second param should be 'headers' if it's not the callback.
  var headers = {};
  if (argz.length > 2){
      headers = argz[1];
      if (typeof(headers) != 'object'){
        throw 'Argument Error: Expected an (headers) object for the second argument.';
      }
  }

  // the third param should be the body if it's not the callback.
  var body = '';
  if (argz.length > 3){
    body = argz[2];
  }

  return { "method" : method,
           "body" : body,
           "headers" : headers,
           "cb" : cb};

};



// get *everything* after the hostname/port
var optionPath = function(http_obj){
  var qstr = '';
  var pairs = [];
  for (var name in http_obj.query){
    pairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(http_obj.query[name]));
  }
  qstr = pairs.join("&");
  if (qstr !== ''){
    qstr = '?' + qstr;
  }
  var hashstr = (http_obj.hash === '') ? '' : '#' + http_obj.hash;
  return http_obj.path + qstr + hashstr;
};



var Url = function(url){
  this.url_object = node_url.parse(url);
  var o = this.url_object;
  this.protocol = getProtocol(o);
  this.query = getQueryString(o);
  this.hash = '';
  if (o.hash){
    this.hash = o.hash.substring(1);
  }
  if (!o.hostname){
    throw "Missing hostname.";
  }
  this.hostname = o.hostname;
  this.port = getPort(o);
  this.auth = o.auth || '';
  //console.log(o);
  this.path = o.pathname || '/';
};

Url.prototype.toString = function(){
  var portstr = ':' + this.port;
  if (this.protocol == 'http' && this.port == '80') portstr = '';
  if (this.protocol == 'https' && this.port == '443') portstr = '';
  var authstr = (this.auth === '') ? '' : this.auth + '@';
  return this.protocol + '://' + authstr + this.hostname + portstr + optionPath(this);
};

Url.prototype.json = function(){
  var params = get_params(arguments);
  var method = params.method;
  var cb = params.cb;
  var headers = params.headers;
  var body = params.body;
  headers['content-type'] = 'application/json';
  headers.accept = 'application/json';
  body = JSON.stringify(body);
  var json_cb = function(error, response){
    if (!!response && !!response.body){
      try {
        response.body = JSON.parse(response.body);
      } catch (ex) {
        // do nothing.
        // we want to catch any possible parsing exception
        // and just leave the body as-is
      }
    }
    cb(error, response);
  };
  this.request(method, headers, body, json_cb);
};


Url.prototype.request = function(){
  var params = get_params(arguments);
  var method = params.method;
  var cb = params.cb;
  var headers = params.headers;
  var body = params.body;

  if (!!body && body !== ''){
    headers['Content-Length'] = body.length;
  }

  var options = {
    host: this.hostname,
    port: this.port,
    path: optionPath(this),
    headers: headers,
    method: method
  };

  var protocol_lib = (this.protocol == 'https') ? https : http;
  var req = protocol_lib.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function(){
      var response = {"status" : res.statusCode, "headers" : res.headers, "body" : body };
      //console.log(response);
      cb(null, response);

    });
  });

  req.on('error', function(e) {
    cb(e);
  });

  if (!!body && body !== ''){
    req.write(body);
  }

  req.end();

};

exports.hottap = hottap;
