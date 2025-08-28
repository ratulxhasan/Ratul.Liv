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

function fetchAndParsePlaylist(url) {
    channelsGrid.innerHTML = "<div style='color: #999; font-size: 1.2em;'>Loading channels...</div>";
    fetch(url, { method: 'GET' })
        .then(res => res.text())
        .then(text => {
            channels = parseM3U(text);
            showChannels();
            fillCategories();
        }).catch(err => {
            channelsGrid.innerHTML = "<div style='color: #f44; font-size: 1.15em;'>Failed to load playlist.</div>";
        });
}

// Parse m3u
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
    const options = Array.from(categories).sort().map(cat => `<option value="${cat}">${cat}</option>`).join('');
    categorySelector.innerHTML = `<option value="">All Categories</option>${options}`;
}

function openPlayer(channel) {
    videoPlayer.src = channel.url;
    playerChannelName.textContent = channel.name;
    playerPopup.style.display = 'flex';
    document.body.style.overflow = "hidden"; // Disable scroll on popup
}

closePlayer.onclick = function() {
    playerPopup.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = "";
    document.body.style.overflow = "auto";
};

playlistSelector.onchange = function() {
    fetchAndParsePlaylist(this.value);
};

searchInput.oninput = showChannels;
categorySelector.oninput = showChannels;

// Load first playlist
fetchAndParsePlaylist(playlistSelector.value);

// Close popup on outside click (mobile UX)
playerPopup.onclick = function(e) {
    if (e.target === playerPopup) closePlayer.onclick();
};
