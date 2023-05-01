const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const http = require("http")
const { InfluxDB, WriteApi, Point } = require('@influxdata/influxdb-client');
const { hostname } = require("os");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('category')
		.setDescription('gives you a certain category of food')
		.addStringOption(option => 
			option.setName('category')
				.setDescription('category of food')
				.setRequired(true)
				.addChoices(
					{ name: "biryani", value: "biryani" },
					{ name: "burger", value: "burger" },
					{ name: "butter chicken", value: "butter-chicken" },
					{ name: "dessert", value: "dessert" },
					{ name: "dosa", value: "dosa" },
					{ name: "idly", value: "idly" },
					{ name: "pasta", value: "pasta" },
					{ name: "pizza", value: "pizza" },
					{ name: "rice", value: "rice" },
					{ name: "samosa", value: "samosa" }
			)),
	async execute(interaction) {
		try {
		response = ""
		const category = interaction.options.getString('category')
			//http.get('http://foodish-api.herokuapp.com/api', async function(res) {
            try {
                http.get(`http://server.circularsprojects.com:3000/api/images/${category}`, async function(res) {
                    res.on('data', async function(chunk) {
                        response += chunk;
                    });
                    res.on('end', async function() {
                        try {
                            const foodEmbed = new EmbedBuilder()
                                // the API endpoint does not return a category, but it can be derived from the url. (https://api:3000/images/CATEGORY/image)
                                // set the embed title to that category derived from JSON.parse(response).image
                                .setTitle("food image")
                                .setColor(0x0099FF)
                                .setDescription(`category: ${category}`)
                                .setImage(JSON.parse(response).image)
                            //console.log(foodEmbed);
                            //interaction.editReply(JSON.parse(response).image);
                            await interaction.editReply({ embeds: [foodEmbed.data] });
                        } catch(e) {
                            interaction.editReply("**Something's not adding up.**\nAn error has occurred in fetching a food image. This is most likely due to the API being down, or I'm doing maintenance on the bot.\nIf you want, you can contact me in the food-bot support discord server, and I'll try to fix it.\n\n`Error trace: " + e + "`")
                        }
                    });
                });
            } catch {
                interaction.editReply("**Something's *really* not adding up.**\nA fatal error has occurred in fetching a food image. Most likely, this is just a temporary hiccup. Try again later.\nIf the bot still doesn't work, you can contact me in the food-bot support discord server, and I'll try to fix it.")
            }
		} catch(err) {
			interaction.editReply("blast! it didnt work!\n" + err)
		}
	}
};
