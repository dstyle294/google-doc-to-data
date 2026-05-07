const DOC_ID = '1sAIRvfsQbaeaGf1VB56usTGRIxhn4SfEHTYN9oyp_08';
const GOAL_HOURS = 400;
const WEEKLY_GOAL = 12;

function parseHoursFromRows(rows) {
  const termTotals = { fall_2025: 0, winter_2026: 0, spring_2026: 0 };
  const tasks = [];

  for (const raw of rows) {
    const cols = raw
      .split('\t')
      .map((col) => col.trim())
      .filter(Boolean);
    if (cols.length === 0) continue;

    const rowText = cols.join(' ').toLowerCase();
    const hoursMatch = rowText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);

    if (hoursMatch) {
      const hrs = Number(hoursMatch[1]);
      if (rowText.includes('fall 2025')) termTotals.fall_2025 += hrs;
      if (rowText.includes('winter 2026')) termTotals.winter_2026 += hrs;
      if (rowText.includes('spring 2026')) termTotals.spring_2026 += hrs;
    }

    const numericValues = (raw.match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number);
    if (numericValues.length && cols.length >= 2) {
      tasks.push({
        task: cols[0],
        details: cols.slice(1, -1),
        hours: numericValues[numericValues.length - 1],
        raw,
      });
    }
  }

  const completed = Number((termTotals.fall_2025 + termTotals.winter_2026 + termTotals.spring_2026).toFixed(2));
  const remaining = Number(Math.max(GOAL_HOURS - completed, 0).toFixed(2));

  return {
    goal_hours: GOAL_HOURS,
    term_totals: termTotals,
    completed_hours: completed,
    remaining_hours: remaining,
    tasks,
  };
}

function parseDocText(text) {
  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return parseHoursFromRows(rows);
}

function render(data) {
  const total = Number(data.completed_hours || 0);
  const remaining = Number(data.remaining_hours || 0);
  const goal = Number(data.goal_hours || GOAL_HOURS);
  const pct = goal > 0 ? ((total / goal) * 100).toFixed(1) : '0.0';

  document.getElementById('totalHours').textContent = `${total}h`;
  document.getElementById('remainingHours').textContent = `${remaining}h`;
  document.getElementById('goalPct').textContent = `${pct}%`;

  const term = data.term_totals || {};
  const termList = document.getElementById('termTotals');
  termList.innerHTML = '';
  Object.entries(term).forEach(([name, hrs]) => {
    const li = document.createElement('li');
    li.textContent = `${name.replace('_', ' ')}: ${hrs}h`;
    termList.appendChild(li);
  });

  const tasks = [...(data.tasks || [])].sort((a, b) => b.hours - a.hours).slice(0, 5);
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.textContent = `${task.task} — ${task.hours}h`;
    taskList.appendChild(li);
  });

  const weeksLeft = Math.max(Math.ceil(remaining / WEEKLY_GOAL), 0);
  document.getElementById('nextAction').textContent =
    remaining > 0
      ? `You need ~${WEEKLY_GOAL}h/week for ${weeksLeft} more week(s) to hit 400 hours.`
      : 'Goal achieved 🎉 Keep logging hours to build momentum.';
}

async function loadLiveGoogleDoc() {
  const liveUrl = `https://docs.google.com/document/d/${DOC_ID}/export?format=txt`;
  const response = await fetch(liveUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Live fetch failed (${response.status})`);
  }
  const text = await response.text();
  return parseDocText(text);
}

async function loadData() {
  const status = document.getElementById('dataStatus');
  try {
    const data = await loadLiveGoogleDoc();
    render(data);
    status.textContent = 'Live data source: Google Doc export (auto-refreshes on reload).';
  } catch (_err) {
    try {
      const res = await fetch('summary.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('summary.json missing');
      const data = await res.json();
      render(data);
      status.textContent = 'Fallback data source: summary.json (last synced snapshot).';
    } catch (_fallbackErr) {
      status.textContent =
        'Unable to fetch live Google Doc data. Ensure the doc is published/shared so export is accessible.';
      document.getElementById('nextAction').textContent =
        'If needed, run the sync command to generate docs/summary.json from your Google Doc.';
    }
  }
}

loadData();
