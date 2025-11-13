import { makeTownsBot } from '@towns-protocol/bot'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { formatEther } from 'viem'
import commands from './commands'

const bot = await makeTownsBot(process.env.APP_PRIVATE_DATA!, process.env.JWT_SECRET!, {
    commands,
})

// Track users who have paid the $1 tip for SlickRick quotes
const paidUsers = new Map<string, Date>()

// SlickRick quotes collection
const slickRickQuotes = [
    "Get right or get left, fool!",
    "You can't handle the truth, but you better handle these bars!",
    "I ain't got time for peasants, I'm too busy being legendary!",
    "If you ain't first, you last - and I'm always first!",
    "Money talks, broke people walk - which one are you?",
    "I got 99 problems but being broke ain't one!",
    "Stay scheming, stay dreaming, stay winning!",
    "Life's a game and I'm playing chess while y'all playing checkers!",
    "Keep your friends close and your money closer!",
    "Success is the best revenge, but money is a close second!",
    "I'm not lucky, I'm blessed - there's a difference!",
    "Hustle beats talent when talent doesn't hustle!",
    "If it don't make dollars, it don't make sense!",
    "I'm allergic to broke - it makes me break out in success!",
    "Real recognize real, and you looking unfamiliar!",
]

bot.onSlashCommand('help', async (handler, { channelId }) => {
    await handler.sendMessage(
        channelId,
        '**Available Commands:**\n\n' +
            '• `/help` - Show this help message\n' +
            '• `/time` - Get the current time\n' +
            '• `/slickrick` - Get a SlickRick quote (tip $1 first!)\n\n' +
            '**Message Triggers:**\n\n' +
            "• Mention me - I'll respond with wisdom\n" +
            "• React with 👋 - I'll wave back\n" +
            '• Say "hello" - I\'ll greet you back\n' +
            '• Say "ping" - I\'ll show latency\n' +
            '• Say "react" - I\'ll add a reaction\n\n' +
            '**💰 SlickRick Premium Access:**\n' +
            'Tip me $1 to unlock unlimited SlickRick quotes!',
    )
})

bot.onSlashCommand('time', async (handler, { channelId }) => {
    const currentTime = new Date().toLocaleString()
    await handler.sendMessage(channelId, `Current time: ${currentTime} ⏰`)
})

bot.onSlashCommand('slickrick', async (handler, { channelId, userId }) => {
    // Check if user has paid the $1 tip
    if (!paidUsers.has(userId)) {
        await handler.sendMessage(
            channelId,
            '🚫 Hold up, fool! You need to tip me $1 first to access SlickRick quotes!\n\n' +
                '💰 Tip me $1 and unlock unlimited wisdom!\n\n' +
                'Tip this bot message to get access.',
        )
        return
    }

    // User has paid - give them a random quote
    const randomQuote = slickRickQuotes[Math.floor(Math.random() * slickRickQuotes.length)]
    await handler.sendMessage(channelId, `🎤 **SlickRick says:**\n\n"${randomQuote}"`)
})

// Handle tips to unlock SlickRick quotes
bot.onTip(async (handler, { channelId, userId, receiverAddress, amount }) => {
    // Check if the tip is for the bot
    const isForBot = receiverAddress === bot.botId || receiverAddress === bot.appAddress

    if (!isForBot) return

    // Convert tip amount to ETH
    const tipAmount = parseFloat(formatEther(amount))

    // Check if tip is at least $1 worth (assuming 1 ETH = $3000, $1 = ~0.00033 ETH)
    // For simplicity, we'll accept any tip >= 0.0003 ETH (~$1)
    if (tipAmount >= 0.0003) {
        paidUsers.set(userId, new Date())

        await handler.sendMessage(
            channelId,
            `💰 Thank you for the ${tipAmount.toFixed(4)} ETH tip!\n\n` +
                '✅ You now have **unlimited access** to SlickRick quotes!\n\n' +
                'Use `/slickrick` anytime to get your wisdom, fool! 🎤',
        )
    } else {
        await handler.sendMessage(
            channelId,
            `🙏 Thanks for the tip, but you need at least $1 worth (0.0003 ETH) to unlock SlickRick quotes!\n\n` +
                `You sent: ${tipAmount.toFixed(6)} ETH`,
        )
    }
})

bot.onMessage(async (handler, { message, channelId, eventId, createdAt, isMentioned }) => {
    // Check if bot was mentioned
    if (isMentioned) {
        await handler.sendMessage(channelId, "Whats up fool! Check the AGENTS.md for knowledge 📚")
        return
    }


    if (message.includes('hello')) {
        await handler.sendMessage(channelId, 'Hello there! 👋')
        return
    }
    if (message.includes('ping')) {
        const now = new Date()
        await handler.sendMessage(channelId, `Pong! 🏓 ${now.getTime() - createdAt.getTime()}ms`)
        return
    }
    if (message.includes('react')) {
        await handler.sendReaction(channelId, eventId, '👍')
        return
    }
})

bot.onReaction(async (handler, { reaction, channelId }) => {
    if (reaction === '👋') {
        await handler.sendMessage(channelId, 'I saw your wave! 👋')
    }
})
const { jwtMiddleware, handler } = bot.start()

const app = new Hono()
app.use(logger())
app.post('/webhook', jwtMiddleware, handler)

export default app
