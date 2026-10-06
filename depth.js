/* ============================================================
   DEPTH HUB — main logic
   ============================================================ */

document.body.classList.remove("light");

/* ---------- SHORTCUTS ---------- */
var loginScreen  = document.getElementById("loginScreen");
var signupScreen = document.getElementById("signupScreen");
var appEl        = document.getElementById("app");

/* ---------- CONSTANTS ---------- */
var ADMIN_USERNAME   = "depth";
var CURRENT_USER_KEY = "depthhub_current";

/* ============================================================
   STORAGE HELPERS
============================================================ */
function getAccounts() {
    try { return JSON.parse(localStorage.getItem("depthhub_accounts") || "{}"); }
    catch (e) { return {}; }
}

function saveAccounts(accounts) {
    localStorage.setItem("depthhub_accounts", JSON.stringify(accounts));
}

function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function saveAccount(username, password, displayName, extra) {
    var accounts = getAccounts();
    var key = username.toLowerCase();
    accounts[key] = Object.assign({
        password:    password,
        displayName: displayName,
        signin:      "Depth Hub",
        email:       key + "@depthhub.com",
        memberSince: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        userId:      uuid(),
        banned:      false,
        mutedUntil:  0
    }, extra || {});
    saveAccounts(accounts);
}

function findAccount(username) {
    var accounts = getAccounts();
    return accounts[username.toLowerCase()] || null;
}

/* ---------- SESSION ---------- */
function setCurrentUser(u) { localStorage.setItem(CURRENT_USER_KEY, u.toLowerCase()); }
function getCurrentUser()  { return localStorage.getItem(CURRENT_USER_KEY); }
function clearCurrentUser(){ localStorage.removeItem(CURRENT_USER_KEY); }

/* ============================================================
   SCREEN SWITCHING
============================================================ */
function showSignup() {
    loginScreen.classList.add("hidden");
    signupScreen.classList.remove("hidden");
    document.getElementById("signupError").innerText = "";
    document.getElementById("signupSuccess").innerText = "";
}

function showLogin() {
    signupScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    document.getElementById("loginError").innerText = "";
}

/* ============================================================
   SIGNUP
============================================================ */
function doSignup() {
    var name = document.getElementById("signupName").value.trim();
    var user = document.getElementById("signupUser").value.trim();
    var pass = document.getElementById("signupPass").value;
    var errEl = document.getElementById("signupError");
    var okEl  = document.getElementById("signupSuccess");
    errEl.innerText = "";
    okEl.innerText  = "";

    if (!name || !user || !pass) { errEl.innerText = "Please fill in every field."; return; }
    if (pass.length < 4)          { errEl.innerText = "Password must be at least 4 characters."; return; }
    if (findAccount(user))        { errEl.innerText = "That username is already taken."; return; }

    saveAccount(user, pass, name);
    okEl.innerText = "Account created! Logging you in...";

    setTimeout(function() {
        startApp(user);
        document.getElementById("signupName").value = "";
        document.getElementById("signupUser").value = "";
        document.getElementById("signupPass").value = "";
        okEl.innerText = "";
    }, 700);
}

/* ============================================================
   LOGIN
============================================================ */
function doLogin() {
    var errEl = document.getElementById("loginError");
    errEl.innerText = "";

    var user = document.getElementById("loginUser").value.trim();
    var pass = document.getElementById("loginPass").value;
    if (!user || !pass) { errEl.innerText = "Please enter your username and password."; return; }

    var account = findAccount(user);
    if (!account || account.password !== pass) {
        errEl.innerText = "Wrong username or password.";
        return;
    }
    if (account.banned) {
        errEl.innerText = "🚫 This account has been banned by an admin.";
        return;
    }
    startApp(user);
}

function doGoogleLogin() {
    var user = "googleuser";
    if (!findAccount(user)) {
        saveAccount(user, "googlepass", "Google User", { signin: "Google" });
    }
    startApp(user);
}

/* ============================================================
   START APP / LOGOUT
============================================================ */
function startApp(username) {
    var key = username.toLowerCase();
    setCurrentUser(key);

    loginScreen.classList.add("hidden");
    signupScreen.classList.add("hidden");
    appEl.classList.add("visible");

    refreshUserInfo(key);
    renderProfile(key);
    renderAdminPanel();

    var adminBtn = document.getElementById("adminNavBtn");
    adminBtn.style.display = (key === ADMIN_USERNAME) ? "flex" : "none";

    goToView("chat");
}

function logout() {
    clearCurrentUser();
    appEl.classList.remove("visible");
    signupScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").innerText = "";
    document.getElementById("sidebar").classList.remove("hidden");
    calcClear();
}

/* ============================================================
   SIDEBAR USER INFO
============================================================ */
function refreshUserInfo(key) {
    var acc = findAccount(key);
    if (!acc) return;
    document.getElementById("userName").innerText = acc.displayName;
    document.getElementById("userInitial").innerText = acc.displayName.charAt(0).toUpperCase();
}

/* ============================================================
   EVENT WIRING
============================================================ */
document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault(); doLogin();
});
document.getElementById("signupForm").addEventListener("submit", function(e){
    e.preventDefault(); doSignup();
});
document.getElementById("googleBtn").addEventListener("click", doGoogleLogin);
document.getElementById("showSignupLink").addEventListener("click", showSignup);
document.getElementById("showLoginLink").addEventListener("click", showLogin);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("menuToggle").addEventListener("click", function(){
    document.getElementById("sidebar").classList.toggle("hidden");
});

/* ============================================================
   THEME
============================================================ */
var themeBtn = document.getElementById("themeToggle");

function updateThemeBtn() {
    themeBtn.innerText = document.body.classList.contains("light") ? "☀️ Light" : "🌙 Dark";
}
updateThemeBtn();

themeBtn.addEventListener("click", function() {
    document.body.classList.toggle("light");
    updateThemeBtn();
});

/* ============================================================
   VIEW SWITCHING
============================================================ */
var navButtons = document.querySelectorAll(".nav-btn[data-view]");
var views = {
    chat:       document.getElementById("chatView"),
    calculator: document.getElementById("calcView"),
    profile:    document.getElementById("profileView"),
    admin:      document.getElementById("adminView")
};
var viewTitle = document.getElementById("viewTitle");
var sidebarEl = document.getElementById("sidebar");

function goToView(target) {
    navButtons.forEach(function(b){
        b.classList.toggle("active", b.dataset.view === target);
    });
    Object.keys(views).forEach(function(k){ views[k].classList.remove("active"); });
    views[target].classList.add("active");

    viewTitle.innerText =
        target === "chat"       ? "Public Chat" :
        target === "calculator" ? "Calculator"  :
        target === "profile"    ? "Profile"     :
                                  "Admin Panel";

    if (window.innerWidth < 800) sidebarEl.classList.add("hidden");
}

navButtons.forEach(function(btn) {
    btn.addEventListener("click", function() {
        goToView(btn.dataset.view);
    });
});

/* ============================================================
   CHAT
============================================================ */
var messagesEl = document.getElementById("messages");
var chatInput  = document.getElementById("chatInput");

function sendMessage() {
    var key = getCurrentUser();
    var acc = findAccount(key);
    if (!acc) return;

    if (acc.mutedUntil && acc.mutedUntil > Date.now()) {
        var left = Math.ceil((acc.mutedUntil - Date.now()) / 1000);
        alert("🔇 You are muted for another " + left + " seconds.");
        return;
    }

    var text = chatInput.value.trim();
    if (!text) return;

    var msg = document.createElement("div");
    msg.className = "msg me";
    msg.innerHTML = '<span class="name">You</span>' + escapeHtml(text);
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    chatInput.value = "";

    setTimeout(function() {
        var reply = document.createElement("div");
        reply.className = "msg other";
        reply.innerHTML = '<span class="name">Bot</span>Cool! 👀';
        messagesEl.appendChild(reply);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 900);
}

document.getElementById("sendBtn").addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", function(e){
    if (e.key === "Enter") sendMessage();
});

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m){
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m];
    });
}

/* ============================================================
   CALCULATOR
============================================================ */
var currentInput = "";
var display  = document.getElementById("display");
var calcKeys = document.getElementById("calcKeys");

["7","8","9","4","5","6","1","2","3","0","C","="].forEach(function(k){
    var b = document.createElement("button");
    b.innerText = k;
    if (k === "C") b.className = "clear";
    if (k === "=") b.className = "equals";
    b.addEventListener("click", function(){
        if (k === "C") calcClear();
        else if (k === "=") calcEquals();
        else calcPress(k);
    });
    calcKeys.appendChild(b);
});

function calcPress(v) { currentInput += v; display.innerText = currentInput; }
function calcClear()  { currentInput = ""; display.innerText = "0"; }

function calcEquals() {
    var raw = currentInput.trim();
    if (!raw) return;

    if (raw === "676767676767") { openSecretPage("You wasted your time."); return; }
    if (raw === "123321")       { openSecretPage("🔓 You found the secret code!"); return; }

    try {
        if (!/^[0-9+\-*/().\s]+$/.test(raw)) {
            display.innerText = "Error";
            currentInput = "";
            return;
        }
        var result = Function('"use strict";return (' + raw + ')')();
        if (result === undefined || result === null || isNaN(result)) {
            display.innerText = "Error";
            currentInput = "";
            return;
        }
        display.innerText = result;
        currentInput = String(result);
    } catch (e) {
        display.innerText = "Error";
        currentInput = "";
    }
}

function openSecretPage(message) {
    document.open();
    document.write(
        '<!DOCTYPE html><html><head><title>Secret</title>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<style>' +
        'html,body{margin:0;padding:0;height:100%;background:#fff;color:#111;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;}' +
        '.box{max-width:420px;}h1{font-size:32px;margin:0 0 16px;}' +
        'p{font-size:16px;color:#444;margin:0 0 30px;line-height:1.5;}' +
        'button{padding:14px 26px;font-size:15px;font-weight:700;border:none;' +
        'border-radius:12px;background:#2f7bff;color:#fff;cursor:pointer;}' +
        '</style></head><body><div class="box">' +
        '<h1>🤫 Secret Page</h1><p>' + message + '</p>' +
        '<button onclick="history.back()">Go back</button></div></body></html>'
    );
    document.close();
}

/* ============================================================
   PROFILE
============================================================ */
function renderProfile(key) {
    var acc = findAccount(key);
    if (!acc) return;

    document.getElementById("profileAvatar").innerText = acc.displayName.charAt(0).toUpperCase();
    document.getElementById("profileDisplayName").innerText = acc.displayName;
    document.getElementById("profileEmail").innerText = acc.email;

    document.getElementById("infoEmail").innerText  = acc.email;
    document.getElementById("infoSignin").innerText = acc.signin || "Depth Hub";
    document.getElementById("infoSince").innerText  = acc.memberSince || "—";
    document.getElementById("infoType").innerText   = key === ADMIN_USERNAME ? "Admin" : "Member";
    document.getElementById("infoUserId").innerText = acc.userId;
}

document.getElementById("changePassBtn").addEventListener("click", function(){
    var key = getCurrentUser();
    var acc = findAccount(key);
    var oldP = document.getElementById("oldPass").value;
    var newP = document.getElementById("newPass").value;
    var errEl = document.getElementById("passError");
    var okEl  = document.getElementById("passSuccess");
    errEl.innerText = "";
    okEl.innerText  = "";

    if (!acc) return;
    if (oldP !== acc.password) { errEl.innerText = "Current password is wrong."; return; }
    if (newP.length < 4)       { errEl.innerText = "New password must be at least 4 characters."; return; }

    var accounts = getAccounts();
    accounts[key].password = newP;
    saveAccounts(accounts);

    document.getElementById("oldPass").value = "";
    document.getElementById("newPass").value = "";
    okEl.innerText = "✅ Password updated.";
});

document.getElementById("deleteAccBtn").addEventListener("click", function(){
    if (!confirm("Delete your account permanently?")) return;
    var key = getCurrentUser();
    var accounts = getAccounts();
    delete accounts[key];
    saveAccounts(accounts);
    logout();
});

/* ============================================================
   ADMIN PANEL
============================================================ */
function renderAdminPanel() {
    var me = getCurrentUser();
    if (me !== ADMIN_USERNAME) return;

    var accounts = getAccounts();
    var listEl = document.getElementById("adminUserList");
    var muteEl = document.getElementById("adminMuteList");
    listEl.innerHTML = "";
    muteEl.innerHTML = "";

    var hasMutes = false;

    Object.keys(accounts).forEach(function(k) {
        var a = accounts[k];

        var statusBits = [];
        if (a.banned) statusBits.push("<span style='color:#ff6b6b;'>BANNED</span>");
        if (a.mutedUntil && a.mutedUntil > Date.now()) {
            var secs = Math.ceil((a.mutedUntil - Date.now()) / 1000);
            statusBits.push("<span style='color:#fbbf24;'>MUTED (" + secs + "s)</span>");
        }
        var statusLine = statusBits.length ? " · " + statusBits.join(" · ") : "";

        var row = document.createElement("div");
        row.className = "admin-user-row";
        row.innerHTML =
            '<div class="admin-user-top">' +
                '<div>' +
                    '<div class="admin-user-name">' + escapeHtml(a.displayName) + '</div>' +
                    '<div class="admin-user-sub">@' + escapeHtml(k) + statusLine + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="admin-actions">' +
                (a.banned
                    ? '<button class="btn-admin unban" data-action="unban" data-user="' + k + '">Unban</button>'
                    : '<button class="btn-admin ban"   data-action="ban"   data-user="' + k + '">Ban</button>') +
                '<select class="mute-select" data-user="' + k + '">' +
                    '<option value="0">Mute…</option>' +
                    '<option value="10">10 sec</option>' +
                    '<option value="60">1 min</option>' +
                    '<option value="300">5 min</option>' +
                    '<option value="3600">1 hour</option>' +
                    '<option value="86400">1 day</option>' +
                '</select>' +
                '<button class="btn-admin mute" data-action="mute" data-user="' + k + '">Mute</button>' +
                (a.mutedUntil && a.mutedUntil > Date.now()
                    ? '<button class="btn-admin unmute" data-action="unmute" data-user="' + k + '">Unmute</button>'
                    : '') +
            '</div>';
        listEl.appendChild(row);

        if (a.mutedUntil && a.mutedUntil > Date.now()) {
            hasMutes = true;
            var mRow = document.createElement("div");
            mRow.className = "info-row";
            var secsLeft = Math.ceil((a.mutedUntil - Date.now()) / 1000);
            mRow.innerHTML = '<span class="info-label">@' + escapeHtml(k) + '</span>' +
                             '<span class="info-value">' + secsLeft + 's left</span>';
            muteEl.appendChild(mRow);
        }
    });

    if (!hasMutes) {
        muteEl.innerHTML = '<div class="info-row"><span class="info-label">No muted users.</span></div>';
    }

    listEl.querySelectorAll("[data-action='ban']").forEach(function(b){
        b.addEventListener("click", function(){ banUser(b.dataset.user, true); });
    });
    listEl.querySelectorAll("[data-action='unban']").forEach(function(b){
        b.addEventListener("click", function(){ banUser(b.dataset.user, false); });
    });
    listEl.querySelectorAll("[data-action='mute']").forEach(function(b){
        b.addEventListener("click", function(){
            var user = b.dataset.user;
            var sel = listEl.querySelector('.mute-select[data-user="' + user + '"]');
            var secs = parseInt(sel.value, 10);
            if (!secs) { alert("Choose a duration first."); return; }
            muteUser(user, secs);
        });
    });
    listEl.querySelectorAll("[data-action='unmute']").forEach(function(b){
        b.addEventListener("click", function(){ unmuteUser(b.dataset.user); });
    });
}

function banUser(username, shouldBan) {
    var accounts = getAccounts();
    if (!accounts[username]) return;
    accounts[username].banned = shouldBan;
    if (!shouldBan) accounts[username].mutedUntil = 0;
    saveAccounts(accounts);
    renderAdminPanel();
}

function muteUser(username, seconds) {
    var accounts = getAccounts();
    if (!accounts[username]) return;
    accounts[username].mutedUntil = Date.now() + seconds * 1000;
    saveAccounts(accounts);
    renderAdminPanel();
}

function unmuteUser(username) {
    var accounts = getAccounts();
    if (!accounts[username]) return;
    accounts[username].mutedUntil = 0;
    saveAccounts(accounts);
    renderAdminPanel();
}
