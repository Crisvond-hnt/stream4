import type { PlainMessage, SlashCommand } from '@towns-protocol/proto'

const commands = [
    {
        name: 'help',
        description: 'Get help with bot commands',
    },
    {
        name: 'time',
        description: 'Get the current time',
    },
    {
        name: 'slickrick',
        description: 'Get a SlickRick quote (50¢ per quote)',
    },
] as const satisfies PlainMessage<SlashCommand>[]

export default commands
