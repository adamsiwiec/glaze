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
	endpoints.	Therefore, when connecting to the signalling, you will 
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

/*
	The following class is a heavily modified version of the bullet script.
	Copyright (c) 2011-2012, Loïc Hoguin <essen@ninenines.eu>
*/

	$xirsys.class.create({
		namespace : 'socket',
		constructor : function ($url, $httpUrl, $options) {
			this.url = $url;
			this.httpUrl = (!!$httpUrl) ? $httpUrl : $url.replace('ws:', 'http:').replace('wss:', 'https:');
			this.options = $xirsys.extend(this.options, $options);
			this.openSocket();
		},
		fields : {
			isClosed : true,
			readyState : 3,
			url : "",
			httpUrl : "",
			options : {},
			transport : null,
			tn : 0
		},
		methods : {
			xhrSend : function ($data) {
				if (this.readyState != $xirsys.signal.CONNECTING && this.readyState != $xirsys.signal.OPEN) {
					return false
				}
				var self = this;
				$xirsys.ajax.do({
					url: self.httpUrl,
					method: 'POST',
					data: $data,
					headers: {
						'Content-Type' : 'application/x-www-form-urlencoded; charset=utf-8',
						'X-Socket-Transport' : 'xhrPolling'
					}
				}) 
				.done(function ($data) {
					if ($data && $data.length !== 0) {
						self.onmessage({'data': $data});
					}
				});
				return true;
			},
			websocket : function () {
				if (!!this.options && this.options.disableWebSocket) {
					return false;
				}
				if (window.WebSocket) {
					this.transport = window.WebSocket;
				}
				if (window.MozWebSocket && navigator.userAgent.indexOf("Firefox/6.0") == -1) {
					this.transport = window.MozWebSocket;
				}
				if (!!this.transport) {
					return {'heart': true, 'transport': this.transport};
				}
				return null;
			},
			eventPolling : function () {
				if (!!this.options && this.options.disableEventSource) {
					return false;
				}
				if (!window.EventSource) {
					return false;
				}
				var source = new window.EventSource(this.httpUrl);
				source.onopen = function () {
					fake.readyState = $xirsys.signal.OPEN;
					fake.onopen();
				};
				source.onmessage = function ($event) {
					fake.onmessage($event);
				};
				source.onerror = function () {
					source.close();
					source = undefined;
					fake.onerror();
				};
				var fake = {
					readyState: $xirsys.signal.CONNECTING,
					send: this.xhrSend,
					close: function () {
						fake.readyState = $xirsys.signal.CLOSED;
						source.close();
						source = undefined;
						fake.onclose();
					}
				};
				return {'heart': false, 'transport': function () { 
					return fake; 
				}};
			},
			xhrPolling : function () {
				if (!!this.options && this.options.disableXHRPolling) {
					return false;
				}
				var timeout;
				var xhr = null;
				var fake = {
					readyState: $xirsys.signal.CONNECTING,
					send: xhrSend,
					close: function () {
						this.readyState = $xirsys.signal.CLOSED;
						if (xhr) {
							xhr.abort();
							xhr = null;
						}
						clearTimeout(timeout);
						fake.onclose();
					},
					onopen: function () {},
					onmessage: function () {},
					onerror: function () {},
					onclose: function () {}
				};
				self.nextPoll();
				return {'heart': false, 'transport': function () { 
					return fake; 
				}};
			},
			poll : function () {
				xhr = $xirsys.ajax.do({
					url: this.httpUrl,
					method: 'GET',
					data: {},
					headers: {'X-Socket-Transport' : 'xhrPolling'}
				}) 
				.done(function ($data) {
					xhr = null;
					if (fake.readyState == $xirsys.signal.CONNECTING) {
						fake.readyState = $xirsys.signal.OPEN;
						fake.onopen(fake);
					}
					if ($data && $data.length !== 0) {
						fake.onmessage({'data' : $data});
					}
					if (fake.readyState == $xirsys.signal.OPEN) {
						this.nextPoll();
					}
				}) 
				.fail(function (xhr) {
					xhr = null;
					fake.onerror();
				});
			},
			nextPoll : function () {
				timeout = setTimeout(function () {
					this.poll();
				}, 100);
			},
			next : function () {
				var c = 0, 
					s = {
						websocket: this.websocket, 
						eventPolling : this.eventPolling, 
						xhrPolling : this.xhrPolling
					};
				for (var f in s) {
					if (this.tn == c) {
						var t = s[f]();
						if (t) {
							var ret = new t.transport(this.url);
							ret.heart = t.heart;
							return ret;
						}
						this.tn++;
					}
					c++;
				}
				return false;
			},
			openSocket : function () {
				var self = this,
					heartbeat,
					delay = 80,
					delayDefault = 80,
					delayMax = 10000;


				self.readyState = $xirsys.signal.CLOSED,
				self.isClosed = true;
				
				function init() {
					self.isClosed = false;
					self.readyState = $xirsys.signal.CONNECTING; // Should this be readyState or self.readyState?
					self.transport = self.next();

					if (!self.transport) {
						delay = delayDefault;
						self.tn = 0;
						self.ondisconnect();
						setTimeout(function () {init();}, delayMax);
						return false;
					}

					self.transport.onopen = function () {
						delay = delayDefault;

						if (self.transport.heart) {
							heartbeat = setInterval(function () {
								self.send('ping');
								self.onheartbeat();
							}, 20000);
						}

						if (self.readyState != $xirsys.signal.OPEN) {
							self.readyState = $xirsys.signal.OPEN; // Should this be readyState or self.readyState?
							self.onopen();
						}
					};
					self.transport.onclose = function () {
						if (self.isClosed || self.readyState == $xirsys.signal.CLOSED) {
							return;
						}

						self.transport = null;
						clearInterval(heartbeat);

						if (self.readyState == $xirsys.signal.CLOSING) {
							self.readyState = $xirsys.signal.CLOSED;
							self.transport = false;
							self.onclose();
						} else{
							if (self.readyState == $xirsys.signal.CONNECTING) {
								self.tn++;
							}
							delay *= 2;
							if (delay > delayMax) {
								delay = delayMax;
							}
							self.isClosed = true;
							setTimeout(function () {
								init();
							}, delay);
						}
					};
					self.transport.onerror = function ($e) {
						self.onerror($e);
					};
					self.transport.onmessage = function ($e) {
						self.onmessage($e);
					};
				}
				init();

				this.onopen = function () {};
				this.onmessage = function () {};
				this.ondisconnect = function () {};
				this.onclose = function () {};
				this.onheartbeat = function () {};
				this.onerror = function () {};
			},
			send : function ($data) {
				if (!!this.transport) {
					return this.transport.send($data);
				} else {
					return false;
				}
			},
			close : function () {
				this.readyState = $xirsys.signal.CLOSING;
				if (this.transport) {
					this.transport.close();
				}
			},
			setURL : function ($newURL) {
				this.url = $newURL;
			}
		},
		statics : {
			CONNECTING : 0,
			OPEN : 1,
			CLOSING : 2,
			CLOSED : 3
		}
	});
	
	/*********************************************************************************
	 * For full use of this class, see the information at the top of this script.
	 *********************************************************************************/

	$xirsys.class.create({
		namespace : 'signal',
		constructor : function ($url) {
			if (!!$url) {
				$xirsys.signal.wsList = $url + "signal/list?secure=0";
				$xirsys.signal.tokenUrl = $url + "signal/token";
			}
		},
		inherits : $xirsys.socket,
		fields : {
			token : "",
			wsUrl : "",
			sock : null,
			xirsys_opts : null,
			room_key : ''
		},
		methods : {
			connect : function ($opts) {
				var self = this;
				this.room_key = "/" + $opts.domain  +"/" + $opts.application + "/" + $opts.room;
				this.xirsys_opts = $opts;
				self.getToken(null, null, function (td) {
					self.getSocketEndpoints(function (sd) {
						self.sock = new $xirsys.socket(sd + "/" + td); //, {disableWebsocket:true, disableEventSource:true});
						self.sock.onmessage = self.handleService.bind(self);
						self.sock.onopen = self.onOpen.bind(self);
						self.sock.ondisconnect = self.onDisconnect.bind(self);
						self.sock.onclose = self.onClose.bind(self);
						self.sock.onerror = self.onError.bind(self);
					});
				});
			},
			close : function () {
				this.sock.close();
			},
			send : function ($event, $data, $targetUser, $type) {
				var service_pkt = {
					t: "u", // user message service
					m: {
						f: this.room_key + "/" + this.xirsys_opts.username,
						t: $targetUser,
						o: $event
					},
					p: $data
				}
				if (!!$type && ($type == "pub" || $type == "sub")) {
					service_pkt.t = "tm";
					service_pkt.m.o = $type;
				}

				var pkt = JSON.stringify(service_pkt) 
				this.sock.send(pkt);
			},
			// signal_mcu: function ($event,$targetUser) {
			//	 var service_pkt = {
			//		 t: "tm" // turn mcu
			//		 p: {
			//			 f: this.room_key + "/" + this.xirsys_opts.username,
			//			 t: $targetUser,
			//		 },
			//		 m: $event
			//	 }
			//	 var pkt = JSON.stringify(service_pkt) 
			//	 console.log("sending mcu "+pkt);
			//	 this.sock.send(pkt);
			// },
			handleService: function (evt) {
				var pkt = JSON.parse(evt.data);
				if (!pkt.t) {
					this.onError({message : "invalid message received", data : pkt});
				}
				switch (pkt.t) {
				case "u":
					//user signal
					this.handleUserService(pkt);
					break;
				case "tm":
					// turn mcu packet
					this.handleMCUAck(pkt);
					break;
				default:
					console.log("don't know this packet type "+pkt.t);
				}
			},
			handleUserService : function (pkt) {
				//console.log('handleUserService ',pkt);
				var peer = null;
				if (pkt.m.f) {
					peer = pkt.m.f.split("/");
					peer = peer[peer.length -1];
				}
				switch (pkt.m.o) {
					case "peers":
						this.onPeers(pkt.p);
						break;
					case "peer_connected":
						this.onPeerConnected(pkt.m.f);
						break;
					case "peer_removed":
						this.onPeerRemoved(peer);
						break;
					default:
						this.onMessage({type:pkt.m.o, sender:pkt.m.f, data:pkt.p, peer:peer});
						break;
				}
			},
			handleMCUAck : function (pkt) {
				console.log("got an ack from MCU");
			},
			getToken : function ($url, $data, $cb) {
				var self = this;
				$xirsys.ajax.do({
					url: $url || $xirsys.signal.tokenUrl,
					method: 'POST',
					data: $data || self.xirsys_opts
				}) 
				.done(function ($data) {
					if (!!$data.e) {
						self.onError($data.e);
						return;
					}
					self.token = $data.d.token;
					$cb.apply(this, [self.token]);
				});
			},
			getSocketEndpoints : function ($cb) {
				var self = this;
				var p = $xirsys.ajax.do({
					url: $xirsys.signal.wsList,
					method: 'GET',
					data: {}
				}) 
				.done(function ($data) {
					if (!!$data.e) {
						self.onError($data.e);
						return;
					}
					self.wsUrl = $data.d.value + "/v2";
					$cb.apply(this, [self.wsUrl]);
				});
			},
			/*********************************************************************************
			 * Any of these handlers may be overidden for your own functionality.
			 *********************************************************************************/
			onOpen : function () {
				$xirsys.events.getInstance().emit($xirsys.signal.open);
			},
			onPeers : function ($peers) {
				$xirsys.events.getInstance().emit($xirsys.signal.peers, $peers);
			},
			onPeerConnected : function ($peer) {
				$xirsys.events.getInstance().emit($xirsys.signal.peerConnected, $peer);
			},
			onPeerRemoved : function ($peer) {
				$xirsys.events.getInstance().emit($xirsys.signal.peerRemoved, $peer);
			},
			onMessage : function ($msg) {
				$xirsys.events.getInstance().emit($xirsys.signal.message, $msg);
			},
			onDisconnect : function () {
				$xirsys.events.getInstance().emit($xirsys.signal.disconnected);
			},
			onClose : function () {
				$xirsys.events.getInstance().emit($xirsys.signal.closed);
			},
			onError : function ($error) {
				$xirsys.events.getInstance().emit($xirsys.signal.error, $error);
			}
			/*********************************************************************************/
		},
		statics : {
			wsList : $xirsys.baseUrl + "signal/list?secure=1",
			tokenUrl : $xirsys.baseUrl + "signal/token",
			/* events */
			open : "signalling.open",
			peers : "signalling.peers",
			peerConnected : "signalling.peer.connected",
			peerRemoved : "signalling.peer.removed",
			message : "signalling.message",
			disconnected : "signalling.disconnected",
			closed : "signalling.closed",
			error : "signalling.error"
		}
	});

})();
