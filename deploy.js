const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')

async function deployCommands() {
    const commands = []
    const commandsPath = path.join(__dirname, 'commands')
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON())
        }
    }

    const rest = new REST().setToken(process.env.token)

    try {
        await rest.put(
            Routes.applicationCommands(process.env.clientId),
            { body: commands }
        )
        console.log('Successfully registered application commands.')
    } catch (error) {
        console.error(error)
    }
}

module.exports = { deployCommands }