// --- Data & Stats ---
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let score = Number(localStorage.getItem("score")) || 0;
let level = Math.floor(score / 50) + 1;
let streak = Number(localStorage.getItem("streak")) || 0;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const notifSound = document.getElementById("notifSound");

// --- Notification permission ---
if(Notification.permission !== "granted") Notification.requestPermission();

// --- Save/Load ---
function saveData(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("score", score);
    localStorage.setItem("streak", streak);
}

// --- Progress Bar ---
function updateProgressBar(){
    const completed = tasks.filter(t => t.done).length;
    const percent = tasks.length ? Math.floor(completed / tasks.length * 100) : 0;
    document.getElementById("progressBar").style.width = percent + "%";
}

// --- Badge ---
function checkBadge(){
    const container = document.getElementById("badgeContainer");
    if(score>=50 && !document.getElementById("badge1")){
        const b = document.createElement("div");
        b.className = "badge"; b.id = "badge1"; b.textContent = "🏆 First 50 Points!";
        container.appendChild(b);
    }
    if(streak>=5 && !document.getElementById("badge2")){
        const b = document.createElement("div");
        b.className = "badge"; b.id = "badge2"; b.textContent = "🔥 5 Streak!";
        container.appendChild(b);
    }
}

// --- Update stats ---
function updateStats(){
    level = Math.floor(score / 50) + 1;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    streakEl.textContent = streak;
    updateProgressBar();
    checkBadge();
}

// --- Notification ---
function notifyTask(task){
    if(Notification.permission === "granted"){
        new Notification("📌 Reminder", {body: task.text});
        notifSound.play();
    } else alert("Reminder: "+task.text);
    task.notified = true;
}

// --- Render tasks ---
function renderTasks(){
    const ul = document.getElementById("taskList");
    const filter = document.getElementById("filterTag").value.toLowerCase();
    ul.innerHTML = "";

    tasks.forEach((t,i)=>{
        if(filter && !t.tag.toLowerCase().includes(filter)) return;

        const li = document.createElement("li");
        li.className = t.priority + (t.done?" completed":"");

        const left = document.createElement("div");
        left.innerHTML = `<strong>${t.text}</strong> <small>[${t.tag}]</small>`;

        const right = document.createElement("div");
        const countdown = document.createElement("span"); countdown.className="countdown";

        function updateCountdown(){
            const diff = new Date(t.time) - new Date();
            if(diff>0){
                const h = Math.floor(diff/3600000);
                const m = Math.floor((diff%3600000)/60000);
                const s = Math.floor((diff%60000)/1000);
                countdown.textContent = `${h}h ${m}m ${s}s`;
                countdown.style.color = diff<60000?"#f44336":diff<300000?"#ff9800":"#555";
            } else {
                countdown.textContent = "หมดเวลา!";
                if(!t.notified) notifyTask(t);
            }
        }
        updateCountdown();
        setInterval(updateCountdown,1000);

        right.appendChild(countdown);
        li.appendChild(left);
        li.appendChild(right);

        // click = complete
        li.onclick = ()=>{
            if(!t.done){ score+=10; streak+=1; }
            t.done = !t.done;
            updateStats();
            saveData();
            renderTasks();
        }

        // dblclick = delete
        li.ondblclick = ()=>{
            if(!t.done){ score-=5; streak=0; }
            tasks.splice(i,1);
            updateStats();
            saveData();
            renderTasks();
        }

        ul.appendChild(li);
    });
}

// --- Add task ---
function addTask(){
    const text = document.getElementById("taskInput").value.trim();
    const time = document.getElementById("taskTime").value;
    const priority = document.getElementById("priority").value;
    const tag = document.getElementById("tagInput").value.trim() || "General";
    const recurring = document.getElementById("recurring").value;

    if(!text || !time){ alert("กรอกข้อมูลให้ครบ!"); return; }

    const task = {text,time,priority,tag,recurring,done:false,notified:false};
    tasks.push(task);
    saveData();
    scheduleNotification(task);
    renderTasks();

    document.getElementById("taskInput").value="";
    document.getElementById("taskTime").value="";
    document.getElementById("tagInput").value="";
}

// --- Schedule notification ---
function scheduleNotification(task){
    const diff = new Date(task.time) - new Date();
    if(diff>0){
        setTimeout(()=>notifyTask(task),diff);
    } else notifyTask(task);
}

// --- Dark mode ---
function toggleDarkMode(){ document.body.classList.toggle("dark"); }

// --- Export ---
function exportTasks(){
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks,null,2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "tasks.json";
    a.click();
}

// --- Initialize ---
tasks.forEach(t=>scheduleNotification(t));
renderTasks();
updateProgressBar();
checkBadge();
