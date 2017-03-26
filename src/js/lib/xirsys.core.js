/*********************************************************************************
  The MIT License (MIT) 

  Copyright (c) 2014 XirSys

  @author: Lee Sylvester

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*********************************************************************************/

var $xirsys = {
  class : {},
  baseUrl : "https://service.xirsys.com/"
};

(function () {

  $xirsys.extend = function (dest, src) {
    for (var prop in src) {
      if (typeof src[prop] === "object" && src[prop] !== null) {
        dest[prop] = dest[prop] || {};
        arguments.callee(dest[prop], src[prop]);
      } else {
        dest[prop] = src[prop];
      }
    }
    return dest;
  };

  $xirsys.isArray = function ($val) {
    return (!!$val) ? 
      $val.constructor == Array : false;
  };

  $xirsys.isString = function ($val) {
    return (typeof $val == 'string');
  };

  $xirsys.class.create = function( param ) {
    var i, namespace, m, part, n,
      segs = [], f = function(){}, ctor = {}, e = {}, o = {}, 
      t = $xirsys,
      h = Object.prototype.hasOwnProperty;
    if ( !param ) {
      return function() {};
    }
    namespace = param.namespace;
    if ( !namespace ) {
      throw new Error( "Please specify the Namespace." );
    }
    if ( 
      namespace.length == 0 || 
      namespace.indexOf( " " ) != -1 || 
      namespace.charAt( 0 ) == '.' || 
      namespace.charAt( namespace.length - 1 ) == '.' || 
      namespace.indexOf( ".." ) != -1 
    ) {
      throw new Error( "Illegal Namespace: " + namespace );
    }
    segs = namespace.split( '.' );
    for ( i = 0; i < segs.length; i++ ) {
      if ( !!t ) t = t[segs[i]];
    }
    if ( !!t ) {
      return t;
    }
    if ( h.call( param, 'constructor' ) ) {
      if ( typeof param.constructor != "function" ) {
        throw new TypeError("Illegal function [" + namespace + ".constructor]!");
      }
      f = param.constructor;
    }
    if ( param['inherits'] ) {
      this['inherits'] = function ( c, p ) {
        for ( m in p) {
          if ( h.call( p, m ) ) {
            c[m] = p[m];
          }
        }
        ctor = function () { this.constructor = c; };
        ctor.prototype = p.prototype;
        c.prototype = new ctor();
        c.__super__ = c.Super = p.prototype;
        m = p = ctor = c = null; // release memory
      };
      this['inherits']( f, param['inherits'] );
    }
    e = function( obj, params, isStatic ) {
      for ( m in params ) {
        if ( h.call( params, m ) ) {
          if (!isStatic) {
            obj.prototype[m] = params[m];
          } else {
            obj[m] = params[m];
          }
        }
      }
    };
    if ( param.methods ) {
      e( f, param.methods );
    }
    if ( !param.fields ) {
      param.fields = {};
    }
    param.fields.className = namespace;
    e( f, param.fields );
    if ( param.statics ) {
      e( f, param.statics, true );
    }
    if ( param.props ) { // styles
      o = f.prototype.props = $.extend( true, {}, f.prototype.props );
      e( o, $.extend( true, {}, param.props ), true );
    }
    // create the specified namespace and append the class to it.
    t = $xirsys;
    for( i = 0; i < segs.length - 1; i++ ) {
      part = segs[i];
      // If there is no property of t with this name, create an empty object.
      if (!t[part]) {
        t[part] = {};
      } else if (typeof t[part] != "object") {
        // If there is already a property, make sure it is an object
        n = segs.slice(0, i).join('.');
        throw new Error(n + " already exists and is not an object");
      }
      t = t[part];
    }
    t[segs[segs.length - 1]] = f;
    namespace = segs = h = t = e = i = null; // release memory
    return f;
  };

  $xirsys.class.create ({
    namespace : 'ajax',
    fields : {
      host : {},
      xhr : null
    },
    methods : {
      request : function ($opts) {
        if (typeof $opts == 'string') {
          $opts = { url: $opts };
        }
        $opts.url = $opts.url || '';
        $opts.method = $opts.method || 'get';
        $opts.data = $opts.data || {};
        return this.process($opts);
      },
      getParams : function ($data, $url) {
        var arr = [], str;
        for (var n in $data) {
          arr.push(n + '=' + encodeURIComponent($data[n]));
        }
        str = arr.join('&');
        if (str != '') {
          return $url ? ($url.indexOf('?') < 0 ? '?' + str : '&' + str) : str;
        }
        return '';
      },
      extend : $xirsys.extend,
      done : function ($cb) {
        this.doneCallback = $cb;
        return this;
      },
      fail : function ($cb) {
        this.failCallback = $cb;
        return this;
      },
      always : function ($cb) {
        this.alwaysCallback = $cb;
        return this;
      },
      setHeaders : function ($headers) {
        for (var n in $headers) {
          this.xhr && this.xhr.setRequestHeader(n, $headers[n]);
        }
      },
      process : function ($opts) {
        var self = this;
        if (window.ActiveXObject) { 
          this.xhr = new ActiveXObject('Microsoft.XMLHTTP');
        } else if (window.XMLHttpRequest) { 
          this.xhr = new XMLHttpRequest(); 
        }
        if (this.xhr) {
          this.xhr.onreadystatechange = function () {
            if (self.xhr.readyState == 4 && self.xhr.status >= 200 && self.xhr.status < 300) {
              var result = self.xhr.responseText;
              if ((!$opts.json || $opts.json === true) && typeof JSON != 'undefined') {
                result = JSON.parse(result);
              }
              self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
            } else if (self.xhr.readyState == 4) {
              self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
            }
            self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
          }
        }
        if ($opts.method.toLowerCase() == 'get') {
          this.xhr.open("GET", $opts.url + self.getParams($opts.data, $opts.url), true);
        } else {
          this.xhr.open($opts.method, $opts.url, true);
          this.setHeaders({
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
          });
        }
        if ($opts.headers && typeof $opts.headers == 'object') {
          this.setHeaders($opts.headers);
        }       
        setTimeout (function () { 
          $opts.method == 'get' ? self.xhr.send() : self.xhr.send(self.getParams($opts.data)); 
        }, 20);
        return this;
      }
    },
    statics : {
      inst : null,
      do : function ($opts) {
        var a = new $xirsys.ajax();
        return a.request($opts);
      }
    }
  });

  /**
   * Events class
   * Events collecting and notifications functions.
   **/
   
  $xirsys.class.create ({
    namespace : 'events',
    fields : {
      delimiter : '.',
      wildcard : '*',
      _stack : {}
    },
    methods : {
      // Add an individual listener handler.
      on : function ($evt, $handler) {
        var pntr = $xirsys.events.getInstance()._getNamespaceSegment($evt);
        if (!this.has($evt, $handler)) {
          pntr._handlers.push($handler);
        }
      },
      // Remove a listener handler.
      remove : function ($evt, $handler) {
        var $pntr = $xirsys.events.getInstance()._getNamespaceSegment($evt);
        $pntr._handlers = $pntr._handlers || [];
        for (var i = 0; i < $pntr._handlers.length; i++) {
          if ($pntr._handlers[i] == $handler || $handler === -1) {
            $pntr._handlers.splice(i);
            return;
          }
        }
      },
      // Removes all listeners for a given event
      flush : function ($events) {
        if ($xirsys.isArray($events)) {
          for (var i = 0; i < $events.length; i++) {
            if (!!$events[i]) {
              this.removeAllListeners($events[i]);
            }
          }
        } else {
          if (!!$events[i]) { //todo: what does it mean?
            this.removeListener($events[i], -1);
          }
        } 
      },
      // Check for a listener, returning true or false.
      has : function ($evt, $handler) { 
        if (!$handler || typeof $handler != 'function') {
          throw 'Event handler must be supplied as a function';
        }
        var pntr = $xirsys.events.getInstance()._getNamespaceSegment ($evt);
        if (!pntr._handlers) {
          pntr._handlers = [];
        }
        var f = false;
        for (var t = 0; t < pntr._handlers.length; t++) {
          if (pntr._handlers[t] == $handler) f = true;
        }
        return f;
      },
      emit : function ($evt /* additional params will be passed to event handlers */) {
        var pntr = $xirsys.events.getInstance()._getNamespaceSegment($evt, true),
          args = Array.prototype.slice.call(arguments, 0);
        args.shift();
        for (var i = 0; i < pntr.length; i++) {
          for (var j = 0; j < pntr[i]._handlers.length; j++) {
            pntr[i]._handlers[j].apply(this, args); 
          }
        }
      },
      // Splits down the passed events into constituent segments, seperated by periods.
      _getNamespaceSegment : function ($evt, $includeWildcards, $arr) {
        var e = $xirsys.isString($evt) ? 
          $evt.split(this.delimiter) : $xirsys.isArray($evt) ? 
            $evt : null;

        if (!e) {
          throw 'Event listener assigned to unknown type';
        }

        var pntr = this._stack;
        for (var i = 0; i < e.length; i++) {
          if (!$xirsys.isString(e[i])) {
            throw 'Event identifier segment not a string value';
          }
          if (e[i] == "_handlers" || (e[i] == this.wildcard && i < e.length - 1)) {
            throw 'Invalid name used in event namespace.';
          }
          pntr = pntr[e[i]] = pntr[e[i]] || {};
        }
        
        pntr._handlers = pntr._handlers || [];
        if ($includeWildcards) {
          if (!$arr || !$xirsys.isArray($arr)) {
            $arr = [];
          }
          $arr.push(pntr);
          
          if (e[e.length - 1] == this.wildcard) {
            e.pop();
          }
          
          if (e.length > 0) {
            e.pop();
            e.push(this.wildcard);
            this._getNamespaceSegment(e, $includeWildcards, $arr);
          }
          return $arr;
        }
        return pntr;
      }
    },
    statics : {
      _instance : null,
      getInstance : function () {
        return $xirsys.events._instance = $xirsys.events._instance || new $xirsys.events();
      }
    }
  });

})();
