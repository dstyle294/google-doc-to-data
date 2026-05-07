async function loadData() {
  try {
    const res = await fetch('summary.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('summary.json missing');
    const data = await res.json();
    render(data);
  } catch (err) {
    document.getElementById('nextAction').textContent =
      'Run the sync command to generate docs/summary.json from your Google Doc.';
  }
}

function render(data) {
  const total = Number(data.completed_hours || 0);
  const remaining = Number(data.remaining_hours || 0);
  const goal = Number(data.goal_hours || 400);
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

  const weeklyGoal = 12;
  const weeksLeft = Math.max(Math.ceil(remaining / weeklyGoal), 0);
  document.getElementById('nextAction').textContent =
    remaining > 0
      ? `You need ~${weeklyGoal}h/week for ${weeksLeft} more week(s) to hit 400 hours.`
      : 'Goal achieved 🎉 Keep logging hours to build momentum.';
}

loadData();
