const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE="muslimahStudy2State";
const defaultState={xp:0,coins:100,lives:3,streak:0,bestStreak:0,games:0,correct:0,answered:0,combo:0,theme:"light"};
let state=JSON.parse(localStorage.getItem(STORAGE)||"null")||defaultState;
let DATA=null, questions=[], qIndex=0, session={correct:0,answered:0,xp:0,coins:0,score:0}, timerId=null, timeLeft=30, gameOver=false;

async function loadData(){try{let r=await fetch("data.json");DATA=await r.json()}catch(e){DATA=window.MUSLIMAH_STUDY_DATA} renderSurahs(); startGame();}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function level(){return Math.floor(state.xp/100)+1}
function xpInLevel(){return state.xp%100}
function updateStats(){
  $("#homeLevel").textContent=level();$("#homeXp").textContent=state.xp;$("#homeStreak").textContent=state.streak+" hari";$("#homeCoins").textContent=state.coins;
  $("#level").textContent=level();$("#xp").textContent=state.xp;$("#xpBar").style.width=xpInLevel()+"%";
  $("#coins").textContent=state.coins;$("#lives").textContent=state.lives;
  $("#statsLevel").textContent=level();$("#games").textContent=state.games;$("#correct").textContent=state.correct;
  $("#accuracy").textContent=(state.answered?Math.round(state.correct/state.answered*100):0)+"%";$("#bestStreak").textContent=state.bestStreak;
  renderBadges();
}
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function go(page){$$(".page").forEach(x=>x.classList.toggle("active",x.id===page));$$("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));window.scrollTo({top:0,behavior:"smooth"});if(page==="stats")updateStats();if(page==="game"&&questions.length===0)startGame()}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀️":"🌙";save()};
if(state.theme==="dark"){document.body.classList.add("dark");$("#themeBtn").textContent="☀️"}

function allPairs(){
  let arr=[];
  DATA.surahs.forEach(s=>s.ayahs.forEach(a=>a.next.forEach(n=>{
    let next=s.ayahs.find(z=>z.n===n); if(next)arr.push({surah:s,ayah:a,next});
  })));
  return arr;
}
function shuffle(a){return a.sort(()=>Math.random()-.5)}
function makeQuestions(){
  let pool=shuffle(allPairs().slice()); return pool.slice(0,Math.min(10,pool.length));
}
function startGame(){
  clearInterval(timerId);gameOver=false;state.lives=3;state.combo=0;qIndex=0;session={correct:0,answered:0,xp:0,coins:0,score:0};questions=makeQuestions();renderQuestion();updateStats();
}
function renderQuestion(){
  if(qIndex>=questions.length){finishGame();return}
  let q=questions[qIndex], s=q.surah;
  $("#gameSurah").textContent="QS. "+s.name;$("#questionCount").textContent=`Pertanyaan ${qIndex+1}/${questions.length}`;
  $("#currentAyah").textContent=q.ayah.text+" ۝"+q.ayah.n;
  $("#combo").textContent="Combo ×"+state.combo;
  let correct=q.next;
  let candidates=[correct];
  let all=s.ayahs.filter(a=>a.n!==correct.n);
  // Prefer distractors from the same surah, then global pool.
  shuffle(all).slice(0,2).forEach(a=>candidates.push(a));
  let global=allPairs().filter(x=>x.next.n!==correct.n && x.surah.id!==s.id).map(x=>x.next);
  shuffle(global).slice(0,Math.max(0,4-candidates.length)).forEach(a=>candidates.push(a));
  candidates=shuffle(candidates).slice(0,4);
  $("#answers").innerHTML=candidates.map((a,i)=>`<button class="answer" data-n="${a.n}">${a.text} ۝${a.n}</button>`).join("");
  $$(".answer").forEach(b=>b.onclick=()=>answer(+b.dataset.n,correct.n,b));
  resetTimer();
}
function resetTimer(){clearInterval(timerId);timeLeft=30;$("#timer").textContent=timeLeft;timerId=setInterval(()=>{timeLeft--;$("#timer").textContent=timeLeft;if(timeLeft<=0){clearInterval(timerId);answer(-1,questions[qIndex].next.n,null,true)}},1000)}
function answer(choice,correct,btn,timeout=false){
  if(gameOver)return; clearInterval(timerId);state.answered++;session.answered++;
  if(choice===correct){
    if(btn)btn.classList.add("correct");
    state.correct++;session.correct++;state.combo++;let gain=10+Math.min(state.combo*2,10);state.xp+=gain;state.coins+=5;session.xp+=gain;session.coins+=5;session.score+=100+state.combo*10;
    toast(state.combo>=3?"🔥 Combo keren! +"+gain+" XP":"✨ Benar! +"+gain+" XP");
    save();updateStats();setTimeout(()=>{qIndex++;renderQuestion()},650);
  }else{
    if(btn)btn.classList.add("wrong");
    let correctBtn=$$(".answer").find(x=>+x.dataset.n===correct);if(correctBtn)correctBtn.classList.add("correct");
    state.lives=Math.max(0,state.lives-1);state.combo=0;toast(timeout?"⏰ Waktu habis!":"💗 Belum tepat, coba lagi!");
    save();updateStats();
    setTimeout(()=>{if(state.lives<=0){finishGame()}else{qIndex++;renderQuestion()}},900);
  }
}
$("#hintBtn").onclick=()=>{
  if(state.coins<10){toast("🪙 Koin belum cukup");return}
  state.coins-=10;save();let correct=questions[qIndex]?.next.n;if(correct){let btns=$$(".answer");let wrong=btns.filter(b=>+b.dataset.n!==correct);if(wrong.length){wrong[0].style.opacity=".25";wrong[0].disabled=true}}updateStats();toast("💡 Satu pilihan disamarkan!");
}
$("#skipBtn").onclick=()=>{if(gameOver)return;clearInterval(timerId);state.combo=0;toast("⏭️ Pertanyaan dilewati");qIndex++;renderQuestion()}
function finishGame(){
  if(gameOver)return;gameOver=true;clearInterval(timerId);
  state.games++;state.xp+=session.xp; // session.xp is already added in answer; neutralized below
  state.xp-=session.xp;
  state.streak=Math.min(state.streak+1,999);state.bestStreak=Math.max(state.bestStreak,state.streak);
  save();updateStats();
  let acc=session.answered?Math.round(session.correct/session.answered*100):0;
  $("#resultTitle").textContent=acc>=80?"MasyaAllah, hafalanmu makin kuat! 🌷":acc>=50?"Bagus! Yuk latihan lagi sedikit demi sedikit. 💗":"Tidak apa-apa, setiap latihan tetap berarti. 🌱";
  $("#resultScore").textContent=session.score;$("#resultAccuracy").textContent=acc+"%";$("#resultXp").textContent="+"+session.xp;$("#resultCoins").textContent="+"+session.coins;
  $("#resultModal").classList.add("show");
}
$("#closeModal").onclick=()=>$("#resultModal").classList.remove("show");
$("#againBtn").onclick=()=>{$("#resultModal").classList.remove("show");startGame()};

function renderSurahs(filter=""){
  if(!DATA)return;let f=filter.toLowerCase();
  let list=DATA.surahs.filter(s=>s.name.toLowerCase().includes(f)||s.arabicName.includes(filter));
  $("#surahList").innerHTML=list.map(s=>`<article class="surah-card card"><div class="arabic">${s.arabicName}</div><h3>${s.name}</h3><small>${s.ayahs.length} ayat dalam dataset</small><p>${s.ayahs.slice(0,2).map(a=>a.text).join(" • ")}</p><button class="secondary play-surah" data-id="${s.id}">▶ Latihan</button></article>`).join("")||`<div class="notice card">Surah tidak ditemukan 🌷</div>`;
  $$(".play-surah").forEach(b=>b.onclick=()=>{questions=allPairs().filter(x=>x.surah.id===b.dataset.id);if(!questions.length){toast("Surah ini belum punya pasangan ayat.");return}qIndex=0;session={correct:0,answered:0,xp:0,coins:0,score:0};state.lives=3;go("game");renderQuestion()})
}
$("#surahSearch").oninput=e=>renderSurahs(e.target.value);

function renderBadges(){
 let list=[
  ["🌱","First Step",state.games>=1,"Selesaikan 1 game"],
  ["🔥","Streak Girl",state.streak>=3,"Streak 3 hari"],
  ["⭐","XP Hunter",state.xp>=100,"Kumpulkan 100 XP"],
  ["🎯","Sharp Mind",state.correct>=10,"Jawab 10 soal benar"],
  ["🪙","Coin Collector",state.coins>=150,"Punya 150 koin"],
  ["🏆","Level Up",level()>=3,"Capai level 3"],
  ["🌷","Consistent",state.games>=5,"Selesaikan 5 game"],
  ["💗","Qur'an Lover",state.correct>=25,"25 jawaban benar"]
 ];
 $("#badges").innerHTML=list.map(b=>`<div class="badge card ${b[2]?"":"locked"}"><div class="emoji">${b[0]}</div><b>${b[1]}</b><small>${b[2]?"Terbuka ✨":b[3]}</small></div>`).join("");
}
$("#resetBtn").onclick=()=>{if(confirm("Yakin ingin menghapus semua progres?")){localStorage.removeItem(STORAGE);location.reload()}};
loadData();updateStats();
