
let successCount = 0;
let failCount = 0;

function updateStats() {
  document.getElementById('successCount').innerText = successCount;
  document.getElementById('failCount').innerText = failCount;
}

function addError(message) {
  failCount++;
  updateStats();

  const table = document.querySelector('#errorTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `<td>${new Date().toLocaleTimeString()}</td><td>${message}</td>`;
  table.prepend(row);

  if (table.children.length > 50) {
    table.removeChild(table.lastChild);
  }
}

function addSuccess() {
  successCount++;
  updateStats();
}
