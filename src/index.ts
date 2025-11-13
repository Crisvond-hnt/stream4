import { makeTownsBot } from '@towns-protocol/bot'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { formatEther } from 'viem'
import commands from './commands'

const bot = await makeTownsBot(process.env.APP_PRIVATE_DATA!, process.env.JWT_SECRET!, {
    commands,
})

// Track quote requests waiting for payment (messageId -> userId)
const pendingQuoteRequests = new Map<string, string>()

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
            '• `/slickrick` - Get a SlickRick quote (50¢ per quote!)\n\n' +
            '**Message Triggers:**\n\n' +
            "• Mention me - I'll respond with wisdom\n" +
            "• React with 👋 - I'll wave back\n" +
            '• Say "hello" - I\'ll greet you back\n' +
            '• Say "ping" - I\'ll show latency\n' +
            '• Say "react" - I\'ll add a reaction\n\n' +
            '**💰 SlickRick Pay-Per-Quote:**\n' +
            'Each quote costs 50¢ - tip the request message to get your wisdom!',
    )
})

bot.onSlashCommand('time', async (handler, { channelId }) => {
    const currentTime = new Date().toLocaleString()
    await handler.sendMessage(channelId, `Current time: ${currentTime} ⏰`)
})

bot.onSlashCommand('slickrick', async (handler, { channelId, userId }) => {
    // Send payment request message
    const requestMessage = await handler.sendMessage(
        channelId,
        '💰 **SlickRick Quote Request**\n\n' +
            '🎤 Tip this message **50¢** (0.00015 ETH) to get your wisdom!\n\n' +
            '"Get right or get left, fool!"',
    )

    // Track this request
    pendingQuoteRequests.set(requestMessage.eventId, userId)
})

// Handle tips for SlickRick quotes
bot.onTip(async (handler, { channelId, userId, receiverAddress, amount, messageId }) => {
    // Check if the tip is for the bot
    const isForBot = receiverAddress === bot.botId || receiverAddress === bot.appAddress

    if (!isForBot) return

    // Check if this tip is for a quote request
    const requestUserId = pendingQuoteRequests.get(messageId)

    if (requestUserId) {
        // Convert tip amount to ETH
        const tipAmount = parseFloat(formatEther(amount))

        // Check if tip is at least 50¢ worth (assuming 1 ETH = $3000, 50¢ = ~0.00015 ETH)
        if (tipAmount >= 0.00015) {
            // Payment accepted - send a random quote
            const randomQuote = slickRickQuotes[Math.floor(Math.random() * slickRickQuotes.length)]

            await handler.sendMessage(
                channelId,
                `💰 Payment received: ${tipAmount.toFixed(5)} ETH\n\n` +
                    `🎤 **SlickRick says:**\n\n"${randomQuote}"\n\n` +
                    '💸 Want another? Run `/slickrick` again!',
            )

            // Remove the pending request
            pendingQuoteRequests.delete(messageId)
        } else {
            await handler.sendMessage(
                channelId,
                `🙏 Thanks for the tip, but you need at least 50¢ (0.00015 ETH) for a quote!\n\n` +
                    `You sent: ${tipAmount.toFixed(6)} ETH`,
            )
        }
    } else {
        // General tip, not for a quote
        const tipAmount = parseFloat(formatEther(amount))
        await handler.sendMessage(
            channelId,
            `💰 Thanks for the ${tipAmount.toFixed(5)} ETH tip, fool!\n\n` +
                '🎤 Want a SlickRick quote? Use `/slickrick` and tip 50¢!',
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
