const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents, Collection } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const http = require('http');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

const dotenv = require('dotenv');
const envfile = dotenv.config();
const TOKEN = process.env['TOKEN'];

const TEST_GUILD_ID = envfile.parsed['TEST_GUILD_ID'];

var foodcommands = 0;
var prevservers = 0;

function getMembers() {
	var members = 0;
        client.guilds.cache.forEach(guild => {
                members = members + guild.memberCount
        })
	return members;
}

function hourlyLogs() {
	var prev = client.guilds.cache.size - prevservers
	var trend = "";
	if (prev === 0) {
		trend = "<:neutral:872285391808520272>"
	} else if (prev === 1) {
		trend = "<:single_positive:872285391888203856>"
	} else if (prev === 2) {
		trend = "<:double_positive:872285391221297153>"
	} else if (prev > 2) {
                trend = "<:triple_positive:872285391921770516>"
	} else if (prev === -1) {
                trend = "<:single_negative:872285392022405240>"
	} else if (prev === -2) {
                trend = "<:double_negative:872285391623946261>"
	} else if (prev < -2) {
                trend = "<:triple_negative:872285392886444032>"
	}
	client.guilds.cache.get("746367091560415312").channels.cache.get("867229420909625384").send(`Statistics: ${getMembers()} members across ${client.guilds.cache.size} ${trend} servers, and ${foodcommands} food commands sent this hour.`).catch(error => console.log("ha, " + error))
	foodcommands = 0;
	prevservers = client.guilds.cache.size;
}

const commands = {
    'ping': {
        execute: function(interaction) {
            interaction.reply({ content: 'pong' });
        },
        data: new SlashCommandBuilder().setName('ping').setDescription('ping pong haha')
    },
    'food': {
        execute: function(interaction) {
            foodcommands++;
            // send a get request to http://server.circularsprojects.com:3000/api and reply with the response
            var response = "";
            try {
                http.get('http://foodish-api.herokuapp.com/api', async function(res) {
                    res.on('data', async function(chunk) {
                        response += chunk;
                    });
                    res.on('end', async function() {
                        interaction.editReply(JSON.parse(response).image);
                    });
                });
            } catch {
                response = "";
                try {
                    http.get('http://localhost:3000/api', async function(res) {
                        res.on('data', async function(chunk) {
                            response += chunk;
                        });
                        res.on('end', async function() {
                            interaction.editReply({ content: JSON.parse(response).image });
                        });
                    });
                } catch {
                    interaction.reply({ content: 'unable to reach local or remote foodish api, check back later.' });
                }
            }
        },
        data: new SlashCommandBuilder().setName('food').setDescription('sends a picture of food')
    }
};
var commandData = [];

client.commands = new Collection();

for (command in commands) {
    commandData.push(commands[command].data.toJSON());
    client.commands.set(commands[command].data.name, commands[command]);
}

client.once('ready', () => {
	console.log('Ready!');
    client.user.setActivity(`with food`);
    setInterval(function() {
        if (new Date().getMinutes() === 0) {
            hourlyLogs();
        }
    }, 60000);
	if (process.argv.slice(2)[0] == "register") {
	const CLIENT_ID = client.user.id;
	const rest = new REST({
		version: '9'
	}).setToken(TOKEN);
	(async () => {
		try {
			if (!TEST_GUILD_ID) {
				await rest.put(
					Routes.applicationCommands(CLIENT_ID), {
						body: commandData
					},
				);
				console.log('Successfully registered application commands globally');
			} else {
				await rest.put(
					Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID), {
						body: commandData
					},
				);
				console.log('Successfully registered application commands for development guild');
			}
		} catch (error) {
			if (error) console.error(error);
		}
	})();
	}
});

client.on('messageCreate', msg => {
    console.log("measge")
    if (msg.content.toLowerCase() == "f!food") {
        msg.reply('food-bot has moved over to slash commands. Due to this, you will not be able to use f!food or any other commands unless an admin reinvites the bot with slash command permissions.')
    }
});

client.on('interactionCreate', interaction => {
	console.log("interaction created")
	try {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	    interaction.deferReply();
	    command.execute(interaction);
	} catch (error) {
		try {
			if (error) console.error(error);
			interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		} catch {}
	}
});

client.login(TOKEN);

