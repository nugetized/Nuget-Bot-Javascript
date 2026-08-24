const {Client, Events, GatewayIntentBits, SlashCommandBuilder, InteractionContextType, ContextMenuCommandBuilder, SlashCommandStringOption } = require(`discord.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('talk')
        .setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        ),

    async execute(interaction) {
        await interaction.reply(`Executing talk`)
    },
}