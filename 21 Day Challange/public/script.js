// script.js
const startDateInput = document.getElementById('startDate');
const idealPerDayInput = document.getElementById('idealPerDay');
const buildBtn = document.getElementById('buildBtn');
const tableContainer = document.getElementById('tableContainer');
const exportPdfBtn = document.getElementById('exportPdf');
const resetBtn = document.getElementById('resetBtn');

let state = { config: null, rows: [] };
let saveTimer = null;

function fetchData() {
  return fetch('/api/data')
    .then(r => r.json())
    .then(j => {
      state = j;
      if (state.config) {
        startDateInput.value = state.config.startDate;
        idealPerDayInput.value = state.config.idealPerDay;
        buildTable(state.config.startDate, state.config.idealPerDay, state.rows);
      }
    })
    .catch(e => console.error('Failed to fetch data', e));
}

function saveToServerDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(e => console.error('Save failed', e));
  }, 400);
}

function buildTable(startDateStr, idealPerDay, existingRows = []) {
  const start = new Date(startDateStr);
  if (isNaN(start)) {
    tableContainer.innerHTML = '<p class="small">Please pick a valid start date.</p>';
    return;
  }

  const rows = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const existing = existingRows[i] || {};
    rows.push({
      day: i + 1,
      date: iso,
      sessionsCompleted:
        typeof existing.sessionsCompleted === 'number'
          ? existing.sessionsCompleted
          : 0,
      dayCompleted: existing.dayCompleted === true
    });
  }

  state.config = { startDate: startDateStr, idealPerDay: Number(idealPerDay) };
  state.rows = rows;
  renderTable();
  saveToServerDebounced();
}

function renderTable() {
  if (!state.config) {
    tableContainer.innerHTML = '<p class="small">Build the table to begin.</p>';
    return;
  }

  const ideal = Number(state.config.idealPerDay);
  let html = `<div id="exportArea"><table id="challengeTable"><thead>
      <tr>
        <th>Day</th>
        <th>Date</th>
        <th>Sessions Completed</th>
        <th>Cumulative Total</th>
        <th>Cumulative % (of Ideal to Date)</th>
      </tr>
    </thead><tbody>`;

  // Compute cumulative only for completed days
  let cumulative = 0;
  state.rows.forEach((r, idx) => {
    if (r.dayCompleted) {
      cumulative += Number(r.sessionsCompleted || 0);
    }
    const dayNum = idx + 1;
    const idealToDate = ideal * dayNum;
    const pct =
      idealToDate === 0 ? 0 : (cumulative / idealToDate) * 100;
    const pctStr = r.dayCompleted ? pct.toFixed(2) + '%' : '–';

    html += `<tr data-idx="${idx}">
      <td>Day ${dayNum}</td>
      <td>${r.date}</td>
      <td>
        <input class="row-session" type="number" min="0" step="1"
          value="${r.sessionsCompleted}" data-idx="${idx}"
          ${r.dayCompleted ? 'disabled' : ''}>
      </td>
      <td class="cum-total">${r.dayCompleted ? cumulative : '–'}</td>
      <td class="cum-pct">${pctStr}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  tableContainer.innerHTML = html;

  enableNextEditableDay();
  attachInputHandlers();
}

function enableNextEditableDay() {
  // Find first incomplete day
  const firstIncomplete = state.rows.findIndex(r => !r.dayCompleted);
  const inputs = tableContainer.querySelectorAll('input.row-session');
  inputs.forEach((inp, i) => {
    if (i === firstIncomplete) {
      inp.disabled = false;
    } else if (i > firstIncomplete) {
      inp.disabled = true;
    }
  });
}

function attachInputHandlers() {
  const inputs = tableContainer.querySelectorAll('input.row-session');
  inputs.forEach(inp => {
    inp.addEventListener('blur', handleDayCompletion);
    inp.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    });
  });
}

function handleDayCompletion(ev) {
  const idx = Number(ev.target.dataset.idx);
  const val = Math.max(0, Math.floor(Number(ev.target.value) || 0));
  state.rows[idx].sessionsCompleted = val;
  if (val >= 0) {
    state.rows[idx].dayCompleted = true;
  }
  recalcCompletedDays();
  saveToServerDebounced();
}

function recalcCompletedDays() {
  const ideal = Number(state.config.idealPerDay);
  let cumulative = 0;

  state.rows.forEach((r, idx) => {
    const row = tableContainer.querySelector(`tr[data-idx="${idx}"]`);
    const totalCell = row.querySelector('.cum-total');
    const pctCell = row.querySelector('.cum-pct');
    const input = row.querySelector('input.row-session');

    if (r.dayCompleted) {
      cumulative += Number(r.sessionsCompleted || 0);
      const idealToDate = ideal * (idx + 1);
      const pct = idealToDate === 0 ? 0 : (cumulative / idealToDate) * 100;
      totalCell.textContent = cumulative;
      pctCell.textContent = pct.toFixed(2) + '%';
      input.disabled = true;
    } else {
      totalCell.textContent = '–';
      pctCell.textContent = '–';
    }
  });

  enableNextEditableDay();
}

// Buttons
buildBtn.addEventListener('click', () => {
  const sd = startDateInput.value;
  const ideal = Number(idealPerDayInput.value) || 0;
  if (!sd || ideal <= 0) {
    alert('Please select a start date and set ideal sessions per day (>=1).');
    return;
  }
  buildTable(sd, ideal);
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Reset will clear saved data on the server. Continue?')) return;
  fetch('/api/reset', { method: 'POST' })
    .then(r => r.json())
    .then(() => {
      state = { config: null, rows: [] };
      startDateInput.value = '';
      tableContainer.innerHTML =
        '<p class="small">Reset complete. Build a new table to begin.</p>';
    });
});

exportPdfBtn.addEventListener('click', () => {
  fetch('/api/export-pdf')
    .then(res => {
      if (!res.ok) throw new Error('Failed to export PDF');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `21-day-challenge-${state.config.startDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => alert('Error exporting PDF: ' + err.message));
});


fetchData();
