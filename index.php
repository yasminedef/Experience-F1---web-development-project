<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F1 Digital Museum</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</head>
<body>
<div class="shell">

    <!-- SIDEBAR -->
    <aside class="sidebar">
        <div class="s-logo">F1</div>
        <nav class="s-nav">
            <a class="s-link" data-nav="home" onclick="navigate('home')" title="Gallery">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-linejoin="round"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            </a>
            <a class="s-link" data-nav="tickets" onclick="navigate('tickets')" title="Tickets">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6v6a3 3 0 010 6H2a3 3 0 010-6V9z"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
            </a>
            <a class="s-link" data-nav="dashboard" id="nav-dashboard" onclick="navigate('dashboard')" title="Dashboard" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
            </a>
            <a class="s-link" data-nav="manage-cars" id="nav-manage-cars" onclick="navigate('manage-cars')" title="Manage Cars" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
            </a>
            <a class="s-link" data-nav="manage-tickets" id="nav-manage-tickets" onclick="navigate('manage-tickets')" title="Manage Tickets" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.07 4.93A10 10 0 0122 12a10 10 0 01-2.93 7.07M4.93 4.93A10 10 0 012 12a10 10 0 002.93 7.07"/>
                </svg>
            </a>
        </nav>
        <div class="s-bottom">
            <a class="s-link" id="nav-logout" onclick="handleSidebarAuth()" title="Login / Logout">
                <svg id="sidebar-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
            </a>
        </div>
    </aside>

    <!-- TOPBAR -->
    <header class="topbar">
        <div class="t-title">F1 <span>Experience</span></div>
        <form class="search-wrap" onsubmit="doSearch(event)">
            <input type="text" id="search-input" placeholder="Search cars, teams…" value="">
            <button type="submit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            </button>
        </form>
        <div class="t-actions">
            <a class="notif-btn" id="notif-bell" onclick="navigate('dashboard')" title="Notifications" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <span class="n-dot" id="notif-badge" style="display:none">0</span>
            </a>
            <div id="topbar-profile"></div>
        </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="main" id="app"></main>

</div>

<script src="js/app.js"></script>
<!-- SUPPRIME TOUT LE CODE <script> CI-DESSOUS -->
</body>
</html>