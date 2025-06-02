function getCoins() {
  return parseInt(localStorage.getItem('coins') || '1000')
}
function setCoins(val) {
  localStorage.setItem('coins', val)
}
function updateCoinbar() {
  document.getElementById('coinbar').innerText = `金幣：${getCoins()}`
}

function getStreak() {
  return parseFloat(localStorage.getItem('streak') || '1')
}
function setStreak(val) {
  localStorage.setItem('streak', val)
}

let battle = null
let manualNext = false

function startBattle() {
  let bet = parseInt(document.getElementById('bet').value)
  let coins = getCoins()
  if(bet > coins) {
    document.getElementById('msg').innerText = '窮鬼還敢下注？'
    return
  }
  document.getElementById('msg').innerText = ''
  document.getElementById('startBtn').disabled = true
  document.getElementById('startBtn').innerText = '進行中...'
  document.getElementById('startBtn').onclick = null

  battle = {
    bet,
    myScore: 0,
    botScore: 0,
    round: 1,
    log: [],
    comboCount: 0,
    lastCombo: 1
  }
  showStreak()
  showBattle()
  manualNext = false
  nextRound()
}

function showStreak() {
  let streak = getStreak()
  document.getElementById('streak').innerText = `局外連勝獎勵x${(streak*100)/100}`
}

function nextRound() {
  setTimeout(() => {
    if(battle.myScore >= 5 || battle.botScore >= 5) {
      setTimeout(finishBattle, 600)
      return
    }
    let p1 = rollDice()
    let p2 = rollDice()
    let sum1 = p1.reduce((a,b)=>a+b,0)
    let sum2 = p2.reduce((a,b)=>a+b,0)
    let emoji = ['⚀','⚁','⚂','⚃','⚄','⚅']
    let info = `<b>第${battle.round}回合：</b>你 ${p1.map(n=>emoji[n-1]).join(' ')} (${sum1})　電腦 ${p2.map(n=>emoji[n-1]).join(' ')} (${sum2})<br>`
    if(sum1 > sum2) {
      battle.myScore++
      battle.comboCount++
      let x = 1
      if(battle.comboCount==2) x=1.2
      if(battle.comboCount==3) x=1.4
      if(battle.comboCount==4) x=1.7
      if(battle.comboCount>=5) x=2.0
      battle.lastCombo = x
      showFloatingText('+1', window.innerWidth/2 - 30, 400, '#ffd700')
      if(battle.comboCount >= 2) {
        showFloatingText(`${battle.comboCount} combo🔥`, window.innerWidth/2, 440, '#ff5555')
      }
      info += `<span style="color:#ffd700;">你得分 (+1)</span>`
    } else if(sum2 > sum1) {
      battle.botScore++
      battle.comboCount = 0
      info += `<span style="color:#fa7;">你被電腦電爛</span>`
    } else {
      info += `<span style="color:#aaa;">平手 無分</span>`
      battle.comboCount = 0
    }
    battle.round++
    battle.log.push(info)
    showBattle()
    // 決定要自動還是手動
    const auto = document.getElementById('autoMode').checked
    if(battle.myScore < 5 && battle.botScore < 5) {
      if(auto) {
        setTimeout(nextRound, 1200)
      } else {
        manualNext = true
        document.getElementById('startBtn').disabled = false
        document.getElementById('startBtn').innerText = '下一回合'
        document.getElementById('startBtn').onclick = ()=>{
          document.getElementById('startBtn').disabled = true
          document.getElementById('startBtn').innerText = '進行中...'
          document.getElementById('startBtn').onclick = null
          manualNext = false
          nextRound()
        }
      }
    } else {
      setTimeout(finishBattle, 1200)
    }
  }, 600)
}

function showBattle() {
  let bz = document.getElementById('battleZone')
  bz.innerHTML = `
    <div style="font-size:1.7em; color:#ffd700;">${battle.myScore} : ${battle.botScore}</div>
    <div>局內combo：<b>x${battle.lastCombo || 1}</b></div>
    <div style="margin-top:8px;"><b>本場賭注：</b>${battle.bet}</div>
  `
  document.getElementById('battleLog').innerHTML = battle.log.slice(-6).join('<hr>')
}

function finishBattle() {
  let result = ''
  let reward = 0
  let bet = battle.bet
  let comboMulti = battle.lastCombo || 1
  let baseMulti = 0
  let streakMulti = getStreak()

  if(battle.myScore==5 && (battle.botScore==4||battle.botScore==3)) baseMulti=0.6
  else if(battle.myScore==5 && battle.botScore==2) baseMulti=0.8
  else if(battle.myScore==5 && battle.botScore==1) baseMulti=1
  else if(battle.myScore==5 && battle.botScore==0) baseMulti=1.5

  if(battle.myScore>=5) {
    result='WIN'
    reward = Math.floor(bet * baseMulti * comboMulti * streakMulti)
    setCoins(getCoins()+reward)
    showFloatingText(`獎金 +${reward}`, window.innerWidth/2 - 60, 180, '#00ff88')
    setStreak(Math.min((streakMulti+0.05)*100)/100, 2))
  } else {
    result='LOSE'
    reward = -bet
    setCoins(getCoins()-bet)
    setStreak(1)
  }
  updateCoinbar()
  showStreak()
  document.getElementById('msg').innerHTML = result==='WIN'
    ? `<span style="color:#4f0;font-size:1.5em;">你贏了！獎金+${reward} 金幣</span>`
    : `<span style="color:#f44;font-size:1.5em;">你被電腦電爆 賠掉${bet} 金幣</span>`
  document.getElementById('startBtn').disabled = false
  document.getElementById('startBtn').innerText = '開始對戰'
  document.getElementById('startBtn').onclick = startBattle
}

function rollDice() {
  return [1,2,3].map(()=>Math.floor(Math.random()*6)+1)
}

function resetGame() {
  if(confirm('真的要重置金幣嗎？')) {
    setCoins(1000)
    setStreak(1)
    updateCoinbar()
    showStreak()
    document.getElementById('msg').innerHTML = '<span style="color:#4f0;">金幣重置！</span>'
  }
}

function showFloatingText(text, x, y, color="#ffd700") {
  let div = document.createElement('div')
  div.className = 'float-text'
  div.innerText = text
  div.style.left = x + 'px'
  div.style.top = y + 'px'
  div.style.color = color
  document.body.appendChild(div)
  setTimeout(()=>{ div.remove() }, 1200)
}

window.onload = () => {
  updateCoinbar()
  showStreak()
  document.getElementById('battleZone').innerHTML = ''
  document.getElementById('battleLog').innerHTML = ''
  document.getElementById('msg').innerHTML = ''
}
function finishBattle() {
  let result = ''
  let reward = 0
  let bet = battle.bet
  let comboMulti = battle.lastCombo || 1
  let baseMulti = 0
  let streakMulti = getStreak()
  let calcMsg = ''

  if(battle.myScore==5 && (battle.botScore==4||battle.botScore==3)) baseMulti=0.6
  else if(battle.myScore==5 && battle.botScore==2) baseMulti=0.8
  else if(battle.myScore==5 && battle.botScore==1) baseMulti=1
  else if(battle.myScore==5 && battle.botScore==0) baseMulti=1.5

  if(battle.myScore>=5) {
    result='WIN'
    reward = Math.floor(bet * baseMulti * comboMulti * streakMulti)
    setCoins(getCoins()+reward)
    showFloatingText(`獎金 +${reward}`, window.innerWidth/2 - 60, 180, '#00ff88')
    setStreak(Math.min(streakMulti+0.05, 2))
    // 計算式
    calcMsg = `<div style=\"font-size:1em; color:#bbb; margin-top:10px;\">`
      + `獎金計算：${bet*baseMulti} × ${comboMulti} × ${streakMulti} = <b style='color:#ffd700;'>${reward}</b></div>`
  } else {
    result='LOSE'
    reward = -bet
    setCoins(getCoins()-bet)
    setStreak(1)
    calcMsg = `<div style=\"font-size:1em; color:#bbb; margin-top:10px;\">賠掉賭注：<b style='color:#fa7;'>${bet}</b></div>`
  }
  updateCoinbar()
  showStreak()
  document.getElementById('msg').innerHTML = (
    result==='WIN'
      ? `<span style="color:#4f0;font-size:1.5em;">你贏了！獎金+${reward}金幣</span>`
      : `<span style="color:#f44;font-size:1.5em;">你被電腦電爆 賠掉${bet}金幣</span>`
  ) + calcMsg

  document.getElementById('startBtn').disabled = false
  document.getElementById('startBtn').innerText = '開始對戰'
  document.getElementById('startBtn').onclick = startBattle
}
