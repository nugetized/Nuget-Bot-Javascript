const {Client, Events, GatewayIntentBits, SlashCommandBuilder, InteractionContextType, ContextMenuCommandBuilder, codeBlock } = require(`discord.js`)
const { Lexer } = require('../Custom Language src/lexer.js')
const { Parser } = require('../Custom Language src/parser')
const { Interpreter } = require('../Custom Language src/interpreter')

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function formatInput(input) {
    if (!input) return "No input given"

    let currentIndent = 0
    const lines = input
        .replace(/;/g, ';\n')
        .replace(/{/g, '{\n')
        .replace(/}/g, '\n}\n')
        .split('\n')

    const formatted = []

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line) continue

        const startsWithClose = line.startsWith('}')

        if (startsWithClose) {
            currentIndent = Math.max(0, currentIndent - 1)
        }

        formatted.push('    '.repeat(currentIndent) + line)

        if (line.endsWith('{')) {
            currentIndent++
        }
        
        let nextLine = ""
        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim()) {
                nextLine = lines[j].trim()
                break
            }
        }

        if (startsWithClose && !nextLine.startsWith('else')) {
            formatted.push('')
        }
    }

    return formatted.join('\n')
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('input el code, hermano')
        .setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        )
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('input el code, hermano')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply()

        let input = interaction.options.getString('input')
        let formattedInput = formatInput(input)
        let start = new Date().getTime()

        let interpreter = null

        try {
            let lexer = new Lexer(input)
            let parser = new Parser(lexer)
            interpreter = new Interpreter(parser)
            
            interpreter.interpret()

            let outputEntries = Array.from(interpreter.OUTPUT || [])
            let joined = outputEntries.join('\n');
            let outputText = outputEntries.length > 0 
                ? (joined.length > 1000 ? joined.slice(0, 1000) + '...' : joined) 
                : '- No output';
            let time = new Date().getTime() - start

            if (randomInt(1, 25) !== 1) {
                await interaction.editReply('***Input:***\n```ts\n' + formattedInput + '```\n***Output:*** ```ts\n' + outputText + '```\n-# Finished in ' + time + ' ms')
            } else {
                await interaction.editReply('no')
            }
        } catch(e) {
            console.error(e)

            let outputEntries = interpreter && interpreter.OUTPUT ? Array.from(interpreter.OUTPUT) : []
            console.log(outputEntries.toString())
            let outputText = outputEntries.length > 0 ? outputEntries.join('\n') + '\n' : '- No output messages found, Error message:\n'

            let errorMessage = e.message ? e.message.replace("Error: ", "") : String(e)

            await interaction.editReply('# yo this shit ass "language" errored :rofl:\n\n***Input:***\n```ts\n' + formattedInput + '```\n***Output:***```ts\n' + outputText + errorMessage + '```\n-# ^ find your error here incase you didnt know DUMBASS')
        }
    },
}