const BrowserWindow = require('electron').remote.BrowserWindow;
const path = require('path');
const url = require('url');
const remote = require('electron').remote;
const $ = require('jquery');
const ipc = require('electron').ipcRenderer;

function validate(room, nick) {
	return (room && nick) && nick.indexOf(' ') === -1;
}

let create = $('#manage-window');
let createForm = $(`
    <form>
    <div class = 'form-group'>
    <input class = 'room text-center form-control' autofocus placeholder = 'e.g google conference' type='text'>
    <p class = 'room-error'>
    </p>
    <br>
    <input class = 'nick text-center form-control' placeholder = 'e.g Adam' type='text'>
    <p class = 'nick-error'>
    </p>
    <p class = 'space-error'>
    </p>
    </div>
    <button class = 'btn btn-primary col-2 offset-10' type='submit' >
    Go
    </button
    </form>`);
let win;

create.on('click', function (event) {
	create.replaceWith(createForm);
});

createForm.on('submit', function (event) {
	event.preventDefault();
	$('.nick-error').text('');
	$('.room-error').text('');
	$('.space-error').text('');

	if (validate($('.room').val(), $('.nick').val())) {

		ipc.send('close-starter', {
			room: $('.room').val(),
			nick: $('.nick').val()

		});
		var current = remote.getCurrentWindow();
		current.close();


	} else {
		if (!$('.nick').val()) {
			$('.nick-error').text('Please put in a Username');
		}
		if (!$('.room').val()) {
			$('.room-error').text('Please put in a room');
		}
		if ($('.nick').val().indexOf(' ') !== -1) {
			$('.space-error').text('Please remove the space from your Username');
		}
	}
});
