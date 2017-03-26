/*********************************************************************************
  The MIT License (MIT) 

  Copyright (c) 2014 XirSys

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

  ********************************************************************************

  This script provides functionality for connecting to the 
  XirSys signalling platform.

  No external libraries are required. However, if supporting an
  older browser (earlier than Internet Explorer 8, Firefox 3.1, 
  Safari 4, and Chrome 3), then you may want to use the open
  source JSON library by Douglas Crockford :
   (https://github.com/douglascrockford/JSON-js) 

  If using the XirSys signalling for testing, you may want to forgo
  using a secure server based token handler (see the XirSys example 
  getToken.php script) for acquiring data from the XirSys service 
  endpoints.  Therefore, when connecting to the signalling, you will 
  need to provide all the information needed by that endpoint.

  For example:

  var s = new $xirsys.signal();
  s.connect({
    'username' : 'name_of_user_connecting',
    'ident' : 'your_ident',
    'secret' : 'your_secret_key',
    'domain' : 'your_domain',
    'application' : 'your_application_name',
    'room' : 'your_room_name'
  });

  However, if you wish to connect via your own token handler, then you
  will need to provide the URL to the class constructor, and connect 
  only with the data needed by your token handler.

  var s = new $xirsys.signal("/getToken.php");
  s.connect({
    'username' : 'name_of_user_connecting',
    'password' : 'users_password',
    'room' : 'your_room_name'
  });

  The XirSys signal client provides a number of callback handlers for
  intercepting data. If you are using the signal class with one of the
  XirSys WebRTC classes, you will probably not need to extend many of
  these. However, they are there for your use. See at the end of this
  script for a list of these.

*********************************************************************************/

'use strict';

(function () {

  var cls = $xirsys.class.create({
    namespace : 'connection',
    inherits: $xirsys.signal,
    constructor : function ($inst, $url, $opts) {
      cls.Super.constructor.call(this, $url);
      this.inst = $inst;
      this.opts = $opts || {};
      this.opts.secure = $opts.secure || 1;
      this.peers = {};
    },
    methods : {
      disconnect: function () {
        this.close();
      },
      emit: function ($type, $payload, $cb) {
        switch ($type) {
          case 'message':
            if (!!$payload.to)
              this.send($type, $payload, $payload.to, $payload.type);
            else
              this.send($type, $payload);
            break;
          case 'create':
            this.createRoom($payload, $cb);
            break;
          case 'join':
            this.joinRoom($payload, $cb);
            break;
          case 'leave':
            this.disconnect();
            break;
          default:
            this.send($type, $payload);
        }
      }, 
      on: function ($evt, $fn) {
        $xirsys.events.getInstance().on($evt, $fn);
      },
      getSessionid: function () {
        this.sessionId = this.sessionId || ((this.xirsys_opts && this.xirsys_opts.username) || new Date().getTime());
        return this.sessionId;
      },
      createRoom: function ($name, $cb) {
        var self = this;
        this.inst.xirsysRequest($xirsys.simplewebrtc.roomUrl, function ($a) {
          self.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl, function ($i) {
            if (!!$i.e) {
              console.error("Could not get ICE string", $i.e);
              return;
            }
            self.setupRoom($name, $i.d.iceServers);
            $cb.apply(self, [(!!$a.e && $a.e != "room_exists") ? $a.e : null, $name]);
          });
        });
      },
      joinRoom: function ($name, $cb) {
        var self = this;
        this.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl, function ($i) {
          if (!!$i.e) {
            console.error("Could not get ICE string", $i.e);
            return;
          }
          self.setupRoom($name, $i.d.iceServers);
          self.joinCB = $cb;
        });
      },
      setupRoom: function ($room, $ice) {
        this.opts.room = $room;
        this.opts.username = this.opts.username || this.getSessionid();
        this.peers = {};
        this.connect(this.opts);
        var stun = $ice.filter(function(i) {
          return i.url.startsWith('stun');
        });
        var turn = $ice.filter(function(i) {
          return i.url.startsWith('turn');
        });
        $xirsys.events.getInstance().emit('stunservers', stun);
        $xirsys.events.getInstance().emit('turnservers', turn);
      },
      getIceServers: function () {
        this.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl, function ($idata) {
          var ice = $idata.d.iceServers, len = ice.length, s = [], t = [];
          for (var i = 0; i < len; i++) {
            if (ice[i].url.startsWith("stun"))
              s.push(ice[i]);
            else
              t.push(ice[i]);
          }
          $xirsys.events.getInstance().emit('stunservers', s);
          setInterval(function() {
            $xirsys.events.getInstance().emit('turnservers', t);
          }, 50);
        });
      },
      addPeer : function ($peer) {
        if ($peer == this.opts.username) return;
        for (var i in this.peers) {
          if (i == $peer)
            return;
        }
        this.peers[$peer] = {type: "video"};
      },
      removePeer : function ($peer) {
        for (var i in this.peers) {
          if (i == $peer) {
            this.peers[i] = null;
            return;
          }
        }
      },
      onMessage : function ($pkt) {
        cls.Super.onMessage.call();
        $xirsys.events.getInstance().emit($pkt.type, $pkt.data);
      },
      onOpen : function () {
        cls.Super.onOpen.call();
        $xirsys.events.getInstance().emit('open');
      },
      onPeers : function ($peers) {
        cls.Super.onPeers.call(this, $peers);
        for (var i = 0, l = $peers.users.length; i < l; i++) {
          this.addPeer($peers.users[i]);
        }
        if (!!this.joinCB)
          this.joinCB.apply(this, [null, {clients:this.peers}]);
      },
      onPeerConnected : function ($peer) {
        cls.Super.onPeerConnected.call(this, $peer);
        this.addPeer($peer);
      },
      onPeerRemoved : function ($peer) {
        cls.Super.onPeerRemoved.call(this, $peer);
        $xirsys.events.getInstance().emit('remove', $peer);
      }
    }
  });

})();