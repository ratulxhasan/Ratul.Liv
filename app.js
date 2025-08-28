const playlistSelector = document.getElementById('playlistSelector');
const searchInput = document.getElementById('searchInput');
const categorySelector = document.getElementById('categorySelector');
const channelsGrid = document.getElementById('channelsGrid');
const playerPopup = document.getElementById('playerPopup');
const closePlayer = document.getElementById('closePlayer');
const videoPlayer = document.getElementById('videoPlayer');
const playerChannelName = document.getElementById('playerChannelName');

let channels = []; // all channels
let categories = new Set();

// ----- LOCALSTORAGE: LOAD/SAVE -----

function loadUserState() {
    const playlist = localStorage.getItem('playlistSelector');
    const search = localStorage.getItem('searchInput');
    const category = localStorage.getItem('categorySelector');
    if (playlist) playlistSelector.value = playlist;
    if (search) searchInput.value = search;
    // Do NOT restore category here (see part 2 fix below)
}

function saveUserState() {
    localStorage.setItem('playlistSelector', playlistSelector.value);
    localStorage.setItem('searchInput', searchInput.value);
    localStorage.setItem('categorySelector', categorySelector.value);
}

function saveLastChannel(channel) {
    if (!channel) {
        localStorage.removeItem('lastChannel');
    } else {
        localStorage.setItem('lastChannel', JSON.stringify(channel));
    }
}

function restoreLastChannel() {
    const last = localStorage.getItem('lastChannel');
    if (last) {
        try {
            const channel = JSON.parse(last);
            // Find by URL in current channels
            const matched = channels.find(c => c.url === channel.url);
            if (matched) openPlayer(matched);
        } catch (e) {}
    }
}

// ----- DATA HANDLING -----

function fetchAndParsePlaylist(url) {
    channelsGrid.innerHTML = "<div style='color: #999; font-size: 1.2em;'>Loading channels...</div>";
    fetch(url, { method: 'GET' })
        .then(res => res.text())
        .then(text => {
            channels = parseM3U(text);
            showChannels();
            fillCategories(); // fill AND restore category value here
            restoreLastChannel(); // restore last channel if any
        }).catch(err => {
            channelsGrid.innerHTML = "<div style='color: #f44; font-size: 1.15em;'>Failed to load playlist.</div>";
        });
}

function parseM3U(m3uText) {
    let lines = m3uText.split('\n');
    let parsed = [];
    categories = new Set();
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            let info = lines[i];
            let url = lines[i + 1] ? lines[i + 1].trim() : '';
            let nameMatch = info.match(/,(.*)$/);
            let name = nameMatch ? nameMatch[1].trim() : 'Channel';
            let logoMatch = info.match(/tvg-logo="([^"]+)"/);
            let logo = logoMatch ? logoMatch[1] : '';
            let groupMatch = info.match(/group-title="([^"]+)"/);
            let group = groupMatch ? groupMatch[1] : '';
            parsed.push({ name, logo, group, url });
            if (group) categories.add(group);
        }
    }
    return parsed;
}

function showChannels() {
    let searchTerm = searchInput.value.toLowerCase();
    let category = categorySelector.value;
    let filtered = channels.filter(chan => {
        let matchesSearch = chan.name.toLowerCase().includes(searchTerm);
        let matchesCat = category === "" || chan.group === category;
        return matchesSearch && matchesCat;
    });

    channelsGrid.innerHTML = '';
    filtered.forEach(chan => {
        const div = document.createElement('div');
        div.className = 'channel-card';
        div.innerHTML = `
            <img class="channel-img" src="${chan.logo || 'https://static.thenounproject.com/png/2811695-200.png'}" alt="${chan.name}">
            <div class="channel-group">${chan.group || 'Other'}</div>
            <div class="channel-name">${chan.name}</div>
        `;
        div.onclick = () => openPlayer(chan);
        channelsGrid.appendChild(div);
    });
    if (filtered.length === 0) {
        channelsGrid.innerHTML = "<div style='color: #666;'>No channels found.</div>";
    }
}
function fillCategories() {
    const options = Array.from(categories).sort().map(
        cat => `<option value="${cat}">${cat}</option>`
    ).join('');
    categorySelector.innerHTML = `<option value="">All Categories</option>${options}`;
    // Restore category after population
    const savedCat = localStorage.getItem('categorySelector');
    if (savedCat && Array.from(categorySelector.options).some(o => o.value === savedCat)) {
        categorySelector.value = savedCat;
    } else {
        categorySelector.value = "";
    }
    showChannels();  // Show channels filtered by restored category
}

// Player and UI actions
function openPlayer(channel) {
    videoPlayer.src = channel.url;
    playerChannelName.textContent = channel.name;
    playerPopup.style.display = 'flex';
    document.body.style.overflow = "hidden";
    saveLastChannel(channel);
}

closePlayer.onclick = function() {
    playerPopup.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = "";
    document.body.style.overflow = "auto";
    saveLastChannel(null);
};

playlistSelector.onchange = function() {
    fetchAndParsePlaylist(this.value);
    saveUserState();
};

searchInput.oninput = function() {
    showChannels();
    saveUserState();
};

categorySelector.oninput = function() {
    showChannels();
    saveUserState();
};

// Initial page load: restore state and load first playlist
loadUserState();
fetchAndParsePlaylist(playlistSelector.value);

// Optional: Close player on popup background click (for mobile UX)
playerPopup.onclick = function(e) {
    if (e.target === playerPopup) closePlayer.onclick();
};
