/**
 * Cron Expression Parser & Next Execution Calculator (100% Client-Side)
 */

export const CRON_PRESETS = [
  { name: '每分钟执行一次', expr: '* * * * *', desc: '每分钟的第 0 秒执行' },
  { name: '每小时整点执行', expr: '0 * * * *', desc: '每小时的第 0 分钟执行' },
  { name: '每天凌晨 00:00 执行', expr: '0 0 * * *', desc: '每天 00:00 准时执行' },
  { name: '工作日每天上午 09:30', expr: '30 9 * * 1-5', desc: '周一至周五 09:30 执行' },
  { name: '每周一早上 08:00', expr: '0 8 * * 1', desc: '每周一上午 08:00 执行' },
  { name: '每月 1 日凌晨 01:00', expr: '0 1 1 * *', desc: '每月第 1 天 01:00 执行' },
  { name: '每 5 分钟执行一次', expr: '*/5 * * * *', desc: '从 0 分开始每隔 5 分钟' }
];

const WEEK_MAP = {
  '0': '周日', '1': '周一', '2': '周二', '3': '周三',
  '4': '周四', '5': '周五', '6': '周六', '7': '周日'
};

// Explain Cron expression in natural Chinese
export function explainCron(cronStr) {
  if (!cronStr || !cronStr.trim()) return '请输入 Cron 表达式';
  const parts = cronStr.trim().split(/\s+/);

  if (parts.length !== 5 && parts.length !== 6) {
    return 'Cron 格式错误：标准 Cron 应为 5 段或 6 段（含秒）';
  }

  let sec = parts.length === 6 ? parts[0] : null;
  let min = parts.length === 6 ? parts[1] : parts[0];
  let hour = parts.length === 6 ? parts[2] : parts[1];
  let dom = parts.length === 6 ? parts[3] : parts[2];
  let mon = parts.length === 6 ? parts[4] : parts[3];
  let dow = parts.length === 6 ? parts[5] : parts[4];

  let desc = [];

  // Month
  if (mon !== '*' && mon !== '?') {
    desc.push(`在 ${mon} 月`);
  }

  // Day of month & Day of week
  if (dom !== '*' && dom !== '?') {
    desc.push(`每月的第 ${dom} 号`);
  }
  if (dow !== '*' && dow !== '?') {
    const weekNames = dow.split(',').map(w => WEEK_MAP[w] || w).join('、');
    desc.push(`在 ${weekNames}`);
  }

  // Hours
  if (hour === '*') {
    desc.push('每小时');
  } else if (hour.includes('/')) {
    const [start, step] = hour.split('/');
    desc.push(`从 ${start} 点开始每隔 ${step} 小时`);
  } else {
    desc.push(`在 ${hour} 点`);
  }

  // Minutes
  if (min === '*') {
    desc.push('每分钟');
  } else if (min.includes('/')) {
    const [start, step] = min.split('/');
    desc.push(`从 ${start} 分开始每隔 ${step} 分钟`);
  } else {
    desc.push(`${min} 分`);
  }

  // Seconds (if 6 parts)
  if (sec !== null) {
    if (sec === '*') {
      desc.push('每秒');
    } else if (sec !== '0') {
      desc.push(`${sec} 秒`);
    }
  }

  desc.push('执行');
  return desc.join(' ');
}

// Calculate the next N executions of a 5-part cron
export function getNextExecutions(cronStr, count = 5) {
  if (!cronStr || !cronStr.trim()) return [];
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return [];

  const results = [];
  let current = new Date();
  // round up to next minute to prevent immediate match with past seconds
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  // Normalize to 5 parts for calculation
  let minPart = parts.length === 6 ? parts[1] : parts[0];
  let hourPart = parts.length === 6 ? parts[2] : parts[1];
  let domPart = parts.length === 6 ? parts[3] : parts[2];
  let monPart = parts.length === 6 ? parts[4] : parts[3];
  let dowPart = parts.length === 6 ? parts[5] : parts[4];

  function matches(val, part) {
    if (part === '*' || part === '?') return true;
    if (part.includes(',')) {
      return part.split(',').some(p => matches(val, p));
    }
    if (part.includes('/')) {
      const [start, step] = part.split('/').map(Number);
      return val >= start && (val - start) % step === 0;
    }
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      return val >= start && val <= end;
    }
    return Number(part) === val;
  }

  let limit = 0;
  while (results.length < count && limit < 100000) {
    limit++;
    const minute = current.getMinutes();
    const hour = current.getHours();
    const day = current.getDate();
    const month = current.getMonth() + 1;
    const weekday = current.getDay();

    if (
      matches(month, monPart) &&
      matches(day, domPart) &&
      (matches(weekday, dowPart) || (dowPart === '7' && weekday === 0)) &&
      matches(hour, hourPart) &&
      matches(minute, minPart)
    ) {
      results.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}
