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


$(document).ready(function() {
	$.post("https://service.xirsys.com/room", {
        ident: "adamsiwiec",
        secret: "138a1524-c7ec-11e6-9123-fb8fc78d0e76",
        domain: "www.adamsiwiec.com",
        application: "glaze",
        room: room,
        secure: 1
    },
    function(data, status) {
        //var url = "https://" + data.d.iceServers[0].url.substring(5);
		console.log(data)

		var webrtc = new $xirsys.simplewebrtc();
		   webrtc.connect(
			   xirsysConnect.data,
			   {

				   autoRequestMedia: true, // immediately ask for camera access
				   media: {
	                   video: false,
	                   audio: true
	               },
	               recieveMedia: {
	                   video: false,
	                   audio: true
	               },
				   nick: nickname,
				   detectSpeakingEvents: false,
				   autoAdjustMic: false
			   },
			   application
		   );
		   function application ($inst) {

			   webrtc.prepareRoom(room);
			   webrtc.on('readyToCall', function () {
				   // you can name it anything
				   webrtc.joinRoom(room);
			   });

        webrtc.on('videoAdded', function(videoEl, peer) {
            count += 1;
            $('#status').append('<p>' + peer.nick + ' Joined!</p>');
            $('#avatar').append('<div class = \'' + peer.nick + ' col-12 col-sm-6 col-lg-4 avatar-div text-center\'><p class = \'avatar-name ' + peer.nick + '\'>' + peer.nick + '</p> </div>');

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

        webrtc.on('videoRemoved', function(videoEl, peer) {
            count -= 1;
            $('#status').append('<p>' + peer.nick + ' left!</p>');
            $('.' + peer.nick).remove();
            $('.chat-count').text(count);
        });
}
    });

});
