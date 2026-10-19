/*
 * Västerlösa Datorklubb
 * Vanlig JavaScript utan ramverk. Läs, ändra och lär dig!
 */

// Hälsning till dig som öppnar utvecklarverktygen (F12)
console.log(
  '%c' + [
    '__     ______  _  __',
    '\\ \\   / /  _ \\| |/ /',
    ' \\ \\ / /| | | | \' / ',
    '  \\ V / | |_| | . \\ ',
    '   \\_/  |____/|_|\\_\\',
  ].join('\n'),
  'color: #3dff7f; font-family: monospace;'
);
console.log('Psst! Läser du konsolen? Då hör du hemma hos oss.\nFlagga 2/4: VDK{k0ns0l3n_4r_d1n_v4n}');

// ---------- Uppstartsskärm ----------

const BOOT_LINES = [
  'VDK-BIOS v1.0  (C) Västerlösa Datorklubb',
  '',
  'Minnestest: 640K OK (det borde räcka åt alla)',
  'Söker tangentbord ........ OK',
  'Söker kaffe .............. OK',
  'Söker nyfikenhet ......... OK',
  '',
  'Startar VDK-DOS...',
  'C:\\> start hemsida.exe',
];

function showBootScreen() {
  // Visas bara på första sidan per besök, och aldrig för den som vill slippa animationer
  try {
    if (sessionStorage.getItem('vdk-booted')) return;
    sessionStorage.setItem('vdk-booted', 'yes');
  } catch {
    return;
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const screen = document.createElement('pre');
  screen.className = 'boot';
  screen.setAttribute('aria-hidden', 'true');
  document.body.append(screen);

  let line = 0;
  let pause = 0;
  const timer = setInterval(() => {
    if (line < BOOT_LINES.length) {
      screen.textContent += BOOT_LINES[line++] + '\n';
    } else if (++pause > 4) {
      close();
    }
  }, 110);

  function close() {
    clearInterval(timer);
    removeEventListener('keydown', close);
    screen.classList.add('done');
    setTimeout(() => screen.remove(), 300);
  }

  // Klick eller valfri tangent hoppar över
  screen.addEventListener('click', close);
  addEventListener('keydown', close);
}

// ---------- Schemat ----------

// Tider som "18.00–21.00" eller "18:00-21:00"
const TIME_RANGE = /(\d{1,2})[.:](\d{2})\s*[–-]\s*(\d{1,2})[.:](\d{2})/;

// Läser träffarna direkt från tabellerna på schemasidan, så att schemat bara behöver skrivas på ett ställe
function readSchedule(doc) {
  const defaultTime = doc.getElementById('meeting-time')?.textContent.match(TIME_RANGE);
  const byDate = new Map();

  for (const table of doc.querySelectorAll('table.schedule')) {
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
    for (const row of table.querySelectorAll('tbody tr')) {
      const date = row.querySelector('time[datetime]');
      const time = row.textContent.match(TIME_RANGE) ?? defaultTime;
      if (!date || !time || !row.cells[2]) continue; // Raden följer inte formatet, hoppa över den

      const day = date.getAttribute('datetime');
      const details = [...row.cells].slice(3).map((cell, i) => `${headers[i + 3]}: ${cell.textContent.trim()}`).join('\n');

      // Samma kväll kan stå i flera tabeller, då slås raderna ihop till en träff
      const existing = byDate.get(day);
      if (existing) {
        existing.rows.push(row);
        existing.description = [existing.description, details].filter(Boolean).join('\n');
        continue;
      }

      const from = `${time[1].padStart(2, '0')}:${time[2]}`;
      const to = `${time[3].padStart(2, '0')}:${time[4]}`;
      byDate.set(day, {
        rows: [row],
        when: date.textContent.trim(),
        date: day,
        from,
        to,
        start: new Date(`${day}T${from}`),
        end: new Date(`${day}T${to}`),
        title: row.cells[2].textContent.trim(),
        description: details,
      });
    }
  }
  return [...byDate.values()].sort((a, b) => a.start - b.start);
}

// Startsidan visar nästa träff, så där hämtas schemasidan i bakgrunden
async function loadSchedule() {
  if (document.querySelector('table.schedule')) return readSchedule(document);
  // Webbläsare tillåter inte fetch när sidan öppnas direkt från disken, kör en webbserver för att se nedräkningen
  if (!document.getElementById('next-meetup') || location.protocol === 'file:') return [];
  try {
    const response = await fetch('schema.html');
    return readSchedule(new DOMParser().parseFromString(await response.text(), 'text/html'));
  } catch {
    return [];
  }
}

function showNextMeetup(meetups) {
  const now = new Date();
  const next = meetups.find(meetup => meetup.end >= now);
  for (const meetup of meetups) {
    const state = meetup === next ? 'next' : meetup.end < now ? 'past' : null;
    if (state) meetup.rows.forEach(row => row.classList.add(state));
  }

  const box = document.getElementById('next-meetup');
  if (!box || !meetups.length) return;
  box.hidden = false;

  const field = name => box.querySelector(`[data-field="${name}"]`);
  if (!next) {
    field('what').textContent = 'Inga fler träffar inlagda just nu. Nästa schema kommer snart!';
    return;
  }

  field('when').textContent = `${next.when} ${next.date.slice(0, 4)} kl ${next.from.replace(':', '.')}`;
  field('what').textContent = next.title;

  const unix = Math.floor(next.start / 1000);
  field('unix').textContent = `unix-tid: ${unix} (0x${unix.toString(16)})`;

  const countdown = field('countdown');
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const seconds = Math.floor((next.start - Date.now()) / 1000);
    if (seconds <= 0) {
      countdown.textContent = 'Pågår just nu. Kom förbi!';
      return;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600) % 24;
    const minutes = Math.floor(seconds / 60) % 60;
    countdown.textContent = `T-minus ${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds % 60)}s`;
  };
  tick();
  setInterval(tick, 1000);
}

// ---------- Kalenderfil (.ics) ----------

// Tidszonen beskrivs i filen så att träffarna hamnar rätt både på vinter- och sommartid
const ICS_TIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Stockholm',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

function toIcs(meetups, place) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const local = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  const text = s => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vasterlosa Datorklubb//Schema//SV',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Västerlösa Datorklubb',
    'X-WR-TIMEZONE:Europe/Stockholm',
    ...ICS_TIMEZONE,
  ];
  for (const meetup of meetups) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${local(meetup.date, meetup.from)}@vasterlosa-datorklubb`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Stockholm:${local(meetup.date, meetup.from)}`,
      `DTEND;TZID=Europe/Stockholm:${local(meetup.date, meetup.to)}`,
      `SUMMARY:${text('VDK: ' + meetup.title)}`,
      `DESCRIPTION:${text(meetup.description)}`,
      ...(place ? [`LOCATION:${text(place)}`] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Kalenderfiler vill ha rader på högst 75 byte, längre rader viks
const encoder = new TextEncoder();
function fold(line) {
  let result = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      result += '\r\n ';
      bytes = 1;
    }
    result += char;
    bytes += size;
  }
  return result;
}

function enableCalendarDownload(meetups) {
  const button = document.getElementById('calendar-download');
  if (!button || !meetups.length) return;
  button.hidden = false;

  button.addEventListener('click', () => {
    const place = document.getElementById('location')?.textContent.trim() ?? '';
    const file = new Blob([toIcs(meetups, place)], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `vdk-schema-${meetups[0].date.slice(0, 4)}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
}

// ---------- Konami-koden ----------

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

function listenForKonami() {
  const typed = [];
  addEventListener('keydown', event => {
    typed.push(event.key.toLowerCase());
    typed.splice(0, typed.length - KONAMI.length);
    if (typed.join() === KONAMI.join()) matrixRain();
  });
}

function matrixRain() {
  if (document.querySelector('.matrix')) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'matrix';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  const size = 18;
  const chars = '01ÅÄÖVDK<>/{}$#';
  const drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => Math.random() * -40);

  const timer = setInterval(() => {
    ctx.fillStyle = 'rgba(11, 15, 12, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3dff7f';
    ctx.font = `${size}px monospace`;
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
      drops[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }, 50);

  function stop() {
    clearInterval(timer);
    removeEventListener('keydown', stop);
    canvas.remove();
  }

  // Klick, valfri tangent eller tolv sekunder stänger regnet
  canvas.addEventListener('click', stop);
  addEventListener('keydown', stop);
  setTimeout(stop, 12000);
}

// ---------- Start ----------

showBootScreen();
listenForKonami();
loadSchedule().then(meetups => {
  showNextMeetup(meetups);
  enableCalendarDownload(meetups);
});
