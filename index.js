const fs = require('node:fs')
const path = require('node:path')
const { deployCommands } = require('./deploy.js')

const dotenv = require("dotenv")
dotenv.config()

const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js')

const token = process.env.token

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
})

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) return

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing el command, here is el error: ' + error,
                // flags: MessageFlags.Ephemeral
            })
        } else {
            await interaction.reply({
                content: 'There was an error while executing el command, here is el error: ' + error,
                // flags: MessageFlags.Ephemeral
            })
        }
    }
})

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

async function start() {
    console.log("Deploying commands...")

    // await deployCommands()

    console.log("Deployed commands")
    console.log("Attempting sign in")

    client.login(token)
}

start()