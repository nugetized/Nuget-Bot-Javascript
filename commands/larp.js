const {Client, Events, GatewayIntentBits, SlashCommandBuilder, InteractionContextType, ContextMenuCommandBuilder } = require(`discord.js`)

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('larp')
        .setDescription("Nuget bot will meow for you")
        .setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        ),

    async execute(interaction) {
        if (randomInt(1,2) == 1) {
            await interaction.reply('Meow >_<')
        } else {
            await interaction.reply('Purrr :3')
        }
    },
}