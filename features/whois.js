"use strict";
const
	Promise = require("bluebird"),
	db = Promise.promisifyAll(require("../lib/db")),
	phrases = require("../lib/phrases");

let bot_user;

function messageReceived(message) {
	const messageAsync = Promise.promisifyAll(message);
	const channelAsync = Promise.promisifyAll(message.channel);

	if (message.content.match(new RegExp(`^!${phrases.get("WHOIS_WHOIS")} (.*)?$`, "i"))) {
		if (message.content.indexOf("@") === -1) return; // No mentions? No answer
		const user = [];
		user.id = message.content.split("@")[1].split(">").join("");
		channelAsync.startTypingAsync();

			// Get the GW2 account data by user
			db.getAccountByUserAsync(user.id)
				.then(account => {
				if (user.id === bot_user.id) throw new Error("bot user");
				if (!account) throw new Error("unknown user");

				// Construct message
				if (user.id === message.author.id) return phrases.get("WHOIS_SELF", { account_name: account.name });
				else return phrases.get("WHOIS_KNOWN", { user: "<@" + user.id + ">", account_name: account.name });
			})
			.catch(err => {
				// Capture errors and construct proper fail message
				switch (err.message) {
					case "bot user":
						return phrases.get("WHOIS_BOT", { user: "<@" + bot_user.id + ">" });
					case "unknown user":
						return phrases.get("WHOIS_UNKNOWN");
					default:
						console.log(`Error in whois command initiated by ${message.author.username}#${message.author.discriminator}: ${err.message}`);
						return;
				}
			})
			.then(text => messageAsync.replyAsync(text));
			channelAsync.stopTypingAsync();
	}
}

module.exports = bot => {
	bot.on("message", messageReceived);
	bot.on("ready", () => {
		bot_user = bot.user;
	})
};
