const {Client, Events, GatewayIntentBits, SlashCommandBuilder, InteractionContextType, ContextMenuCommandBuilder, codeBlock } = require(`discord.js`)
const { Lexer } = require('../Custom Language src/lexer.js')
const { Parser } = require('../Custom Language src/parser.js')
const { Interpreter } = require('../Custom Language src/interpreter.js')

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
        let updateInterval = null

        const makeMessage = (outputEntries, executionTime, isDone = false) => {
            let recentEntries = outputEntries.slice(-20)

            let joined = recentEntries.join('\n')
            let outputText = outputEntries.length > 0
                ? (outputEntries.length > 20 ? '...\n' + joined : joined) 
                : '- No output'
            
            let currentStatus = isDone
                ? `-# Finished in ${new Intl.NumberFormat().format(executionTime)} ms`
                : `-# Running...`
            
            return `***Input:***\n\`\`\`ts\n${formattedInput}\`\`\`\n***Output:*** \`\`\`ts\n${outputText}\`\`\`\n${currentStatus}`
        }

        try {
            let lexer = new Lexer(input)
            let parser = new Parser(lexer)
            interpreter = new Interpreter(parser)

            let lastUpdateCount = 0

            updateInterval = setInterval(async () => {
                let currentLogs = Array.from(interpreter.OUTPUT || [])
                if (currentLogs.length > lastUpdateCount) {
                    lastUpdateCount = currentLogs.length
                    await interaction.editReply(makeMessage(currentLogs)).catch(() => {})
                }
            }, 500)
            
            await interpreter.interpret()

            clearInterval(updateInterval)

            let outputEntries = Array.from(interpreter.OUTPUT || [])
            let time = new Date().getTime() - start

            if (randomInt(1, 25) !== 1) {
                await interaction.editReply(makeMessage(outputEntries, time, true))
            } else {
                await interaction.editReply('no')
            }
        } catch(e) {
            if (updateInterval) clearInterval(updateInterval)
            console.error(e)

            let outputEntries = interpreter && interpreter.OUTPUT ? Array.from(interpreter.OUTPUT) : []
            console.log(outputEntries.toString())
            let outputText = outputEntries.length > 0 ? outputEntries.join('\n') + '\n' : '- No output messages found, Error message:\n'

            let errorMessage = e.message ? e.message.replace("Error: ", "") : String(e)

            await interaction.editReply('# yo this shit ass "language" errored :rofl:\n\n***Input:***\n```ts\n' + formattedInput + '```\n***Output:***```ts\n' + outputText + errorMessage + '```\n-# ^ find your error here incase you didnt know DUMBASS')
        }
    },
}