// --- 전역 변수 및 상수 ---
const stages = document.querySelectorAll('.stage');
let gameLoopId, timerInterval, ovenLoopId;

// --- 유틸리티: 단계 전환 ---
function showStage(stageId) {
    stages.forEach(stage => stage.classList.remove('active'));
    document.getElementById(stageId).classList.add('active');

    if (stageId === 'stage-2') document.body.className = 'back-oven';
    else if (stageId === 'stage-3') document.body.className = 'back-2';
    else document.body.className = 'back-1';
}

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => initIntro());

function initIntro() {
    showStage('intro');
    document.getElementById('btn-start-ritual').onclick = () => {
        showStage('stage-1');
        initStage1(); 
    };
}

// --- 1단계: 참회 ---
const dialogueData = [
    "어서 오십시오, 길을 잃은 어린 양이여.",
    "그대의 혀는... 오랫동안 거짓된 맛에 속아왔군요.",
    "이제 그대는 파인애플 피자를 통해 진정한 맛의 길로 인도될 것입니다.",
    "자, 이제 그대의 의지를 보여주십시오.",
    "저 역겨운 우상들을 그대의 손으로 직접 파괴하십시오!"
];
// [복구됨] 동정심 유발 메시지
const pleaMessages = [
    "살려주세요!", "저도 맛있다구요!",
    "뜨거운 과일 타도하라!", "한 번만 봐주세요!", "으악!", "파인애플만 피자냐!"
];

let currentDialogueIndex = 0, isTyping = false, typingTimeout;

function initStage1() {
    document.getElementById('idol-destruction-interface').style.display = 'none';
    document.getElementById('vn-layer').style.display = 'block';
    document.getElementById('stage-1').classList.add('vn-stage');
    
    startDialogue();
    initLeaderHover(); // [복구됨] 상태창 활성화
}

// [복구됨] 교주 상태창 이벤트
function initLeaderHover() {
    const charEl = document.getElementById('vn-character');
    const statusEl = document.getElementById('leader-status');
    
    charEl.addEventListener('mouseenter', () => {
        statusEl.style.display = 'block';
        statusEl.classList.add('fade-in-status');
    });
    
    charEl.addEventListener('mouseleave', () => {
        statusEl.style.display = 'none';
        statusEl.classList.remove('fade-in-status');
    });
}

function startDialogue() {
    currentDialogueIndex = 0;
    showNextDialogue();
    document.getElementById('vn-layer').onclick = (e) => {
        // [수정] 대화창이나 레이어를 클릭했을 때만 넘어가도록
        if (e.target.id === 'vn-layer' || e.target.closest('#vn-dialogue-box')) {
            if (isTyping) completeTyping();
            else showNextDialogue();
        }
    };
}

function showNextDialogue() {
    if (currentDialogueIndex < dialogueData.length) {
        typeWriter(dialogueData[currentDialogueIndex]);
        currentDialogueIndex++;
    } else {
        endDialogue();
    }
}

function typeWriter(text) {
    const textEl = document.getElementById('vn-text');
    const indicator = document.querySelector('.next-indicator');
    textEl.textContent = '';
    indicator.style.display = 'none';
    isTyping = true;
    let i = 0;
    function type() {
        if (i < text.length) {
            textEl.textContent += text.charAt(i);
            i++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            indicator.style.display = 'block';
        }
    }
    type();
}

function completeTyping() {
    clearTimeout(typingTimeout);
    document.getElementById('vn-text').textContent = dialogueData[currentDialogueIndex - 1];
    isTyping = false;
    document.querySelector('.next-indicator').style.display = 'block';
}

function endDialogue() {
    document.getElementById('vn-layer').style.display = 'none';
    document.getElementById('stage-1').classList.remove('vn-stage');
    const destructionInterface = document.getElementById('idol-destruction-interface');
    destructionInterface.style.display = 'block';
    destructionInterface.style.animation = 'fadeIn 1s';
    initIdolDestruction();
}

// 우상 파괴 로직
function initIdolDestruction() {
    const idols = document.querySelectorAll('.idol-wrapper');
    const nextBtn = document.getElementById('btn-to-stage-2');
    const feedback = document.getElementById('idol-feedback');
    const tooltip = document.getElementById('cursor-tooltip');
    let destroyedCount = 0;

    idols.forEach(idol => {
        const newIdol = idol.cloneNode(true);
        idol.parentNode.replaceChild(newIdol, idol);
        
        // [복구됨] 말풍선 이벤트
        newIdol.addEventListener('mouseenter', () => {
            if (!newIdol.classList.contains('destroyed')) {
                const msg = pleaMessages[Math.floor(Math.random() * pleaMessages.length)];
                tooltip.textContent = msg;
                tooltip.style.display = 'block';
            }
        });
        
        newIdol.addEventListener('mousemove', (e) => {
            if (!newIdol.classList.contains('destroyed')) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY - 40) + 'px';
            }
        });

        newIdol.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

        newIdol.addEventListener('click', () => {
            tooltip.style.display = 'none';
            if (!newIdol.classList.contains('destroyed')) {
                newIdol.classList.add('destroyed');
                destroyedCount++;
                feedback.textContent = `'${newIdol.dataset.name}'의 우상을 파괴했습니다.`;
                if (destroyedCount === idols.length) nextBtn.disabled = false;
            }
        });
    });

    nextBtn.onclick = () => {
        const transitionEl = document.getElementById('pizza-transition');
        transitionEl.classList.add('slide-in');
        setTimeout(() => {
            transitionEl.classList.remove('slide-in');
            showStage('stage-2');
            initStage2(); 
        }, 1200);
    };
}

// --- 2단계: 오븐 ---
let currentTemp = 0;
const MAX_TEMP = 400;
let decayRate = 0.3; 
let increaseAmount = 30; 

function initStage2() {
    currentTemp = 0;
    updateOvenUI();
    window.addEventListener('keyup', handleSpaceKey);
    ovenLoopId = requestAnimationFrame(ovenLoop);
}

function handleSpaceKey(e) {
    if (e.code === 'Space') {
        currentTemp += increaseAmount;
        const stage2 = document.getElementById('stage-2');
        stage2.classList.remove('shake-hard');
        void stage2.offsetWidth; 
        stage2.classList.add('shake-hard');
        
        if (currentTemp >= MAX_TEMP) {
            currentTemp = MAX_TEMP;
            updateOvenUI();
            ovenClear();
            return;
        }
        updateOvenUI();
    }
}

function ovenLoop() {
    if (currentTemp > 0) {
        currentTemp -= decayRate;
        if (currentTemp < 0) currentTemp = 0;
    }
    updateOvenUI();
    if (currentTemp >= 400) { ovenClear(); return; }
    ovenLoopId = requestAnimationFrame(ovenLoop);
}

function updateOvenUI() {
    document.getElementById('temp-display').innerText = Math.floor(currentTemp);
    document.getElementById('temp-bar').style.width = (currentTemp / MAX_TEMP) * 100 + '%';
    document.querySelector('.fire-overlay').style.opacity = currentTemp / 400;
}

function ovenClear() {
    cancelAnimationFrame(ovenLoopId);
    window.removeEventListener('keyup', handleSpaceKey);
    showStage('stage-3');
    initStage3();
}

// --- 3단계: 피자 수호 ---
let pineapplesPlaced = 0, enemies = [], spawnRate = 40, frameCount = 0, timeLeft = 15; // was 60
const MAX_TIME = 15;
let mouseX = 0, mouseY = 0;

function initStage3() {
    pineapplesPlaced = 0;
    enemies = [];
    spawnRate = 60;
    frameCount = 0;
    timeLeft = 15;
    
    document.getElementById('dock').style.opacity = '1';
    document.getElementById('dock').style.transform = 'translateY(0)';
    document.getElementById('game-title').innerHTML = "성스러운 파인애플 5조각을<br>점선 위에 안착시키세요";
    document.getElementById('timer').style.display = 'none';
    document.getElementById('shield').style.display = 'none';
    document.getElementById('time-bar-container').style.display = 'none';
    document.getElementById('time-bar').style.width = '100%';
    document.body.style.cursor = 'default';
    
    document.querySelectorAll('.placed-pineapple').forEach(el => el.remove());

    const dock = document.getElementById('dock');
    const newDock = dock.cloneNode(true);
    dock.parentNode.replaceChild(newDock, dock);
    
    const targets = document.querySelectorAll('.target-zone');
    targets.forEach(t => {
        t.style.display = 'block';
        t.innerHTML = '';
        const newT = t.cloneNode(true);
        t.parentNode.replaceChild(newT, t);
    });

    const draggables = document.querySelectorAll('.pineapple');
    const newTargets = document.querySelectorAll('.target-zone');

    draggables.forEach(p => {
        p.style.display = 'block'; p.style.opacity = '1';
        p.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text', e.target.id);
            setTimeout(() => p.style.opacity = '0.5', 0);
        });
        p.addEventListener('dragend', (e) => e.target.style.opacity = '1');
    });

    newTargets.forEach(target => {
        target.addEventListener('dragover', (e) => e.preventDefault());
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text');
            const draggedEl = document.getElementById(id);
            if (draggedEl) {
                draggedEl.style.display = 'none';
                const newPineapple = document.createElement('div');
                newPineapple.className = 'placed-pineapple';
                document.getElementById('pizza').appendChild(newPineapple);
                const style = window.getComputedStyle(target);
                newPineapple.style.top = style.top;
                newPineapple.style.left = style.left;
                target.style.display = 'none'; 
                pineapplesPlaced++;
                if (pineapplesPlaced === 5) setTimeout(startPhase2, 500);
            }
        });
    });
}

function startPhase2() {
    document.getElementById('dock').style.opacity = '0';
    document.getElementById('dock').style.transform = 'translateY(100px)';
    document.getElementById('game-title').innerHTML = "민트초코로부터 15초간 피자를 사수하세요!";
    document.getElementById('shield').style.display = 'block';
    
    const timerEl = document.getElementById('timer');
    timerEl.style.display = 'block';
    timerEl.innerText = "15.00";
    
    document.getElementById('time-bar-container').style.display = 'block';
    document.body.style.cursor = 'none'; 
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.getElementById('shield').style.left = mouseX + 'px';
        document.getElementById('shield').style.top = mouseY + 'px';
    });

    setTimeout(() => {
        gameLoop();
        startTimer();
    }, 1000);
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    const timeBar = document.getElementById('time-bar');
    timerInterval = setInterval(() => {
        timeLeft -= 0.05;
        timeBar.style.width = (timeLeft / MAX_TIME) * 100 + '%';
        if (timeLeft <= 0) {
            timeLeft = 0;
            timeBar.style.width = '0%';
            gameWin();
        }
        timerEl.innerText = timeLeft.toFixed(2);
    }, 50);
}

class MintChoco {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'mint-choco';
        document.body.appendChild(this.el);
        const edge = Math.floor(Math.random() * 4);
        if(edge===0){this.x=Math.random()*window.innerWidth;this.y=-300;}
        else if(edge===1){this.x=window.innerWidth+300;this.y=Math.random()*window.innerHeight;}
        else if(edge===2){this.x=Math.random()*window.innerWidth;this.y=window.innerHeight+300;}
        else{this.x=-300;this.y=Math.random()*window.innerHeight;}
        
        this.size = 180; 
        this.speed = Math.random() * 2 + 1.5; 
        this.vx = 0; this.vy = 0; 
        this.isRepelled = false; 
    }

    update() {
        // 제거 플래그가 없으므로 로직 단순화
        
        const pCx = window.innerWidth / 2; const pCy = window.innerHeight / 2;
        const myCx = this.x + this.size / 2; const myCy = this.y + this.size / 2;
        const distToPizza = Math.sqrt((pCx-myCx)**2 + (pCy-myCy)**2);
        const distToMouse = Math.sqrt((myCx-mouseX)**2 + (myCy-mouseY)**2);
        const shieldRadius = (this.size / 2) + 50;

        if (distToMouse < shieldRadius) {
            this.isRepelled = true;
            this.vx = ((myCx - mouseX) / distToMouse) * 30; // 튕겨나감
            this.vy = ((myCy - mouseY) / distToMouse) * 30;
        }

        if (!this.isRepelled) {
            const angle = Math.atan2(pCy - myCy, pCx - myCx);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        this.x += this.vx; this.y += this.vy;
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';

        if (!this.isRepelled && distToPizza < 120) return 'HIT_PIZZA';
        if (this.x < -400 || this.x > window.innerWidth + 400 || this.y < -400 || this.y > window.innerHeight + 400) {
            return 'OUT';
        }
        return 'ALIVE';
    }
}

function gameLoop() {
    frameCount++;
    if (frameCount % Math.floor(spawnRate) === 0) {
        enemies.push(new MintChoco());
        if (spawnRate > 10) spawnRate -= 1; // was 0.5
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        const status = enemies[i].update();
        if (status === 'HIT_PIZZA') { endGame(); return; }
        else if (status === 'OUT') { enemies[i].el.remove(); enemies.splice(i, 1); }
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoopId);
    document.body.style.cursor = 'default';
    document.getElementById('game-over').classList.add('active');
    document.getElementById('btn-retry').onclick = () => {
        enemies.forEach(e => e.el.remove());
        document.getElementById('game-over').classList.remove('active');
        initStage3(); 
    };
}

function gameWin() {
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoopId);
    enemies.forEach(e => e.el.remove()); 
    document.body.style.cursor = 'default';
    document.getElementById('shield').style.display = 'none';
    document.getElementById('time-bar-container').style.display = 'none';
    document.getElementById('victory-screen').classList.add('active');

    document.getElementById('btn-download').onclick = () => {
        const link = document.createElement('a');
        link.href = 'pizza1.png';
        link.download = 'sacred_hawaiian_pizza.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("성스러운 피자가 강림했습니다.");
    };

    document.getElementById('btn-share').onclick = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert("교단 링크 복사 완료.\n널리 전파하십시오.");
        }).catch(() => {
            prompt("이 링크를 복사하여 전파하십시오:", url);
        });
    };

    document.getElementById('btn-restart-game').onclick = () => {
        location.reload();
    };
    
    const titles = ["과즙의 사도", "신성한 조각", "오븐의 파수꾼", "황금 혀의 시종"];
    const number = Math.floor(Math.random() * 900) + 100;
    const newName = `${titles[Math.floor(Math.random() * titles.length)]} ${number}호`;
    const nameEl = document.getElementById('new-cult-name');
    nameEl.textContent = "...";
    setTimeout(() => { nameEl.textContent = newName; }, 1000);
}