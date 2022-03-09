const { getDatabase, ref, set, onValue } = require('firebase/database')
const { values, keys, takeRight, includes, map, compact, split, forEach, isNil, toNumber, add, concat, toLower, join, random } = require('lodash')
const { MessageEmbed } = require('discord.js')

function getFormatedTime(date) {
  return date.getFullYear() +
  '-' +
  String(date.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(date.getDate()).padStart(2, '0')
}

function getUID() {
  return Date.now().toString(12);
}

function getPreviousDate(currentDate, previousDays) {
  const previousDate = new Date(currentDate.getTime())
  previousDate.setDate(currentDate.getDate() - previousDays)

  return getFormatedTime(previousDate)
}

function greet(msg) {
  const db = getDatabase()

  recordUserMessage({
    serverID: msg.guild.id,
    userID: msg.author.id,
    greeting: toLower(msg.content),
  })



  onValue(
    ref(db, `${msg.guild.id}/config`),
    (snapshot) => {
      const rules = values(snapshot.val())

      forEach(rules, ({ greeting, days, mode, roleID }) => {
        const dayAmount = toNumber(days)
        if(greeting === toLower(msg.content)) {
          onValue(
            ref(db, `${msg.guild.id}/${toLower(msg.content)}/`),
            (sn) => {
              const datas = sn.val()
              //continuous mode
              if(mode === "A") {
                const dates = takeRight(keys(sn.val()), dayAmount)

                if(dates.length >= dayAmount) {
                  const validDates = map(dates, date => {
                    if(includes(keys(datas[date]), msg.author.id)) {
                      return true
                    }
                    return false
                  })

                  if(compact(validDates).length === dayAmount) {
                    let role = msg.guild.roles.cache.find(role => role.id === roleID)
                    if (role) {
                      msg.guild.members.cache.get(msg.author.id).roles.add(role)
                      onValue(
                        ref(db, `${msg.guild.id}/role/${roleID}/`),
                        (s) => {
                          if (s.exists()) {
                            const usersHaveRole = s.val()
                            if(!includes(usersHaveRole, msg.author.id)) {
                              recordUserRole({
                                serverID: msg.guild.id,
                                roleID,
                                userIDs: concat(usersHaveRole, msg.author.id)
                              })
                              onValue(ref(db, `${msg.guild.id}/feedback/${greeting}/`),
                                (feedbackArray) => {
                                  if(feedbackArray.exists()) {
                                    const feedbacks = feedbackArray.val()
                                    msg.channel.send(`You have been added to ROLE <@&${roleID}>. ${feedbacks[random(0, feedbacks.length)]}`)
                                  } else {
                                    msg.channel.send(`You have been added to ROLE <@&${roleID}>.`)
                                  }
                                }
                              )
                            }
                          } else {
                            recordUserRole({
                              serverID: msg.guild.id,
                              roleID,
                              userIDs: [msg.author.id]
                            })
                            onValue(ref(db, `${msg.guild.id}/feedback/${greeting}/`),
                              (feedbackArray) => {
                                if(feedbackArray.exists()) {
                                  const feedbacks = feedbackArray.val()
                                  msg.channel.send(`You have been added to ROLE <@&${roleID}>. ${feedbacks[random(0, feedbacks.length)]}`)
                                } else {
                                  msg.channel.send(`You have been added to ROLE <@&${roleID}>.`)
                                }
                              }
                            )
                          }
                        }, {onlyOnce: true}
                      )
                    }
                  }

                }
              }

              //accumulate mode
              if(mode === "B") {
                const dates = keys(sn.val())
                const validDates = map(dates, date => {
                  if(includes(keys(datas[date]), msg.author.id)) {
                    return true
                  }
                  return false
                })
                if(compact(validDates).length >= dayAmount) {
                  let role = msg.guild.roles.cache.find(role => role.id === roleID)
                  if (role) {
                    msg.guild.members.cache.get(msg.author.id).roles.add(role)
                    onValue(
                      ref(db, `${msg.guild.id}/role/${roleID}/`),
                      (s) => {
                        if (s.exists()) {
                          const usersHaveRole = s.val()
                          if(!includes(usersHaveRole, msg.author.id)) {
                            recordUserRole({
                              serverID: msg.guild.id,
                              roleID,
                              userIDs: concat(usersHaveRole, msg.author.id)
                            })
                            onValue(ref(db, `${msg.guild.id}/feedback/${greeting}/`),
                              (feedbackArray) => {
                                if(feedbackArray.exists()) {
                                  const feedbacks = feedbackArray.val()
                                  msg.channel.send(`You have been added to ROLE <@&${roleID}>. ${feedbacks[random(0, feedbacks.length)]}`)
                                } else {
                                  msg.channel.send(`You have been added to ROLE <@&${roleID}>.`)
                                }
                              }
                            )
                          }
                        } else {
                          recordUserRole({
                            serverID: msg.guild.id,
                            roleID,
                            userIDs: [msg.author.id]
                          })
                          onValue(ref(db, `${msg.guild.id}/feedback/${greeting}/`),
                            (feedbackArray) => {
                              if(feedbackArray.exists()) {
                                const feedbacks = feedbackArray.val()
                                msg.channel.send(`You have been added to ROLE <@&${roleID}>. ${feedbacks[random(0, feedbacks.length)]}`)
                              } else {
                                msg.channel.send(`You have been added to ROLE <@&${roleID}>.`)
                              }
                            }
                          )
                        }
                      }, {onlyOnce: true}
                    )
                  }
                }
              }
            },
            { onlyOnce: true }
          )
        }
      }) 

    }, {onlyOnce: true}
  )
}

function setRule(msg) {
  const validModes = ['A', 'B']
  const isAdmin = msg.member.permissions.has("ADMINISTRATOR")
  if(isAdmin) {
    const [_, mode, greeting, days, roleID] = split(toLower(msg.content), ' ', 5)
    if(!includes(validModes, mode)) {
      msg.channel.send('{mode} should be A or B')
      return
    }
    if(isNil(greeting)) {
      msg.channel.send('{greeting} should be included')
      return
    }
    if(isNil(toNumber(days))) {
      msg.channel.send('{days} should be number')
      return
    }
    if(isNil(msg.guild.roles.cache.find(role => role.id === roleID))) {
      msg.channel.send('{roleID} is not valid your server')
      return
    }
    recordConfig({
      serverID: msg.guild.id,
      mode,
      days,
      greeting,
      roleID
    })
  }
}

function showRule(msg) {
  const db = getDatabase()

  onValue(
    ref(db, `${msg.guild.id}/config/`),
    (snapshot) => {
      const rules = values(snapshot.val())
      let rulesMessage = ''
      forEach(rules, (rule) => {
        rulesMessage += `${rule.uid}: '${rule.mode}' '${rule.days}' days greet '${rule.greeting}' will get role '${rule.roleID}'\n`
      })

      const ruleEmbed = new MessageEmbed()
        .setColor('#0099rr')
        .setTitle('Rules')
        .setDescription(rulesMessage)
    
      msg.channel.send({ embeds: [ruleEmbed] })
    },
    { onlyOnce: true }
  )
}

function deleteRule(msg) {
  const [_, configID] = split(toLower(msg.content), ' ', 2)
  deleteConfig(msg.guild.id, configID)
}

function setFeedback(msg) {
  const [_, greeting, ...feedbackArray] = split(toLower(msg.content), ' ')
  const feedBacks = join(feedbackArray, ' ')
  const db = getDatabase()

  onValue(
    ref(db, `${msg.guild.id}/feedback/${greeting}/`),
    (snapshot) => {
      if (snapshot.exists()) {
        const greetingHaveFeedback = snapshot.val()
        set(ref(db, `${msg.guild.id}/feedback/${greeting}/`), concat(greetingHaveFeedback, feedBacks))
        msg.channel.send(`You have add feedback for \'${greeting}\'`)
      } else {
        set(ref(db, `${msg.guild.id}/feedback/${greeting}/`), [feedBacks])
        msg.channel.send(`You have add feedback for \'${greeting}\'`)
      }
    }, {onlyOnce: true}
  )
}

function recordUserMessage(data) {
  const db = getDatabase()
  set(ref(db, `${data.serverID}/${data.greeting}/${getFormatedTime(new Date())}/${data.userID}/`), {
    ...data,
    timestamp: Date.now(),
  })
}

function recordUserRole(data) {
  const db = getDatabase()
  set(ref(db, `${data.serverID}/role/${data.roleID}/`), data.userIDs)
}

function recordConfig(data) {
  const db = getDatabase()
  const uid = getUID()

  set(ref(db, `${data.serverID}/config/${uid}/`), {
    ...data,
    uid,
    timestamp: Date.now(),
  })
}

function deleteConfig(serverID, uid) {
  const db = getDatabase()
  set(ref(db, `${serverID}/config/${uid}/`), {})
}

module.exports = {
  greet,
  setRule,
  showRule,
  deleteRule,
  setFeedback,
}