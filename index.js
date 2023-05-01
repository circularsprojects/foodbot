const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Intents, Collection } = require('discord.js');
const { InfluxDB, WriteApi, Point } = require('@influxdata/influxdb-client');
const { hostname } = require("os");

// Create a new client instance
const client = new Client({
	shards: 'auto',
	intents: [Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES] // something to do with the response time issue??
});

// Loading commands from the commands folder
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Loading the token from .env file
const dotenv = require('dotenv');
const envFILE = dotenv.config();
const TOKEN = process.env['TOKEN'];
const INFLUXDBTOKEN = envFILE.parsed['INFLUXDBTOKEN'];
const INFLUXDBURL = envFILE.parsed['INFLUXDBURL'];

// Create a new InfluxDB client instance with authentication details
const influx = new InfluxDB({
	url: INFLUXDBURL,
	token: INFLUXDBTOKEN,
});

var commandanalytics = {
	"food": {
		count: 0
	},
	"category": {
		count: 0
	}
}

function submitanalytics() {
	const writeApi = influx.getWriteApi("circularsprojects","food-bot","ns")
	writeApi.useDefaultTags({location: hostname()})
	for (const command in commandanalytics) {
		const point1 = new Point('command')
			.tag('command', command)
			.intField('count', commandanalytics[command].count) // Amount of commands sent in past minute, hour, etc
			.timestamp(new Date())
		writeApi.writePoint(point1)
		commandanalytics[command].count = 0;
	}
	const serverpoint = new Point('servers')
		.intField('count', client.guilds.cache.size)
		.timestamp(new Date())
	writeApi.writePoint(serverpoint)
	try {
		writeApi.close()
	} catch (e) {
		console.error(e)
	}
}

setInterval(submitanalytics, 600000);

// Edit your TEST_GUILD_ID here in the env file for development
const TEST_GUILD_ID = envFILE.parsed['TEST_GUILD_ID'];

// Creating a collection for commands in client
client.commands = new Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
	// Registering the commands in the client
	const CLIENT_ID = client.user.id;
	const rest = new REST({
		version: '9'
	}).setToken(TOKEN);
	(async () => {
		try {
			if (!TEST_GUILD_ID) {
				await rest.put(
					Routes.applicationCommands(CLIENT_ID), {
						body: commands
					},
				);
				console.log('Successfully registered application commands globally');
			} else {
				await rest.put(
					Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID), {
						body: commands
					},
				);
				console.log('Successfully registered application commands for development guild');
			}
		} catch (error) {
			if (error) console.error(error);
		}
	})();
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
        await interaction.deferReply();
		await command.execute(interaction);
		if (commandanalytics[interaction.commandName]) {
			commandanalytics[interaction.commandName].count += 1;
		}
	} catch (error) {
		if (error) console.error(error);
		try {
			await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
		} catch {
			// shits fucked (again)
            try {
                await interaction.channel.send("the bot brokey (again)")
            } catch {
                // too fucked
            }
		}
	}
});


// Login to Discord with your client's token
client.login(TOKEN);
