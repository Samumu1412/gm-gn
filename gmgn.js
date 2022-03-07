const { getDatabase, ref, set, onValue } = require('firebase/database')
const { values, keys, takeRight, forEach, includes, map, compact } = require('lodash')

function getFormatedTime(date) {
  return date.getFullYear() +
  '-' +
  String(date.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(date.getDate() + 1).padStart(2, '0')
}

function getPreviousDate(currentDate, previousDays) {
  const previousDate = new Date(currentDate.getTime())
  previousDate.setDate(currentDate.getDate() - previousDays)

  return getFormatedTime(previousDate)
}

function greet(msg) {
  const db = getDatabase()

  writeToDB({
    serverID: msg.guild.id,
    userID: msg.author.id,
    greeting: msg.content,
  })


  onValue(
    ref(db, `${msg.guild.id}/${msg.content}/`),
    (snapshot) => {
      const datas = snapshot.val()
      const dates = takeRight(keys(snapshot.val()), 7)

      if(dates.length >= 7) {
        const validDates = map(dates, date => {
          if(includes(keys(datas[date]), msg.author.id)) {
            return true
          }
          return false
        })
        if(compact(validDates).length === 7) {
          let role = msg.guild.roles.cache.find(role => role.name === "DJ")
          if (role) {
            msg.guild.members.cache.get(msg.author.id).roles.add(role)
          }
        }
      }
    },
    { onlyOnce: true }
  )
}

function writeToDB(data) {
  const db = getDatabase()
  set(ref(db, `${data.serverID}/${data.greeting}/${getFormatedTime(new Date())}/${data.userID}/`), {
    ...data,
    timestamp: Date.now(),
  })
}

module.exports = {
  greet
}