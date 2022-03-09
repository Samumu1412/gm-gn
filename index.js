const { Client, Intents } = require('discord.js')
const { toLower, split, values, includes, map, startsWith, toNumber } = require('lodash')
require('dotenv').config()
const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set, onValue } = require('firebase/database')
const axios = require('axios')

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
  const db = getDatabase()
  const isAdmin = msg.member.permissions.has("ADMINISTRATOR")

  if(isAdmin && startsWith(command, prefix)) {
    switch (toLower(command)) {
      case `${prefix}adminhelp`: {
        msg.channel.send(`1. !setRule : 新增檢查規則\n2. !showRule : 顯示當前運作規則\n3. !deleteRule : 刪除運作中規則
        > !setRule\n\`\`\`!setRule {mode} {greeting} {days} {roleID}\n\n- {mode}: A/B (A: continuous / B: accumulate)\n- {greeting}: detect word\n- {days}: day counting\n- {roleID}: the ID of the role\`\`\`
        > !deleteRule\n\`\`\`!deleteRule {ruleID}\n\n- {ruleID}: find the id by !showRule command\`\`\``)
        break
      }
      case `${prefix}setfeedback`: {
        GMGN.setFeedback(msg)
        break
      }
      case `${prefix}setrule`: {
        GMGN.setRule(msg)
        break
      }
      case `${prefix}showrule`: {
        GMGN.
        showRule(msg)
        break
      }
      case `${prefix}deleterule`: {
        GMGN.deleteRule(msg)
        break
      }
      default:
        msg.channel.send('Please check ^adminHelp with correct command')
        break
    }
  }
  onValue(
    ref(db, `${msg.guild.id}/config`),
    (snapshot) => {
      const rules = map(
        values(snapshot.val()),
        'greeting'
      )

      if(toLower(command) === `${prefix}help`) {
        msg.channel.send(`Command List\n`)
      }

      if(includes(rules, toLower(command))) {
        GMGN.greet(msg)
      }
    }, {onlyOnce: true}
  )

})

client.login(process.env.DISCORD_CLIENT_TOKEN)
