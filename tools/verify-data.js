const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('Cannot find inline script');

const scriptPrefix = scriptMatch[1].split('// ==================== INIT ====================')[0];
const { TEAMS, GROUPS, SCHEDULE, RESULTS, predictMatch } = Function(`
${scriptPrefix}
return { TEAMS, GROUPS, SCHEDULE, RESULTS, predictMatch };
`)();

console.log('=' .repeat(70));
console.log('【数据核对报告】');
console.log('=' .repeat(70));

// 1. 检查 RESULTS 中的比赛是否都在 GROUPS 中
console.log('\n【步骤 1】核对 RESULTS 中的比赛是否都在 GROUPS 中');
let missingInGroups = [];
let groupMatchCount = {};
for (const g of Object.keys(GROUPS)) groupMatchCount[g] = 0;

for (const key of Object.keys(RESULTS)) {
  const [a, b] = key.split('-');
  let found = false;
  for (const [g, teams] of Object.entries(GROUPS)) {
    if (teams.includes(a) && teams.includes(b)) {
      found = true;
      groupMatchCount[g]++;
      break;
    }
  }
  if (!found) missingInGroups.push(key);
}

if (missingInGroups.length) {
  console.log('  ❌ 找不到分组的比赛:', missingInGroups.join(', '));
} else {
  console.log(`  ✅ 所有 ${Object.keys(RESULTS).length} 场比赛都在 GROUPS 中`);
}

// 2. 检查球队名称一致性
console.log('\n【步骤 2】检查球队名称一致性');
const allGroupTeams = new Set();
for (const teams of Object.values(GROUPS)) teams.forEach(t => allGroupTeams.add(t));

const resultTeams = new Set();
for (const key of Object.keys(RESULTS)) {
  const [a, b] = key.split('-');
  resultTeams.add(a);
  resultTeams.add(b);
}

const nameIssues = [...resultTeams].filter(t => !allGroupTeams.has(t));
if (nameIssues.length) {
  console.log('  ❌ RESULTS 中的球队名不在 GROUPS 中:', nameIssues.join(', '));
  console.log('  提示: GROUPS 中的名称为:', [...allGroupTeams].filter(t => t.includes('乌兹') || t.includes('刚果')));
} else {
  console.log('  ✅ 球队名称完全一致');
}

// 3. 各组已完成比赛数量
console.log('\n【步骤 3】各组已完成比赛数量');
for (const [g, teams] of Object.entries(GROUPS)) {
  console.log(`  组 ${g}: ${groupMatchCount[g]}/6 场`);
}
console.log(`\n  总计: ${Object.keys(RESULTS).length} 场已完成比赛`);

// 4. 检查算法统计逻辑
console.log('\n【步骤 4】检查算法统计逻辑');

function outcomeFromPred(pred) {
  const [a, b] = pred.predictedScore.split('-').map(Number);
  return a > b ? 'A' : a < b ? 'B' : 'D';
}

function outcomeFromScore(score) {
  const [a, b] = score.split('-').map(Number);
  return a > b ? 'A' : a < b ? 'B' : 'D';
}

let probDirection = 0;
let scoreDirection = 0;
let exact = 0;
let top3 = 0;
let actualDraws = 0;
let predictedDrawsProb = 0;
let predictedDrawsScore = 0;
const mismatches = [];

for (const [key, result] of Object.entries(RESULTS)) {
  const [a, b] = key.split('-');
  if (!TEAMS[a] || !TEAMS[b]) continue;

  const pred = predictMatch(a, b, '小组赛');
  const probOut = outcomeFromPred(pred);
  const scoreOut = outcomeFromScore(pred.predictedScore);
  const actualOut = outcomeFromScore(result.score);

  if (probOut === actualOut) probDirection++;
  if (scoreOut === actualOut) scoreDirection++;
  if (pred.predictedScore === result.score) exact++;
  if (pred.topScores.some(s => s.score === result.score)) top3++;
  if (actualOut === 'D') actualDraws++;
  if (probOut === 'D') predictedDrawsProb++;
  if (scoreOut === 'D') predictedDrawsScore++;

  if (probOut !== scoreOut) {
    mismatches.push({
      match: key,
      prob: `${pred.teamA.winProb}-${pred.draw}-${pred.teamB.winProb}`,
      predictedScore: pred.predictedScore,
      actualScore: result.score,
      probOut,
      scoreOut,
      actualOut
    });
  }
}

const total = Object.keys(RESULTS).length;
console.log(`  总比赛数: ${total}`);
console.log(`  按概率方向对: ${probDirection}/${total} (${(probDirection/total*100).toFixed(1)}%)`);
console.log(`  按比分方向对: ${scoreDirection}/${total} (${(scoreDirection/total*100).toFixed(1)}%)`);
console.log(`  比分全中: ${exact}/${total} (${(exact/total*100).toFixed(1)}%)`);
console.log(`  Top-3 命中: ${top3}/${total} (${(top3/total*100).toFixed(1)}%)`);
console.log(`  实际平局数: ${actualDraws}`);
console.log(`  概率预测平局数: ${predictedDrawsProb}`);
console.log(`  比分预测平局数: ${predictedDrawsScore}`);

if (mismatches.length) {
  console.log(`\n  ⚠️ 概率方向与比分方向不一致的比赛 (${mismatches.length} 场):`);
  mismatches.forEach(m => {
    console.log(`    ${m.match}: 概率${m.prob}=>${m.probOut}, 比分${m.predictedScore}=>${m.scoreOut}, 实际${m.actualScore}=>${m.actualOut}`);
  });
}

// 5. 检查 buildScoreboard 中使用的是哪种方向逻辑
console.log('\n【步骤 5】检查 buildScoreboard 中的方向逻辑');
const hasScoreOutcome = html.includes("const predW = pa > pb ? 'A' : pa < pb ? 'B' : 'D';");
const hasProbOutcome = html.includes("pred.teamA.winProb >= pred.teamB.winProb");
if (hasScoreOutcome) {
  console.log('  buildScoreboard 使用: 比分方向 (pa > pb ? A : B : D)');
}
if (hasProbOutcome) {
  console.log('  发现概率方向判断代码');
}

// 6. 检查 SCHEDULE 和 GROUPS 的匹配
console.log('\n【步骤 6】检查 SCHEDULE 和 GROUPS 的匹配');
const scheduleGroups = Object.keys(SCHEDULE);
const groupsGroups = Object.keys(GROUPS);
const missingSchedule = groupsGroups.filter(g => !scheduleGroups.includes(g));
if (missingSchedule.length) {
  console.log('  ❌ 缺少日程的组:', missingSchedule.join(', '));
} else {
  console.log('  ✅ 所有12组都有日程');
}

console.log('\n' + '='.repeat(70));
