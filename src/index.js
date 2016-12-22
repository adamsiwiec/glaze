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
console.log(nickname);
$('.room').append("<span class = 'display'>" + room + "<span>");


var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    //localVideoEl: '',
    // the id/element dom element that will hold remote videos
    //    remoteVideosEl: '',
    // immediately ask for camera access
    autoRequestMedia: true,
    nick: nickname,
    url: "https://signal-master-qdoymkqwfc.now.sh",
    media: {
        video: false,
        audio: true
    },
    recieveMedia: {
        video: false,
        audio: true
    }
});

webrtc.on('readyToCall', function() {
    // you can name it anything
    webrtc.joinRoom(room, function(err, res) {
        console.log(err);
    });
});

webrtc.on('videoAdded', function(videoEl, peer) {
    count += 1;
    console.log("NICK", peer.nick);
    $('#status').append("<p>" + peer.nick + " Joined !</p>");

    var grammar1;
    var grammar2;
    if (count === 1) {
        grammar1 = "is";
        grammar2 = "person";
    } else {
        grammar1 = "are";
        grammar2 = "people"
    }
    $('#status').append("<p>There " + grammar1 + " " + count + " other " + grammar2 + " in the chat!</p>");

});

webrtc.on('videoRemoved', function(videoEl, peer) {
    count -= 1;
    $('#status').append("<p>" + peer.nick + " left !</p>");
    $('#status').append("<p>There are " + count + " other people in the chat!</p>");


});
