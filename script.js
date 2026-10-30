// Настройки 
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const sectorsContainer = document.getElementById('sectors');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const sumEl = document.getElementById('sum');


const PALETTE = ['#7c3aed', '#db2777', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];


let sectors = [
  { name: 'Приз 1', percent: 50, color: PALETTE[0] },
  { name: 'Приз 2', percent: 30, color: PALETTE[1] },
  { name: 'Приз 3', percent: 20, color: PALETTE[2] }
];


let rotation = 0;


function renderSectorInputs() {
  sectorsContainer.innerHTML = '';

  sectors.forEach((sector, i) => {
    const row = document.createElement('div');
    row.className = 'sector-row';
    row.innerHTML = `
      <div class="sector-color" style="background:${sector.color}"></div>
      <input type="text" value="${sector.name}" data-index="${i}" data-field="name" placeholder="Название">
      <input type="number" value="${sector.percent}" data-index="${i}" data-field="percent" min="1" max="100">
      <button class="remove-btn" data-index="${i}" title="Удалить">×</button>
    `;
    sectorsContainer.appendChild(row);
  });


  sectorsContainer.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', onFieldChange);
  });


  sectorsContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', onRemove);
  });

  updateSum();
}


function onFieldChange(e) {
  const i = Number(e.target.dataset.index);
  const field = e.target.dataset.field;

  if (field === 'name') {
    sectors[i].name = e.target.value || '—';
  } else if (field === 'percent') {
    let val = Number(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 100) val = 100;
    sectors[i].percent = val;
  }

  updateSum();
  drawWheel();
}

function onRemove(e) {
  const i = Number(e.target.dataset.index);
  if (sectors.length <= 2) {
    alert('Должно остаться хотя бы 2 варианта');
    return;
  }
  sectors.splice(i, 1);
  
  sectors.forEach((s, idx) => s.color = PALETTE[idx % PALETTE.length]);
  renderSectorInputs();
  drawWheel();
}


addBtn.addEventListener('click', () => {
  const used = sectors.reduce((sum, s) => sum + s.percent, 0);
  const free = Math.max(1, 100 - used);
  sectors.push({
    name: `Приз ${sectors.length + 1}`,
    percent: free,
    color: PALETTE[sectors.length % PALETTE.length]
  });
  renderSectorInputs();
  drawWheel();
});


function updateSum() {
  const total = sectors.reduce((sum, s) => sum + s.percent, 0);
  sumEl.textContent = total;
  const ok = total === 100 && sectors.every(s => s.percent > 0);
  spinBtn.disabled = !ok;
  sumEl.parentElement.classList.toggle('bad', !ok);
}


function drawWheel() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 12;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const total = sectors.reduce((sum, s) => sum + s.percent, 0) || 1;
  let start = rotation;

  sectors.forEach(sector => {
    const angle = (sector.percent / total) * Math.PI * 2;
    const end = start + angle;


    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = sector.color;
    ctx.fill();
    ctx.strokeStyle = '#0f0a1e';
    ctx.lineWidth = 2;
    ctx.stroke();

   
    const mid = start + angle / 2;
    const tx = cx + Math.cos(mid) * (r * 0.65);
    const ty = cy + Math.sin(mid) * (r * 0.65);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid + Math.PI / 2); 
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sector.name, 0, 0);
    ctx.restore();

    start = end;
  });


  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1233';
  ctx.fill();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  ctx.stroke();
}


function pickWeighted() {
  const total = sectors.reduce((sum, s) => sum + s.percent, 0);
  let rnd = Math.random() * total;
  for (const s of sectors) {
    rnd -= s.percent;
    if (rnd <= 0) return s;
  }
  return sectors[sectors.length - 1];
}


spinBtn.addEventListener('click', spin);

function spin() {
  spinBtn.disabled = true;
  resultEl.textContent = '';

  const winner = pickWeighted();

 
  const total = sectors.reduce((sum, s) => sum + s.percent, 0);
  let acc = 0;
  let winnerStart = 0, winnerAngle = 0;
  for (const s of sectors) {
    const ang = (s.percent / total) * Math.PI * 2;
    if (s === winner) { winnerStart = acc; winnerAngle = ang; break; }
    acc += ang;
  }


  const winnerCenter = winnerStart + winnerAngle / 2;
  const targetAngle = -Math.PI / 2 - winnerCenter;

 
  const turns = 6 + Math.floor(Math.random() * 3); 
  const finalRotation = targetAngle + turns * Math.PI * 2;

  const startRotation = rotation;
  const duration = 4500;
  const startTime = performance.now();


  function animate(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); 
    rotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation = finalRotation % (Math.PI * 2);
      drawWheel();
      resultEl.textContent = `🎉 Выпало: ${winner.name}!`;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
}


renderSectorInputs();
drawWheel();