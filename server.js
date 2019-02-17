const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");
let users = [];
let messages = [];

mongoose.connect("mongodb://localhost:27017/chatapp");

const ChatSchema = mongoose.Schema({
	username: String,
	msg: String
});

const ChatModel = mongoose.model("chat", ChatSchema);

ChatModel.find((err, result) => {
	if (err) throw err;

	messages = result;
});

io.on("connection", socket => {
	socket.emit('loggedIn', {
		users: users.map(s => s.username),
		messages: messages
	});

	socket.on('newuser', username => {
		console.log(`${username} has arrived at the party.`);
		socket.username = username;
		
		users.push(socket);

		io.emit('userOnline', socket.username);
	});

	socket.on('msg', msg => {
		let message = new ChatModel({
			username: socket.username,
			msg: msg
		});

		message.save((err, result) => {
			if (err) throw err;

			messages.push(result);

			io.emit('msg', result);
		});
	});
	
	// Disconnect
	socket.on("disconnect", () => {
		console.log(`${socket.username} has left the party.`);
		io.emit("userLeft", socket.username);
		users.splice(users.indexOf(socket), 1);
	});
});

http.listen(process.env.PORT || 3000, () => {
	console.log("Listening on port %s", process.env.PORT || 3000);
});