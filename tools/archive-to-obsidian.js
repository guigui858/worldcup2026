#!/usr/bin/env node
/**
 * 每日自动归档脚本
 * 运行时机：每日 23:30（Hermes cron）
 * 功能：检查当天 git commit，将有意义变更归档到 Obsidian
 * 防垃圾策略：
 *   - 只有当天有 commit 才执行
 *   - 排除 diff <= 3 行的 trivial 修改
 *   - 排除含 "backup" / ".bak" / "merge" / "restore" 的 commit
 *   - 排除纯数据更新（由 worldcup_result_apply.py 自己记 changelog）
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = 'C:/Users/21378/OneDrive/文档/世界杯预测网站';
const OBSIDIAN_NOTE = 'E:/obsidian/ai知识库/99-参考资料/Claude Code 工作记忆/世界杯AI预测网站项目.md';
const TODAY = new Date().toISOString().slice(0, 10);

// 防垃圾关键词
const SKIP_PATTERNS = [/backup/i, /\.bak/i, /merge conflict/i, /restore/i, /^auto:\s*自动更新.*比赛/];

function shouldSkipCommit(msg) {
  return SKIP_PATTERNS.some(p => p.test(msg));
}

function getTodayCommits() {
  try {
    const cmd = `cd "${PROJECT_DIR}" && git log --format="%H|%s|%ad" --date=short --since="${TODAY} 00:00" --until="${TODAY} 23:59" -- index.html tools/* .github/*`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim().split('\n').filter(Boolean).map(line => {
      const [hash, subject, date] = line.split('|');
      return { hash: hash.slice(0, 8), subject, date };
    });
  } catch {
    return [];
  }
}

function getDiffStat(commitHash) {
  try {
    const cmd = `cd "${PROJECT_DIR}" && git diff --stat ${commitHash}~1 ${commitHash} -- index.html tools/*`;
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function classifyChange(msg) {
  if (/fix|bug|修复/i.test(msg)) return '修复';
  if (/algo|算法|model|predict/i.test(msg)) return '算法';
  if (/feat|新增|add/i.test(msg)) return '功能';
  if (/data|数据|result|score/i.test(msg)) return '数据';
  if (/style|css|ui|视觉/i.test(msg)) return '视觉';
  return '其他';
}

function main() {
  const commits = getTodayCommits();

  // 没有当天 commit → 静默退出（不产生垃圾记录）
  if (commits.length === 0) {
    process.exit(0);
  }

  // 过滤 trivial commit
  const meaningfulCommits = commits.filter(c => {
    if (shouldSkipCommit(c.subject)) return false;
    const stat = getDiffStat(c.hash);
    // git diff --stat summary: "3 files changed, 76 insertions(+), 7 deletions(-)"
    const match = stat.match(/(\d+)\s+insertions?\(\+\)(?:,\s*(\d+)\s+deletions?\(-\))?/);
    if (!match) return false;
    const insertions = parseInt(match[1]) || 0;
    const deletions = parseInt(match[2]) || 0;
    return (insertions + deletions) > 3;
  });

  if (meaningfulCommits.length === 0) {
    process.exit(0); // 全部是垃圾，静默退出
  }

  // 生成归档内容
  const sections = meaningfulCommits.map(c => {
    const type = classifyChange(c.subject);
    const stat = getDiffStat(c.hash);
    return `- **${type}** · ${c.subject} · commit \`${c.hash}\`\n  \`\`\`\n  ${stat.trim().split('\n').join('\n  ')}\n  \`\`\``;
  });

  const archiveContent = `\n\n## ${TODAY} 工作日志\n\n### 变更概要\n${sections.join('\n')}\n\n---\n`;

  // 追加到笔记末尾（在 --- 前）
  let noteContent = fs.readFileSync(OBSIDIAN_NOTE, 'utf8');
  const footerMatch = noteContent.match(/\n---\n\*[绿荣录].*$/);
  if (footerMatch) {
    const insertPos = footerMatch.index;
    noteContent = noteContent.slice(0, insertPos) + archiveContent + noteContent.slice(insertPos);
  } else {
    noteContent += archiveContent;
  }

  fs.writeFileSync(OBSIDIAN_NOTE, noteContent, 'utf8');
  console.log(`✅ 已归档 ${meaningfulCommits.length} 项变更到 Obsidian · ${TODAY}`);
}

main();
