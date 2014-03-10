io = io.connect()

// Send the ready event.
io.emit('join_room', "testing");

// Listen for the new visitor event.
io.on('num_clients', function(data) {
    $('body').append('<p>Num Clients is ' +  data.clients + '</p>');
    io.emit("add_message", {"room": "testing", "Username": "divit", "Message": "this is a simple test"});
});

io.on("new_message", function (data) {
	$("body").append("<p>Username: " + data.Username + " said: " + data.Message);
})