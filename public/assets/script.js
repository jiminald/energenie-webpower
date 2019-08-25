// Prepare a variable to hold our configuration. We set it up now, because it can be accessed from anywhere
var config = null;

// This is the handle for the timer that checks the state of the sockets
var interval = null;

// Function to load the config file
function load_config() {
	// Open an AJAX request
	var xhttp = new XMLHttpRequest();

	// When we recieve the data, this will handle it
	xhttp.onreadystatechange = function() {
		// This makes sure that the request has finished, and it was a success before we start looking at what we've recived
		if (this.readyState == 4 && this.status == 200) {
			// Take the JSON configuration and convert it into a Javascript object. This lets us access the configuration settings
			config = JSON.parse(this.responseText);

			create_power_toggles();
		} // End of if "Making sure the request has finished and it was a success"
	}; // End of function "Whenever the AJAX request changes state, see if we need to do anything"

	// With the AJAX request, we would like to "open" the following page
	xhttp.open("GET", "/config.json", true);

	// Make the AJAX request we've setup
	xhttp.send();
} // End of function "load_config"

// This function uses the config and creates the toggle switches for each socket we want to control
function create_power_toggles() {
	// Shortcut our way to the list of sockets
	var sockets = config.sockets;

	// This is a placeholder for the HTML we're about to generate.
	var html = '';

	// Take the sockets variable and loop through each one in there
	Object.keys(sockets).forEach(function(key) {
		// Lets keep a shortcut to the socket we're currently working on.
		var socket = sockets[key];

		// Now, on index.html, we have a section with the ID "template". In here is what we want the socket HTML to look like.
		// This action will take a copy of that template, so we can modify it for the socket control we're making
		var switch_html = document.getElementById('template').innerHTML;

		// In the template, we have the text "[socket_id]". What we want to do is replace that text with the actual socket ID.
		switch_html = switch_html.replace('[socket_id]', key);

		// Using the same idea as above, lets add the socket name
		switch_html = switch_html.replace('[name]', socket.name);

		// Now, lets add that back to our HTML variable.
		// As we're in a loop, we need to store our new socket HTML outside of it, otherwise we'll loose everything we've done
		html += switch_html;
	});

	// Now the loop has finished, lets take the generated HTML for each of the sockets and put that out to the browser.
	document.getElementById('sockets').innerHTML = html;

	// We're using Bootstrap Toggle switches, to make it easier to know what the state of the socket it and to control it.
	// This will trigger the Bootstrap Toggle script to do the work it needs to do to make the toggle switch
	$('#sockets .custom-switch input[type="checkbox"]').bootstrapToggle();

	// Now, we need to make sure that the toggle switches read correctly. By default, they show as "off"
	// We may already have a socket that is on, and this function will configure the toggles to match the socket
	poll_state();

	// This code hooks onto the toggle switches. Everytime their state changes (going from "on" to "off", or "off" to "on")
	// we want to send a signal back to our python script saying to turn the socket "on" of "off"
	$('#sockets .custom-switch input[type="checkbox"]').on('change', function() {
		// The keyword "this", means the element (in our case the toggle) that triggered the change event

		// Here, we get the socket ID
		var socket_id = $(this).attr('data-socket-id');

		// Right now, we dont know what action we need to perform. Instead we set a variable up to be ready for that.
		var action = null;

		// Switch is an easier way to handle multiple if/then/else commands. It also helps you to see what actions need to be done for multiple states
		// Here we're using the "checked" state of the toggle (which means "on" in our case)
		// If the toggle has just been checked (turned on), we want to turn on the socket.
		// If the toggle has just been unchecked (turned off), then we want to turn off the socket
		switch ($(this).prop('checked')) {
			case true:
				action = 'on';
			break;

			case false:
				action = 'off';
			break;
		}

		// Now we know the socket ID from earlier, and we've determined what action needs to be done.
		// Lets send that back to our python script to do that action.
		send_state_action(socket_id, action);
    }); // End of function "Toggle on change event"
} // End of function "create_power_toggles"

// This function calls back to our python script to see if the state of any of our sockets has changed.
// If it has, we'll reflect that change on the screen
function poll_state() {
	// Shortcut our way to the list of sockets
	var sockets = config.sockets;

	// Take the sockets variable and loop through each one in there
	Object.keys(sockets).forEach(function(key) {

		// Poll for "known" state
		get_state(key, function(current_state) {
			if (current_state.state == "true") { // If the socket is on, then lets turn the toggle on
				$('[data-socket-id="'+key+'"]').data("bs.toggle").on(true);
			} else { // If the socket it off, then turn the toggle off also
				$('[data-socket-id="'+key+'"]').data("bs.toggle").off(true);
			} // End of if "Is the socket on or off"
		}); // End of function "Getting the socket state"
	}); // End of foreach "Looping sockets"
} // End of function "poll_state"

// Function to get a socket state
function get_state(socket_id, callback) {
	// Open an AJAX request
	var xhttp = new XMLHttpRequest();

	// When we recieve the data, this will handle it
	xhttp.onreadystatechange = function() {
		// This makes sure that the request has finished, and it was a success before we start looking at what we've recived
		if (this.readyState == 4 && this.status == 200) {
			// Take the JSON response and convert it into a Javascript object. Then pass it back to the function that is waiting for the result
			if (typeof callback === 'function') {
                callback(JSON.parse(this.responseText));
			} // End of if "Is the callback parameter a function"
		} // End of if "Making sure the request has finished and it was a success"
	}; // End of function "Whenever the AJAX request changes state, see if we need to do anything"

	// With the AJAX request, we would like to "open" the following page
	xhttp.open("GET", "/state/"+socket_id, true);

	// Make the AJAX request we've setup
	xhttp.send();
} // End of function "get_state"

// Function to set a socket state
function send_state_action(socket_id, action) {
	// Open an AJAX request
	var xhttp = new XMLHttpRequest();

	// With the AJAX request, we would like to "open" the following page
	xhttp.open("GET", "/state/"+socket_id+"/"+action, true);

	// Make the AJAX request we've setup
	xhttp.send();
} // End of function "send_state_action"


// Now, when the page has finished loading everything it needs, start our Javascript
$(document).ready(function() {
	// Load the config from the server.
	// This will start everything off
	load_config();

	// Set a timer to run every 3 seconds to check the state of the sockets.
	// We do this, so if another user has turned one of the sockets on or off, we can see it on our screen
	interval = setInterval(poll_state, 3000);
}); // End of function "document ready"
