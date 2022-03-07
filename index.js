const { Client, Intents } = require('discord.js')
const { startsWith, toLower, split } = require('lodash')
require('dotenv').config()
const { initializeApp } = require('firebase/app')
const GMGN = require('./gmgn')

const { prefix } = require('./constants')

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

const config = {
  databaseURL: `${process.env.FIREBASE_REALTIMEDB_URL}`,
}

initializeApp(config)

client.once('ready', () => {
  console.log('The bot is online')
})

client.on('messageCreate', (msg) => {
  if (msg.author.username === client.user.username) {
    return
  }

  const [command] = split(msg.content, ' ', 1)

  switch (toLower(command)) {
    case `${prefix}help`: {
      msg.channel.send(`Command List\nGM: Type gm continously\nGN: Type gn continously`)
      break
    }
    case `gm`: {
      GMGN.greet(msg)
      break
    }
    case `gn`: {
      GMGN.greet(msg)
      break
    }
    default: {
      msg.channel.send(
        `${msg.content} is not a valid commad. Type ${prefix}help to see how to play.`
      )
    }
  }

})

client.login(process.env.DISCORD_CLIENT_TOKEN)
