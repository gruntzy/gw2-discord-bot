var
	Promise = require('bluebird'),
	config = require('config'),
	phrases = require('../lib/phrases');


const invite_channel_id = config.has('invite.channel_id') ? config.get('invite.channel_id') : null;
const bot_id = config.get('discord.clientid');

// Generates a temporary invite link :
function messageReceived(message) {
	var cmd = new RegExp('^!' + phrases.get('INVITE_INVITE') + '$', 'i');
	if (!message.content.match(cmd)) return;

	var messageAsync = Promise.promisifyAll(message);
	var channelAsync = Promise.promisifyAll(message.channel);

	channelAsync.startTyping();
	Promise.resolve()
		.then(() => {
			// Check if user has permission to make invites
			var member = message.channel.guild.members.get(message.author.id);
			if (!member.hasPermission("CREATE_INSTANT_INVITE")) throw new Error('no invite permission');
		})
		.then(() => {
			if (!invite_channel_id) throw new Error('no invite channel');
			const invite_channel = message.channel.guild.channels.get(invite_channel_id);
			if (!invite_channel) throw new Error('invite channel not found');
			return invite_channel;
		})
		.then(channel => channel.createInvite({
			"temporary": true,
			"maxAge": 1800,
			"maxUses": 10
		}))
		.then(invite => {
			var color = message.channel.guild.members.get(bot_id).highestRole.color;
			messageAsync.replyAsync(phrases.get("INVITE_REPLY", {
				channel: invite.channel.name,
			}), {embed: {
				"description": invite.url,
				"color": color
			}})
		})
		.then(reply => {

		})
		.catch((err) => {
			if (err.message === 'no invite permission') return messageAsync.replyAsync(phrases.get("INVITE_NO_PERMISSION"));
			if (err.message === "no invite channel") return messageAsync.replyAsync(phrases.get("INVITE_NO_CHANNEL"));
			if (err.message === "no invite channel") return messageAsync.replyAsync(phrases.get("INVITE_CHANNEL_NOT_FOUND"));
			console.error(err.stack);
			return messageAsync.replyAsync(phrases.get("CORE_ERROR"));
		})
	channelAsync.stopTypingAsync();

}

module.exports = function(bot) {
	bot.on("message", messageReceived);
}
