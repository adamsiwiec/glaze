var $ = require('jquery');

var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};

var room = getUrlParameter('room');
var nickname = getUrlParameter('nick');
var count = 0;
$('.chat-count').text(count);
$('.username').text(nickname);
$('.room-name').text(room);

var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    // localVideoEl: '',
    // the id/element dom element that will hold remote videos
    //    remoteVideosEl: '',
    // immediately ask for camera access
	autoRequestMedia: true,
	nick: nickname,
	url: 'https://signal-master-qdoymkqwfc.now.sh',
	media: {
		video: false,
		audio: true
	},
	recieveMedia: {
		video: false,
		audio: true
	}
});

webrtc.on('readyToCall', function () {
    // you can name it anything
	webrtc.joinRoom(room, function (err, res) {
		console.log(err);
	});
});

webrtc.on('videoAdded', function (videoEl, peer) {
	count += 1;
	$('#status').append('<p>' + peer.nick + ' Joined!</p>');
	$('#avatar').append('<div class = \'' + peer.nick + ' col-xs-12 col-sm-6 col-lg-4 avatar-div text-xs-center\'><p class = \'avatar-name ' + peer.nick + '\'>' + peer.nick + '</p> </div>');

	var grammar1;
	var grammar2;
	if (count === 1) {
		grammar1 = 'is';
		grammar2 = 'person';
	} else {
		grammar1 = 'are';
		grammar2 = 'people';
	}
	$('.chat-count').text(count);
});

webrtc.on('videoRemoved', function (videoEl, peer) {
	count -= 1;
	$('#status').append('<p>' + peer.nick + ' left!</p>');
	$('.' + peer.nick).remove();
	$('.chat-count').text(count);
});
