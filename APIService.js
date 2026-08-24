const Groq = require("groq-sdk")
const dotenv = require("dotenv")

dotenv.config()

const groq = new Groq({
    apiKey: process.env.ai_api_key
})

async function makeApiRequest(finalQuestion) {
    const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
            {
                role: "user",
                content: finalQuestion
            }
        ],
        reasoning_format: "hidden"
    })

    return response.choices[0]?.message?.content || "No response generated."
}

async function getAnswer(question, context) {
    try {
        console.log(`Question asked: ${question}, context:`, context)

        const finalQuestion = `You are a discord bot called Nuget Bot inside a Discord Server, talk like a normal human being, your character limit is 500, here is some context: ${context}, the user asked you the following prompt: ${question}`;

        return await makeApiRequest(finalQuestion)
    } catch (e) {
        console.error(e);
        return `Failed to connect to API homie, heres my error: ${e.message}`
    }
}

module.exports = {getAnswer}