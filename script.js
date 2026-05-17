
const STATE = { user:null, console:null, controllers:null, duration:null, date:null, time:null, pendingBooking:false };
const CTRL_FEE = 5000; // per extra controller per hour

const CONSOLES = {
  ps5:    { name:'PlayStation 5',   price:25000, icon:'🎮', maxCtrl:4,
            games:['Spider-Man 2','God of War: Ragnarök','FC 25','Tekken 8','Hogwarts Legacy','Mortal Kombat 1','Final Fantasy VII Rebirth'] },
  ps4:    { name:'PlayStation 4',   price:15000, icon:'🕹️', maxCtrl:4,
            games:['GTA V','The Last of Us Remastered','Mortal Kombat 11','Minecraft','PES 2021','Uncharted 4','Red Dead Redemption 2'] },
  switch: { name:'Nintendo Switch', price:20000, icon:'📺', maxCtrl:4,
            games:['Mario Kart 8 Deluxe','Zelda: Tears of the Kingdom','Super Smash Bros. Ultimate','Animal Crossing','Pokémon Scarlet/Violet','Splatoon 3','Luigi\'s Mansion 3'] },
};

const TIME_SLOTS = [
  {time:'09:00',avail:true},{time:'10:00',avail:true},{time:'11:00',avail:false},
  {time:'12:00',avail:true},{time:'13:00',avail:true},{time:'14:00',avail:false},
  {time:'15:00',avail:true},{time:'16:00',avail:true},{time:'17:00',avail:true},
  {time:'18:00',avail:false},{time:'19:00',avail:true},{time:'20:00',avail:true},
];

function showPage(p){ document.querySelectorAll('.page').forEach(el=>el.classList.remove('active')); document.getElementById('page-'+p).classList.add('active'); window.scrollTo(0,0); }
function goHome(){ showPage('home'); }
function tryBooking(){ if(!STATE.user){ document.getElementById('auth-gate').style.display='flex'; } else { showPage('booking'); } }
function openAuthFromGate(tab){ document.getElementById('auth-gate').style.display='none'; STATE.pendingBooking=true; showPage('auth'); switchAuthTab(tab); }
function handleAuthNav(){
  if(STATE.user){ if(confirm('Sign out dari akun '+STATE.user.name+'?')){ STATE.user=null; document.getElementById('nav-auth-link').textContent='Sign In'; goHome(); } }
  else { showPage('auth'); }
}
function switchAuthTab(tab){
  document.getElementById('tab-signin').classList.toggle('active',tab==='signin');
  document.getElementById('tab-signup').classList.toggle('active',tab==='signup');
  document.getElementById('signin-form').style.display=tab==='signin'?'':'none';
  document.getElementById('signup-form').style.display=tab==='signup'?'':'none';
  document.getElementById('auth-error').style.display='none';
  document.getElementById('auth-error-su').style.display='none';
}
function afterAuth(){ document.getElementById('nav-auth-link').textContent=STATE.user.name.toUpperCase().split(' ')[0]+' ▾'; STATE.pendingBooking=false; showPage('booking'); }
function doSignIn(){
  const email=document.getElementById('si-email').value.trim(), pass=document.getElementById('si-pass').value, err=document.getElementById('auth-error');
  if(!email||!pass){err.textContent='⚠ Isi semua field ya!';err.style.display='';return;}
  if(!email.includes('@')){err.textContent='⚠ Email tidak valid';err.style.display='';return;}
  err.style.display='none'; STATE.user={email,name:email.split('@')[0]}; afterAuth();
}
function doSignUp(){
  const name=document.getElementById('su-name').value.trim(), email=document.getElementById('su-email').value.trim(), phone=document.getElementById('su-phone').value.trim(), pass=document.getElementById('su-pass').value, err=document.getElementById('auth-error-su');
  if(!name||!email||!phone||!pass){err.textContent='⚠ Isi semua field ya!';err.style.display='';return;}
  if(pass.length<8){err.textContent='⚠ Password minimal 8 karakter';err.style.display='';return;}
  err.style.display='none'; STATE.user={email,name}; afterAuth();
}

function buildCalendar(){
  const cal=document.getElementById('calendar');
  const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  cal.innerHTML=days.map(d=>`<div class="avail-day-label">${d}</div>`).join('');
  const today=new Date();
  for(let i=0;i<today.getDay();i++) cal.innerHTML+=`<div class="avail-day past"></div>`;
  for(let i=0;i<21;i++){
    const d=new Date(today); d.setDate(today.getDate()+i);
    const blocked=[3,7,14].includes(i);
    const dateStr=d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
    cal.innerHTML+=`<div class="avail-day${blocked?' unavail':''}" data-date="${dateStr}" onclick="pickDate(this,${blocked})">${d.getDate()}</div>`;
  }
}

function buildTimeSlots(){
  document.getElementById('time-slots').innerHTML=TIME_SLOTS.map(s=>
    `<div class="time-slot${s.avail?'':' full'}" onclick="pickTime(this,'${s.time}',${s.avail})">${s.time}${s.avail?'':' (penuh)'}</div>`
  ).join('');
}

function pickConsole(id){
  document.querySelectorAll('.console-option').forEach(el=>el.classList.remove('selected'));
  document.getElementById('co-'+id).classList.add('selected');
  STATE.console=id; STATE.controllers=null;
  // reset controller UI
  document.querySelectorAll('.ctrl-btn').forEach(b=>b.classList.remove('selected'));
  document.getElementById('ctrl-note').textContent='1 controller included. Extra controllers +Rp 5.000/jam each.';
  // show game list
  const c=CONSOLES[id];
  document.getElementById('game-list').innerHTML=c.games.map(g=>`<div class="game-list-item">${g}</div>`).join('');
  document.getElementById('game-list-wrap').style.display='';
  document.getElementById('ctrl-picker').style.display='';
  updateProgress(2); updateSummary();
}

function pickCtrl(n){
  document.querySelectorAll('.ctrl-btn').forEach(b=>b.classList.remove('selected'));
  document.getElementById('ctrl-'+n).classList.add('selected');
  STATE.controllers=n;
  const extra=n-1;
  const note = extra===0
    ? '1 controller included — no extra charge.'
    : `1 included + ${extra} extra controller${extra>1?'s':''} (+Rp ${(extra*CTRL_FEE).toLocaleString('id-ID')}/jam)`;
  document.getElementById('ctrl-note').textContent=note;
  updateSummary();
}

function selectConsoleFromHome(id){
  if(!STATE.user){ STATE.pendingBooking=true; document.getElementById('auth-gate').style.display='flex'; return; }
  showPage('booking'); setTimeout(()=>pickConsole(id),50);
}

function pickDur(n){
  document.querySelectorAll('.dur-btn').forEach(el=>el.classList.remove('selected'));
  document.getElementById('dur-'+n).classList.add('selected');
  STATE.duration=n; updateSummary();
}

function pickDate(el,blocked){
  if(blocked)return;
  document.querySelectorAll('.avail-day').forEach(d=>d.classList.remove('selected'));
  el.classList.add('selected'); STATE.date=el.dataset.date; updateSummary();
}

function pickTime(el,time,avail){
  if(!avail)return;
  document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected'); STATE.time=time;
  if(STATE.console) updateProgress(3);
  updateSummary();
}

function updateProgress(step){
  if(step>=2){ document.getElementById('pd1').className='progress-dot done'; document.getElementById('pl1').className='progress-label done'; document.getElementById('pline1').className='progress-line done'; document.getElementById('pd2').className='progress-dot active'; document.getElementById('pl2').className='progress-label active'; }
  if(step>=3){ document.getElementById('pd2').className='progress-dot done'; document.getElementById('pl2').className='progress-label done'; document.getElementById('pline2').className='progress-line done'; document.getElementById('pd3').className='progress-dot active'; document.getElementById('pl3').className='progress-label active'; }
}

function formatRp(n){ return 'Rp '+n.toLocaleString('id-ID'); }

function calcTotal(){
  const c=STATE.console?CONSOLES[STATE.console]:null;
  if(!c||!STATE.duration) return null;
  const extraCtrl = STATE.controllers ? (STATE.controllers-1) : 0;
  return (c.price + extraCtrl * CTRL_FEE) * STATE.duration;
}

function updateSummary(){
  const c=STATE.console?CONSOLES[STATE.console]:null;
  document.getElementById('sum-console').textContent=c?c.icon+' '+c.name:'—';
  document.getElementById('sum-ctrl').textContent=STATE.controllers?STATE.controllers+' controller'+(STATE.controllers>1?'s':''):'—';
  document.getElementById('sum-date').textContent=STATE.date||'—';
  document.getElementById('sum-time').textContent=STATE.time?STATE.time+' WIB':'—';
  document.getElementById('sum-dur').textContent=STATE.duration?STATE.duration+' jam':'—';
  const total=calcTotal();
  document.getElementById('sum-total').textContent=total?formatRp(total):'Rp —';
}

function proceedToPayment(){
  if(!STATE.console||!STATE.controllers||!STATE.duration||!STATE.date||!STATE.time){
    alert('Lengkapi semua pilihan: console, jumlah controller, durasi, tanggal, dan waktu!'); return;
  }
  const c=CONSOLES[STATE.console], total=calcTotal();
  document.getElementById('pay-sum-console').textContent=c.icon+' '+c.name;
  document.getElementById('pay-sum-ctrl').textContent=STATE.controllers+' controller'+(STATE.controllers>1?'s':'');
  document.getElementById('pay-sum-time').textContent=STATE.date+' · '+STATE.time+' ('+STATE.duration+' jam)';
  document.getElementById('pay-sum-total').textContent=formatRp(total);
  showPage('payment');
}

function pickPayMethod(m,el){
  document.querySelectorAll('.pay-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active');
  ['va','qris','gopay','ovo','cc'].forEach(id=>{ document.getElementById('pay-'+id).style.display=id===m?'':'none'; });
}

function doPayment(){
  const code='SZ-'+Math.floor(100000+Math.random()*900000);
  document.getElementById('booking-code').textContent=code;
  const c=CONSOLES[STATE.console];
  document.getElementById('success-detail').textContent=c.name+' · '+STATE.controllers+' ctrl · '+STATE.date+' · '+STATE.time+' · '+STATE.duration+' jam';
  showPage('success');
}

buildCalendar();
buildTimeSlots();
