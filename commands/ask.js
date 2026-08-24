const {Client, Events, GatewayIntentBits, SlashCommandBuilder, InteractionContextType, ContextMenuCommandBuilder } = require(`discord.js`)
const { getAnswer } = require('../APIService')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask Nuget Bot a question! (he is stupid)')
        .setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        )
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("question")
                .setRequired(true)
        ),

    async execute(interaction) {
        const question = interaction.options.getString("question");

        await interaction.deferReply();

        const recentMessages = await interaction.channel?.messages.fetch({ limit: 5 });

        const chatHistory = recentMessages && recentMessages.size > 0
            ? Array.from(recentMessages.values())
                .reverse()
                .map(m => `[${m.author.displayName || m.author.username}]: ${m.content}`)
                .join(' | ')
            : "None";

        const context = `Channel: #${interaction.channel?.name || "Direct Message"} | User: ${interaction.user.username} | Chat History: ${chatHistory}`;

        const answer = await getAnswer(question, context);

        const fullReply = `**Question:** ${question}\n**Answer:** ${answer}`;

        if (fullReply.length > 2000) {
            await interaction.editReply(`**Answer:** ${answer.slice(0, 1900)}...`);
        } else {
            await interaction.editReply(fullReply);
        }
    }
}