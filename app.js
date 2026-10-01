console.log("JS is connected to PHP!");

// ============================================
// CONNECTION TO MySQL DATABASE
// ============================================

const APP_URL = 'http://localhost/projet/app/';

async function appCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(APP_URL + endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('APP Error:', error);
        return { error: error.message };
    }
}

async function loadCarsFromDB() {
    const result = await appCall('cars.php');
    if (result.error) {
        console.log('MySQL error, using localStorage');
        return store.get('cars') || [];
    }
    // Update localStorage cache
    store.set('cars', result);
    return result;
}

async function loadTicketsFromDB() {
    const result = await appCall('tickets.php');
    if (result.error) {
        return store.get('tickets') || [];
    }
    store.set('tickets', result);
    return result;
}

// Default data (fallback if MySQL doesn't respond)
const DEFAULT_CARS = [];
const DEFAULT_TICKETS = [];
const DEFAULT_USERS = [];

// ── STORAGE HELPERS ───────────────────────
const store = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
    set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
    init: async () => {
        // Load from MySQL first
        const carsFromDB = await loadCarsFromDB();
        if (!store.get('cars') && carsFromDB.length === 0) {
            store.set('cars', DEFAULT_CARS);
        }
        
        const ticketsFromDB = await loadTicketsFromDB();
        if (!store.get('tickets') && ticketsFromDB.length === 0) {
            store.set('tickets', DEFAULT_TICKETS);
        }
        
        if (!store.get('users')) store.set('users', DEFAULT_USERS);
        if (!store.get('purchases')) store.set('purchases', []);
        if (!store.get('favorites')) store.set('favorites', []);
        if (!store.get('notifications')) store.set('notifications', []);
    }
};

// ── SESSION ───────────────────────────────
const session = {
    get: () => store.get('session'),
    set: (u) => store.set('session', u),
    clear: () => localStorage.removeItem('session'),
    isLoggedIn: () => !!store.get('session'),
    isAdmin: () => store.get('session')?.role === 'admin'
};

// ── NOTIFICATIONS ─────────────────────────
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'notification-container';
        newContainer.style.cssText = 'position:fixed; top:80px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(newContainer);
    }
    
    const notification = document.createElement('div');
    const colors = {
        success: '#4ade80',
        error: '#f87171',
        warning: '#fb923c',
        info: 'var(--gold)'
    };
    
    notification.style.cssText = `
        background: var(--bg2);
        border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 8px;
        padding: 12px 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        font-family: var(--font-ui);
        font-size: 13px;
        color: var(--cream);
        cursor: pointer;
    `;
    notification.innerHTML = message;
    
    document.getElementById('notification-container')?.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function addNotif(msg) {
    const notifs = store.get('notifications') || [];
    notifs.unshift({ id: Date.now(), message: msg, status:'unread', created_at: new Date().toISOString() });
    store.set('notifications', notifs.slice(0, 30));
}

function checkTicketStock(ticket) {
    if (ticket.stock === 0) addNotif(`⚠️ Ticket "${ticket.race}" is OUT OF STOCK`);
    else if (ticket.stock < 5) addNotif(`⚠️ Ticket "${ticket.race}" is running LOW (only ${ticket.stock} left)`);
}

// ── BADGE HELPER ──────────────────────────
function stockBadge(stock) {
    if (stock === 0) return `<span class="badge b-out">Out of Stock</span>`;
    if (stock < 5) return `<span class="badge b-low">Low Stock (${stock})</span>`;
    return `<span class="badge b-in">In Stock</span>`;
}

// ── ROUTER ────────────────────────────────
function getPage() {
    return location.hash.replace('#','') || 'home';
}

function navigate(page) {
    location.hash = page;
}

// ── RENDER ENGINE ─────────────────────────
async function render() {
    const page = getPage();
    const app = document.getElementById('app');
    if (!app) return;

    document.querySelectorAll('.s-link[data-nav]').forEach(el => {
        el.classList.toggle('active', el.dataset.nav === page);
    });

    renderTopbarProfile();

    switch(page) {
        case 'home': await renderHome(app); break;
        case 'tickets': await renderTickets(app); break;
        case 'login': renderLogin(app); break;
        case 'dashboard': renderDashboard(app); break;
        case 'manage-cars': renderManageCars(app); break;
        case 'manage-tickets': renderManageTickets(app); break;
        default:
            if (page.startsWith('car-')) renderCarDetail(app, parseInt(page.replace('car-','')));
            else await renderHome(app);
    }
}

async function loadDriversFromDB(carId) {
    const result = await apiCall(`drivers.php?car_id=${carId}`);
    if (result.error) {
        return [];
    }
    return result;
}

// ── TOPBAR PROFILE ────────────────────────
function renderTopbarProfile() {
    const el = document.getElementById('topbar-profile');
    if (!el) return;
    const u = session.get();
    if (u) {
        el.innerHTML = `
            <div class="profile-pill" onclick="navigate('${u.role==='admin'?'dashboard':'home'}')">
                <div class="p-av">${u.username[0].toUpperCase()}</div>
                <div><div class="p-name">${u.username}</div><span class="p-role">${u.role}</span></div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`;
    } else {
        el.innerHTML = `<button class="btn btn-primary btn-sm" onclick="navigate('login')">Login</button>`;
    }
    const nb = document.getElementById('notif-badge');
    if (nb) {
        const count = (store.get('notifications')||[]).filter(n=>n.status==='unread').length;
        nb.textContent = count;
        nb.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ── HOME ──────────────────────────────────
async function renderHome(app) {
    const search = (new URLSearchParams(location.search)).get('q') || '';
    const showFav = (new URLSearchParams(location.search)).get('fav') === '1';
    const favs = store.get('favorites') || [];
    const uid = session.get()?.id;

    // 🔥 LOADING FROM MySQL! 🔥
    let cars = await loadCarsFromDB();
    
    if (search) {
        cars = cars.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || 
                                 (c.team && c.team.toLowerCase().includes(search.toLowerCase())));
    }
    if (showFav && uid) {
        cars = cars.filter(c => favs.some(f => f.userId === uid && f.carId === c.id));
    }

    app.innerHTML = `
        ${renderHero()}
        <section class="section" id="gallery">
            <div class="sec-hd">
                <div>
                    <h2 class="sec-title">EXPERIENCE <span>OUR CARS</span></h2>
                    <div class="sec-sub">
                        ${search ? `Results for "${search}" — ${cars.length} found` : showFav ? 'Your favourite cars' : `THE 2026 GENERATION OF FORMULA 1`}
                    </div>
                </div>
                <div class="flex-center gap-8" style="flex-wrap:wrap">
                    ${(search||showFav) ? `<button class="btn btn-ghost btn-sm" onclick="clearFilters()">Clear</button>` : ''}
                    ${session.isLoggedIn() ? `<button class="btn btn-sm ${showFav?'btn-outline':'btn-ghost'}" onclick="toggleFavFilter()">★ Favorites</button>` : ''}
                    ${session.isAdmin() ? `<button class="btn btn-primary btn-sm" onclick="navigate('manage-cars')">+ Add Car</button>` : ''}
                </div>
            </div>
            ${cars.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🏎️</div>
                    <h3>No Cars Found</h3>
                    <p>Try a different search term.</p>
                </div>` : `
                <div class="cars-grid">
                    ${cars.map(c => renderCarCard(c, favs, uid)).join('')}
                </div>
            `}
        </section>
    `;
}

function renderHero() {
    return `
    <section class="hero">
        <video id="heroVideo" class="hero-video" autoplay muted loop playsinline>
            <source src="video/This_is_Formula_1_Sports_F1.mp4" type="video/mp4">
        </video>
        
        <button id="unmuteBtn" onclick="toggleVideoSound()" style="position:fixed; bottom:20px; right:20px; z-index:9999; background:#C9A84C; color:#0D0B0B; border:1px solid #C9A84C; padding:8px 16px; cursor:pointer; font-weight:bold; font-size:12px; border-radius:0px;">
            🔊 ACTIVER LE SON
        </button>
        
        <div class="hero-video-overlay"></div>
        <div class="hero-bg"></div>
        <div class="hero-grid"></div>
        <div class="hero-content">
            <h1 class="hero-title">
                <span class="solid">FORMULA </span><span class="outline">1</span><br>
                <span class="gold"></span> <span class="solid"></span>
            </h1>
            <div class="hero-rule"></div>
            <p class="hero-sub">Discover. Feel. Race.</p>
            <div class="hero-cta">
                <button class="btn btn-gold" onclick="navigate('tickets')">Race Tickets</button>
            </div>
        </div>
        <div class="hero-stripe"></div>
        <div class="scroll-hint">
            <div class="scroll-line"></div>
        </div>
    </section>`;
}

// Fonction pour activer/couper le son
function toggleVideoSound() {
    var video = document.getElementById('heroVideo');
    var btn = document.getElementById('unmuteBtn');
    
    if (!video) return;
    
    if (video.muted) {
        video.muted = false;
        video.volume = 0.3;
        btn.innerHTML = ' COUPER LE SON';
        btn.style.background = '#8B6914';
        btn.style.color = '#F5EDD8';
    } else {
        video.muted = true;
        btn.innerHTML = ' ACTIVER LE SON';
        btn.style.background = '#C9A84C';
        btn.style.color = '#0D0B0B';
    }
}
function renderCarCard(c, favs, uid) {
    const isFav = uid && favs.some(f => f.userId === uid && f.carId === c.id);
    return `
    <div class="car-card" onclick="navigate('car-${c.id}')">
        <div class="car-side-img">
            ${c.image_url ? `<img src="${c.image_url}" alt="${c.name}" loading="lazy" onerror="this.style.display='none'">` : '<div style="background:#1a1a1a;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);">NO IMAGE</div>'}
            <div class="car-side-overlay"></div>
            <span class="car-year">${c.year}</span>
            ${session.isLoggedIn() ? `
            <div class="fav-btn ${isFav?'on':''}" onclick="toggleFav(event,${c.id})" title="${isFav?'Remove':'Add to'} favorites">
                ${isFav?'★':'☆'}
            </div>` : ''}
        </div>
        <div class="car-body">
            <div class="car-team">${c.team || '—'}</div>
            <div class="car-name">${c.name}</div>
            <div class="car-quick-specs">
                ${c.speed ? `<div class="cqs-item"><span class="cqs-val">${c.speed}</span><span class="cqs-lbl">Top Speed</span></div>` : ''}
                ${c.engine ? `<div class="cqs-item"><span class="cqs-val">${c.engine.split(' ').slice(0,2).join(' ')}</span><span class="cqs-lbl">Engine</span></div>` : ''}
                ${c.hp ? `<div class="cqs-item"><span class="cqs-val">${c.hp}</span><span class="cqs-lbl">Power</span></div>` : ''}
            </div>
            <div class="car-footer">
                <span class="view-link">Discover →</span>
            </div>
        </div>
    </div>`;
}

function toggleFav(e, carId) {
    e.stopPropagation();
    if (!session.isLoggedIn()) { navigate('login'); return; }
    const uid = session.get().id;
    let favs = store.get('favorites') || [];
    const idx = favs.findIndex(f => f.userId === uid && f.carId === carId);
    if (idx > -1) favs.splice(idx, 1);
    else favs.push({ userId: uid, carId });
    store.set('favorites', favs);
    render();
}

function toggleFavFilter() {
    const u = new URLSearchParams(location.search);
    u.get('fav') === '1' ? u.delete('fav') : u.set('fav', '1');
    history.replaceState(null, '', '?' + u.toString());
    render();
}

function clearFilters() {
    history.replaceState(null, '', location.pathname);
    render();
}

function doSearch(e) {
    e && e.preventDefault();
    const q = document.getElementById('search-input')?.value || '';
    history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
    if (getPage() !== 'home') navigate('home');
    else render();
}

// ── CAR DETAIL ─────────────────────────────
async function renderCarDetail(app, id) {
    const cars = store.get('cars') || [];
    const c = cars.find(x => x.id === id);
    if (!c) { renderHome(app); return; }

    const favs = store.get('favorites') || [];
    const uid = session.get()?.id;
    const isFav = uid && favs.some(f => f.userId === uid && f.carId === id);

    let driversHTML = '';
    try {
        const response = await fetch(`http://localhost/projet/app/drivers.php?car_id=${id}`);
        const driversData = await response.json();
        
        if (driversData && driversData.length > 0) {
            driversHTML = `
                <div class="drivers-section">
                    <div class="drivers-section-title">
                        <span class="title-line"></span>
                        <span class="title-text">${c.team} 2026 — DRIVERS</span>
                        <span class="title-line"></span>
                    </div>
                    <div class="pilots-grid">
                        ${driversData.map(d => `
                            <div class="driver-card">
                                <div class="driver-photo-container">
                                    <img class="driver-photo" 
                                         src="${d.image_url}" 
                                         alt="${d.name}"
                                         onerror="this.src='/projet/images/drivers/placeholder.png'">
                                </div>
                                <div class="driver-number">${d.number}</div>
                                <div class="driver-name">${d.name}</div>
                                <div class="driver-team">${c.team}</div>
                                <div class="driver-stats">
                                    <span>${d.wins || 0} WINS</span>
                                    <span>|</span>
                                    <span>${d.podiums || 0} PODIUMS</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } catch(e) {
        console.log('Error loading drivers:', e);
    }

    const accelMap = {
        'Ferrari SF-26': '2.4s',
        'Red Bull RB22': '2.3s', 
        'Mercedes W16': '2.5s',
        'McLaren MCL40': '2.4s'
    };
    const accel = accelMap[c.name] || '2.5s';
    const shortName = c.name.split(' ').slice(-2).join(' ').toUpperCase();

    app.innerHTML = `
    <div class="poster-page">
        <div class="poster-nav">
            <button class="btn btn-ghost btn-sm poster-back" onclick="navigate('home')">← Back</button>
            <div class="flex-center gap-8">
                ${session.isLoggedIn() ? `
                <button class="btn btn-sm ${isFav?'btn-outline':'btn-ghost'} poster-action" onclick="toggleFav(event,${c.id})">
                    ${isFav?'★ Favorited':'☆ Favorite'}
                </button>` : ''}
                ${session.isAdmin() ? `
                <button class="btn btn-ghost btn-sm poster-action" onclick="editCar(${c.id})">✏ Edit</button>
                <button class="btn btn-danger btn-sm poster-action" onclick="deleteCar(${c.id})">🗑 Delete</button>` : ''}
            </div>
        </div>
        <div class="poster-body">
            <div class="poster-team-label">${c.team}</div>
            <div class="poster-watermark">${shortName}</div>
            <div class="poster-car-wrap">
                ${c.image_url ? `<img src="${c.image_url}" alt="${c.name}" class="poster-car-img" onerror="this.parentElement.style.opacity='.3'">` : `<div style="color:rgba(245,237,216,.15);font-size:48px;">NO IMAGE</div>`}
            </div>
            <div class="poster-specs-block">
                <div class="psb-line">ENGINE · ${c.engine || '1.6L V6'}</div>
                <div class="psb-line">POWER · ${c.hp || '1000+ HP'}</div>
                <div class="psb-line">0–100 KM/H · ${accel}</div>
                <div class="psb-line">TOP SPEED · ${c.speed || '—'}</div>
            </div>
            <div class="poster-year">${c.year}</div>
        </div>
        <div class="poster-info-strip">
            <div class="pis-left">
                ${driversHTML}
                <p class="pis-desc">${c.desc || ''}</p>
            </div>
        </div>
    </div>`;
}

// ── TICKETS ───────────────────────────────
function renderTicketCard(t, u, balance) {
    const outOfStock = t.stock <= 0;
    const lowStock = t.stock > 0 && t.stock < 5;
    const ticketPrice = parseFloat(t.price) || 0;
    const userBalance = parseFloat(balance) || 0;
    const noBalance = u && userBalance < ticketPrice;
    
    return `
    <div class="tkt-card">
        <div class="tkt-head">
            <div class="tkt-race">${t.race}</div>
            <div class="tkt-loc"> ${t.location}</div>
            <div class="tkt-date">${new Date(t.date).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="tkt-body">
            <div class="tkt-price">$${ticketPrice}</div>
            <div class="tkt-stock">
                ${outOfStock ? '<span class="badge b-out">OUT OF STOCK</span>' : 
                  lowStock ? `<span class="badge b-low"> LOW STOCK (${t.stock})</span>` : 
                  `<span class="badge b-in"> ${t.stock} in stock </span>`}
            </div>
        </div>
        <div class="tkt-foot">
            ${outOfStock ? 
                `<button class="btn-tkt disabled" disabled>OUT OF STOCK</button>` :
              !u ? 
                `<button class="btn-tkt login" onclick="showLoginMessage()">🔒 LOGIN REQUIRED</button>` :
              noBalance ? 
                `<button class="btn-tkt disabled" disabled> INSUFFICIENT BALANCE</button>` :
                `<button class="btn-tkt buy" onclick="buyTicket(${t.id})"> BUY — $${ticketPrice}</button>`
            }
        </div>
    </div>`;
}

async function renderTickets(app) {
    let tickets = await loadTicketsFromDB();
    const u = session.get();
    let balance = 0;
    
    if (u) {
        // Récupérer le solde à jour depuis store
        const users = store.get('users') || [];
        const fresh = users.find(x => x.id === u.id);
        if (fresh) { 
            balance = parseFloat(fresh.balance) || 0;
            // Mettre à jour la session
            session.set({...u, balance: balance}); 
        } else {
            balance = parseFloat(u.balance) || 0;
        }
    }
    
    const flash = sessionStorage.getItem('ticket-flash');
    const flashType = sessionStorage.getItem('ticket-flash-type') || 'ok';
    sessionStorage.removeItem('ticket-flash');
    sessionStorage.removeItem('ticket-flash-type');
    
    const isAdmin = session.isAdmin();

    app.innerHTML = `
        <div class="page-head">
            <div class="page-head-inner">
                <div>
                    <h1 class="page-ttl">Race <span>Tickets</span></h1>
                </div>
                <div class="header-actions">
                    ${u ? `<div class="bal-chip"><small> Balance</small>$${balance.toFixed(2)}</div>` : ''}
                    ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="navigate('manage-tickets')"> Manage Tickets</button>` : ''}
                </div>
            </div>
        </div>
        <div class="section" style="padding-top:0">
            ${flash ? `<div class="alert a-${flashType}" style="max-width:700px">${flash}</div>` : ''}
            <div class="tickets-grid">
                ${tickets.map(t => renderTicketCard(t, u, balance)).join('')}
            </div>
        </div>
    `;
}
function showLoginMessage() {
    sessionStorage.setItem('ticket-flash', '🔐 Please login to purchase tickets.');
    sessionStorage.setItem('ticket-flash-type', 'info');
    navigate('login');
}

function buyTicket(ticketId) {
    const u = session.get();
    if (!u) { 
        showLoginMessage();
        return; 
    }

    console.log("Utilisateur session:", u);

    // Récupérer les données
    let tickets = store.get('tickets') || [];
    let users = store.get('users') || [];
    
    console.log("Tous les users:", users);
    
    // 🔥 Trouver l'utilisateur par ID
    let user = users.find(x => x.id === u.id);
    
    // Si pas trouvé par ID, essayer par username
    if (!user) {
        user = users.find(x => x.username === u.username);
    }
    
    console.log("Utilisateur trouvé:", user);
    
    if (!user) {
        console.error("User not found in database!");
        showNotification('User not found. Please logout and login again.', 'error');
        return;
    }

    const t = tickets.find(x => x.id === ticketId);
    
    if (!t) { 
        showNotification('Ticket not found', 'error'); 
        return; 
    }
    
    if (t.stock <= 0) { 
        showNotification('❌ This ticket is sold out!', 'error');
        return; 
    }
    
    const currentBalance = parseFloat(user.balance) || 0;
    const ticketPrice = parseFloat(t.price) || 0;
    
    console.log("Solde actuel:", currentBalance);
    console.log("Prix ticket:", ticketPrice);
    
    if (currentBalance < ticketPrice) { 
        showNotification(`💸 Insufficient balance! Need $${(ticketPrice - currentBalance).toFixed(2)} more`, 'error');
        return; 
    }

    // Achat
    const newBalance = currentBalance - ticketPrice;
    user.balance = newBalance;
    t.stock--;

    // Sauvegarder
    store.set('users', users);
    store.set('tickets', tickets);
    
    // Mettre à jour la session
    session.set({
        id: user.id,
        username: user.username,
        role: user.role,
        balance: newBalance
    });
    
    console.log("Nouveau solde:", newBalance);
    console.log("Session mise à jour:", session.get());

    // Historique
    const purchases = store.get('purchases') || [];
    purchases.unshift({ 
        id: Date.now(), 
        userId: user.id, 
        ticketId: t.id, 
        amount: ticketPrice, 
        date: new Date().toISOString() 
    });
    store.set('purchases', purchases);

    showNotification(`✅ Purchase successful! ${t.race} - $${ticketPrice}\n}`, 'success');
    
    if (t.stock < 5 && t.stock > 0) {
        addNotif(`⚠️ ALERT: Ticket "${t.race}" only has ${t.stock} seats left!`);
    }
    
    if (t.stock === 0) {
        addNotif(`❌ URGENT: Ticket "${t.race}" is COMPLETELY SOLD OUT!`);
    }

    render();
}
// ── LOGIN ─────────────────────────────────
function renderLogin(app) {
    if (session.isLoggedIn()) { navigate(session.isAdmin() ? 'dashboard' : 'home'); return; }
    const flash = sessionStorage.getItem('login-flash') || '';
    sessionStorage.removeItem('login-flash');

    app.innerHTML = `
    <div class="login-page">
        <div class="login-card">
            <div class="login-logo">
                <div class="login-icon">F1</div>
                <div class="login-ttl">Welcome Back</div>
                <div class="login-sub">Formula 1 Digital Museum</div>
            </div>
            ${flash ? `<div class="alert a-err">${flash}</div>` : ''}
            <div class="login-form">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" id="l-user" class="form-input" placeholder="Enter username">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" id="l-pass" class="form-input" placeholder="Enter password">
                </div>
                <button class="btn btn-primary" onclick="doLogin()" style="width:100%; justify-content:center; margin-top:10px;">ENTER →</button>
            </div>
            
        </div>
    </div>`;
}

async function doLogin() {
    const username = document.getElementById('l-user')?.value.trim() || '';
    const password = document.getElementById('l-pass')?.value || '';
    
    // Utiliser store.get('users') localStorage
    const users = store.get('users') || [];
    
    // Si la base est vide, ajouter des utilisateurs par défaut
    if (users.length === 0) {
        store.set('users', [
            { id: 1, username: 'yas', password: 'yasadmin', role: 'admin', balance: 9999 },
            { id: 2, username: 'driver1', password: 'password', role: 'client', balance: 1500 }
        ]);
    }
    
    const freshUsers = store.get('users') || [];
    const user = freshUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        session.set(user);
        navigate(user.role === 'admin' ? 'dashboard' : 'home');
    } else {
        sessionStorage.setItem('login-flash', '⚠ Invalid username or password.');
        render();
    }
}

function logout() {
    session.clear();
    navigate('home');
}

// ── DASHBOARD (admin) ─────────────────────
function renderDashboard(app) {
    if (!session.isAdmin()) { navigate('home'); return; }
    const cars = store.get('cars') || [];
    const tickets = store.get('tickets') || [];
    const users = store.get('users') || [];
    const purchases = store.get('purchases') || [];
    const revenue = purchases.reduce((s, p) => s + p.amount, 0);
    const clients = users.filter(u => u.role === 'client').length;

    app.innerHTML = `
        <div class="page-head">
            <h1 class="page-ttl">Admin <span>Dashboard</span></h1>
        </div>
        <div class="section">
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-lbl">Total Cars</div><div class="stat-val y">${cars.length}</div></div>
                <div class="stat-card"><div class="stat-lbl">Tickets</div><div class="stat-val y">${tickets.length}</div></div>
                <div class="stat-card"><div class="stat-lbl">Clients</div><div class="stat-val">${clients}</div></div>
                <div class="stat-card"><div class="stat-lbl">Revenue</div><div class="stat-val y">$${revenue}</div></div>
            </div>
            <button class="btn btn-primary" onclick="navigate('manage-cars')">Manage Cars</button>
            <button class="btn btn-primary" onclick="navigate('manage-tickets')">Manage Tickets</button>
        </div>
    `;
}

// ── MANAGE CARS (admin) ───────────────────
function renderManageCars(app) {
    if (!session.isAdmin()) { navigate('home'); return; }
    const cars = store.get('cars') || [];
    
    app.innerHTML = `
        <div class="page-head">
            <h1 class="page-ttl">Manage <span>Cars</span></h1>
            <button class="btn btn-primary" onclick="showCarForm()">+ Add Car</button>
        </div>
        <div class="section">
            <div id="car-form-wrap" style="display:none; margin-bottom:30px;"></div>
            
            <div class="tbl-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Team</th>
                            <th>Year</th>
                            <th>Speed</th>
                            <th>HP</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cars.map(c => `
                            <tr>
                                <td><strong>${c.name || '—'}</strong></td>
                                <td>${c.team || '—'}</td>
                                <td>${c.year || '—'}</td>
                                <td>${c.speed || '—'}</td>
                                <td>${c.hp || '—'}</td>
                                <td class="td-act">
                                    <button class="btn-edit" onclick="editCar(${c.id})">✏ Edit</button>
                                    <button class="btn-delete" onclick="deleteCar(${c.id})">🗑 Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showCarForm(car) {
    const w = document.getElementById('car-form-wrap');
    if (!w) return;
    
    w.innerHTML = `
        <div class="form-card">
            <h3 style="font-family: var(--font-display); color: var(--gold); margin-bottom: 20px;">${car ? '✏ Edit Car' : '➕ Add New Car'}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Car Name</label>
                    <input id="cf-name" class="form-input" placeholder="e.g. Ferrari SF-26" value="${car?.name || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Team</label>
                    <input id="cf-team" class="form-input" placeholder="e.g. Scuderia Ferrari" value="${car?.team || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Year</label>
                    <input id="cf-year" class="form-input" type="number" placeholder="2026" value="${car?.year || '2026'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Top Speed</label>
                    <input id="cf-speed" class="form-input" placeholder="e.g. 380 km/h" value="${car?.speed || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Engine</label>
                    <input id="cf-engine" class="form-input" placeholder="e.g. 1.6L V6" value="${car?.engine || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Horsepower</label>
                    <input id="cf-hp" class="form-input" placeholder="e.g. 1000+ HP" value="${car?.hp || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Image URL</label>
                    <input id="cf-img" class="form-input" placeholder="https://..." value="${car?.image_url || ''}">
                </div>
                <div class="form-group fg-full">
                    <label class="form-label">Description</label>
                    <textarea id="cf-desc" class="form-input" rows="3" placeholder="Car description...">${car?.desc || ''}</textarea>
                </div>
            </div>
            <div class="flex-center gap-8 mt-24">
                <button class="btn btn-primary" onclick="saveCarForm(${car?.id || ''})">💾 Save Car</button>
                <button class="btn btn-ghost" onclick="hideCarForm()">Cancel</button>
            </div>
        </div>
    `;
    w.style.display = 'block';
    w.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCarForm() {
    const w = document.getElementById('car-form-wrap');
    if (w) w.style.display = 'none';
}

function editCar(id) {
    const car = store.get('cars').find(c => c.id === id);
    if (car) showCarForm(car);
}

function deleteCar(id) {
    if (confirm('Delete this car?')) {
        const cars = store.get('cars').filter(c => c.id !== id);
        store.set('cars', cars);
        render();
    }
}

function saveCarForm(id) {
    const car = {
        id: id || Date.now(),
        name: document.getElementById('cf-name')?.value,
        team: document.getElementById('cf-team')?.value,
        year: parseInt(document.getElementById('cf-year')?.value) || 2026,
        speed: document.getElementById('cf-speed')?.value,
        engine: document.getElementById('cf-engine')?.value,
        hp: document.getElementById('cf-hp')?.value,
        image_url: document.getElementById('cf-img')?.value,
        desc: document.getElementById('cf-desc')?.value
    };
    
    let cars = store.get('cars') || [];
    if (id) {
        cars = cars.map(c => c.id === id ? { ...c, ...car } : c);
    } else {
        car.id = Date.now();
        cars.push(car);
    }
    store.set('cars', cars);
    hideCarForm();
    render();
}

// ── MANAGE TICKETS (admin) ────────────────
function renderManageTickets(app) {
    if (!session.isAdmin()) { navigate('home'); return; }
    const tickets = store.get('tickets') || [];
    const flash = sessionStorage.getItem('tkt-flash') || '';
    const ftype = sessionStorage.getItem('tkt-flash-type') || 'ok';
    sessionStorage.removeItem('tkt-flash');
    sessionStorage.removeItem('tkt-flash-type');

    app.innerHTML = `
        <div class="page-head">
            <div class="page-head-inner">
                <div>
                    <h1 class="page-ttl">Manage <span>Tickets</span></h1>
                    <p class="breadcrumb">Manage races and tickets</p>
                </div>
                <button class="btn btn-primary" id="showAddTicketBtn" onclick="showTktForm()">+ Add Ticket</button>
            </div>
        </div>
        <div class="section" style="padding-top:0">
            ${flash ? `<div class="alert a-${ftype}">${flash}</div>` : ''}
            
            <div id="tkt-form-wrap" style="display:none;" class="tkt-form-container"></div>
            
            <div class="admin-table-wrapper">
                <table class="admin-tickets-table">
                    <thead>
                        <tr>
                            <th>Race</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickets.map(t => `
                            <tr>
                                <td><strong>${t.race}</strong></td>
                                <td>${t.location}</td>
                                <td>${t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '—'}</td>
                                <td class="price-cell">$${parseFloat(t.price).toFixed(2)}</td>
                                <td>${t.stock}</td>
                                <td>${t.stock === 0 ? '<span class="badge-status out">Sold out</span>' : 
                                     t.stock < 5 ? '<span class="badge-status low">Low stock</span>' : 
                                     '<span class="badge-status ok">Available</span>'}</td>
                                <td class="actions-cell">
                                    <button class="action-btn edit" onclick="editTkt(${t.id})">✏ Edit</button>
                                    <button class="action-btn delete" onclick="deleteTkt(${t.id})">🗑 Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showTktForm(ticket) {
    const w = document.getElementById('tkt-form-wrap');
    if (!w) return;
    
    w.innerHTML = `
        <div class="form-card">
            <h3 style="font-family: var(--font-display); color: var(--gold); margin-bottom: 20px;">${ticket ? '✏ Edit Ticket' : '➕ Add New Ticket'}</h3>
            <div class="form-grid">
                <div class="form-group fg-full">
                    <label class="form-label">Race Name</label>
                    <input id="tf-race" class="form-input" placeholder="e.g. Monaco Grand Prix" value="${ticket?.race || ''}">
                </div>
                <div class="form-group fg-full">
                    <label class="form-label">Circuit / Location</label>
                    <input id="tf-loc" class="form-input" placeholder="e.g. Circuit de Monaco" value="${ticket?.location || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input id="tf-date" class="form-input" type="date" value="${ticket?.date || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Price ($)</label>
                    <input id="tf-price" class="form-input" type="number" step="0.01" placeholder="350.00" value="${ticket?.price || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Stock</label>
                    <input id="tf-stock" class="form-input" type="number" placeholder="100" value="${ticket?.stock || '100'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="tf-cat" class="form-input">
                        <option value="General Admission" ${ticket?.cat === 'General Admission' ? 'selected' : ''}>General Admission</option>
                        <option value="Grandstand" ${ticket?.cat === 'Grandstand' ? 'selected' : ''}>Grandstand</option>
                        <option value="Premium" ${ticket?.cat === 'Premium' ? 'selected' : ''}>Premium</option>
                        <option value="VIP" ${ticket?.cat === 'VIP' ? 'selected' : ''}>VIP</option>
                    </select>
                </div>
            </div>
            <div class="flex-center gap-8 mt-24">
                <button class="btn btn-primary" onclick="saveTktForm(${ticket?.id || ''})">💾 ${ticket ? 'Save' : 'Add Ticket'}</button>
                <button class="btn btn-ghost" onclick="hideTktForm()">Cancel</button>
            </div>
        </div>
    `;
    w.style.display = 'block';
    w.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideTktForm() {
    const w = document.getElementById('tkt-form-wrap');
    if (w) {
        w.style.display = 'none';
        w.innerHTML = '';
    }
}

function editTkt(id) {
    const ticket = store.get('tickets').find(t => t.id === id);
    if (ticket) showTktForm(ticket);
}

function deleteTkt(id) {
    if (confirm('Delete this ticket?')) {
        const tickets = store.get('tickets').filter(t => t.id !== id);
        store.set('tickets', tickets);
        render();
    }
}

function saveTktForm(id) {
    const ticket = {
        id: id || Date.now(),
        race: document.getElementById('tf-race')?.value,
        location: document.getElementById('tf-loc')?.value,
        price: parseFloat(document.getElementById('tf-price')?.value),
        stock: parseInt(document.getElementById('tf-stock')?.value),
        date: document.getElementById('tf-date')?.value,
        cat: document.getElementById('tf-cat')?.value || 'Grandstand'
    };
    let tickets = store.get('tickets') || [];
    if (id) {
        tickets = tickets.map(t => t.id === id ? ticket : t);
    } else {
        tickets.push(ticket);
    }
    store.set('tickets', tickets);
    hideTktForm();
    render();
}

// ── INITIALISATION ────────────────────────
(async function init() {
    await store.init();
    window.addEventListener('hashchange', () => render());
    render();
})();
