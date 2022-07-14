if (!window.localStorage.username || window.localStorage.username == "") {
	window.location.href = path.dir() + "/src/login.html?path=" + path.dir();
}

function logout() {
	window.localStorage.username = ""
	window.localStorage.password = ""
	window.location.href = path.dir() + "/src/login.html?path=" + path.dir();
}

const channel = "rraenee"
const chat = document.getElementById('chat')
const userInput = document.getElementById("user_input_message");

const client = new tmi.Client({
	connection: {
		secure: true,
		reconnect: true,
	},
	identity: {
		username: window.localStorage.username,
		password: window.localStorage.password
	},
	channels: [channel],
});

client.connect().then(() => {
	console.log("Connected")
});

function formatEmotes(text, emotes) {
	let splitText = text.split('');
	for (let i in emotes) {
		let e = emotes[i];
		for (let j in e) {
			let mote = e[j];
			if (typeof mote == 'string') {
				mote = mote.split('-');
				mote = [parseInt(mote[0]), parseInt(mote[1])];
				let length = mote[1] - mote[0],
					empty = Array.apply(null, new Array(length + 1)).map(function () { return '' });
				splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
				splitText.splice(mote[0], 1, '<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
			}
		}
	}
	return splitText.join('');
}

let channelBadgeDatas
async function getBadgesHTML(badges, channelID) {
	let html = ""

	// Global badges
	let globalBadgeDatas
	await $.getJSON('https://badges.twitch.tv/v1/badges/global/display', function(data) {
		globalBadgeDatas = data
	});
	globalBadgeDatas = globalBadgeDatas.badge_sets
	
	for (const property in badges) {
		if (globalBadgeDatas[property]) {
			let version = 5
			while (version >= 0) {
				if (globalBadgeDatas[property].versions[version]) {
					html = html + "<img class='badge' src='" + globalBadgeDatas[property].versions[version].image_url_1x + "'>"
					break
				}
				version -= 1
			}
		}
	}

	// Channel badges - subscriber
	if (badges.subscriber) {
		if (!channelBadgeDatas) {
			await $.getJSON('https://badges.twitch.tv/v1/badges/channels/'+channelID+'/display', function(data) {
				channelBadgeDatas = data
			});
			channelBadgeDatas = channelBadgeDatas.badge_sets
		}
		html = html + "<img class='badge' src='" + channelBadgeDatas.subscriber.versions[badges.subscriber].image_url_1x + "'>"
	}

	return html
}

async function writeMessageToPage(type, datas) {
	if (type == 'chat-message') {
		let userBadges = await getBadgesHTML(datas.tags.badges, datas.channelID)
		let messageElement = document.createElement('p')
		let messageWithEmotes = formatEmotes(datas.message, datas.tags.emotes);
		messageElement.innerHTML = userBadges + " " + datas.tags['display-name'] + ': ' + messageWithEmotes
		chat.appendChild(messageElement)
	} else if (type == 'chat-input-message') {
		let messageElement = document.createElement('p')
		messageElement.innerHTML = 'You' + ': ' + datas.message
		chat.appendChild(messageElement)
	} else if (type == 'chat-notification') {
		let messageElement = document.createElement('p')
		messageElement.innerHTML = datas.message
		chat.appendChild(messageElement)
	}
}

function sendMessage() {
	client.say('#' + channel, userInput.value)
	writeMessageToPage('chat-input-message', {message: userInput.value})
	userInput.value = ""
}

client.on('message', (channel, tags, message, self) => {
	if (self) return;
	writeMessageToPage("chat-message", {message, tags, channelID: tags['room-id']})
});

userInput.addEventListener("keypress", function(event) {
	if (event.key === "Enter") {
	  event.preventDefault();
	  document.getElementById("user_message_send").click();
	}
});