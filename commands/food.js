const { SlashCommandBuilder } = require('@discordjs/builders');
const http = require("http")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('food')
		.setDescription('gives food image'),
	async execute(interaction) {
		try {
		response = ""
			http.get('http://foodish-api.herokuapp.com/api', async function(res) {
				res.on('data', async function(chunk) {
					response += chunk;
				});
				res.on('end', async function() {
					interaction.reply(JSON.parse(response).image);
				});
			});
		} catch(err) {
			interaction.reply("blast! it didnt work!\n" + err)
		}
	}
};
