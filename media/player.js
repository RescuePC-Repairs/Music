document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    const mediaPlayer = document.getElementById('mediaPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const volumeControl = document.getElementById('volumeControl');
    const playlist = document.getElementById('playlist');
    const offlineStatus = document.getElementById('offlineStatus');
    const modeToggle = document.getElementById('modeToggle');

    // State management
    let currentTrack = 0;
    let playlistItems = [];
    let isAudioMode = false;

    // Initialize media player
    mediaPlayer.volume = 1.0;

    // Offline status handling
    const updateOfflineStatus = () => {
        const isOffline = !navigator.onLine;
        if (offlineStatus) {
            offlineStatus.textContent = isOffline ? 'Offline Mode' : 'Online Mode';
            offlineStatus.style.background = isOffline ? '#dc3545' : '#28a745';
        }
    };

    // Initial offline status
    updateOfflineStatus();
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);

    // Audio/Video mode toggle
    modeToggle.addEventListener('click', () => {
        isAudioMode = !isAudioMode;
        mediaPlayer.muted = isAudioMode;
        modeToggle.querySelector('svg').setAttribute('d', isAudioMode ? 'M12 14l-2-2m0 0l-2-2m2 2l2 2M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z' : 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z');
    });

    // Media event handlers
    mediaPlayer.addEventListener('error', (e) => {
        console.error('Media error:', e.target.error);
    });

    mediaPlayer.addEventListener('loadeddata', () => {
        mediaPlayer.play();
    });

    mediaPlayer.addEventListener('ended', () => {
        loadNextTrack();
    });

    mediaPlayer.addEventListener('volumechange', () => {
        volumeControl.value = mediaPlayer.volume * 100;
    });

    mediaPlayer.addEventListener('progress', () => {
        const buffered = mediaPlayer.buffered;
        if (buffered.length > 0) {
            const end = buffered.end(buffered.length - 1);
            const percent = (end / mediaPlayer.duration) * 100;
            progress.style.background = `linear-gradient(to right, #007bff ${percent}%, transparent ${percent}%)`;
        }
    });

    mediaPlayer.addEventListener('durationchange', () => {
        progress.max = mediaPlayer.duration;
    });

    mediaPlayer.addEventListener('timeupdate', () => {
        const percent = (mediaPlayer.currentTime / mediaPlayer.duration) * 100;
        progress.value = percent;
        currentTime.textContent = formatTime(mediaPlayer.currentTime);
        duration.textContent = formatTime(mediaPlayer.duration);
    });

    mediaPlayer.addEventListener('play', () => {
        playPauseBtn.querySelector('svg').setAttribute('d', 'M5 3l14 9-14 9V3z');
    });

    mediaPlayer.addEventListener('pause', () => {
        playPauseBtn.querySelector('svg').setAttribute('d', 'M19 6.42 12 13 5 6.42V5l7 6.58L19 5v1.42z');
    });

    mediaPlayer.addEventListener('waiting', () => {
        playPauseBtn.disabled = true;
    });

    mediaPlayer.addEventListener('canplay', () => {
        playPauseBtn.disabled = false;
    });

    // UI event handlers
    volumeControl.addEventListener('input', () => {
        const volume = volumeControl.value / 100;
        mediaPlayer.volume = volume;
    });

    playPauseBtn.addEventListener('click', () => {
        mediaPlayer[mediaPlayer.paused ? 'play' : 'pause']();
    });

    progress.addEventListener('input', () => {
        const percent = progress.value / 100;
        mediaPlayer.currentTime = percent * mediaPlayer.duration;
    });

    fullscreenBtn.addEventListener('click', () => {
        if (mediaPlayer.requestFullscreen) {
            mediaPlayer.requestFullscreen();
        }
    });

    // Playlist management
    navigator.serviceWorker.controller.postMessage({ action: 'getMusicFiles' });
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'musicFiles') {
            playlistItems = event.data.files;
            playlist.innerHTML = playlistItems.map((file, index) => `
                <div class="playlist-item" data-index="${index}" data-file="${file}">
                    <span>${file}</span>
                </div>
            `).join('');
            
            // Add click handlers to playlist items
            const playlistItems = document.querySelectorAll('.playlist-item');
            playlistItems.forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index'));
                    loadTrack(index);
                    
                    // Ensure the video is visible and playing
                    mediaPlayer.play().catch(error => {
                        console.error('Error playing media:', error);
                        if (error.name === 'NotAllowedError') {
                            // If autoplay is blocked, show message
                            const message = document.createElement('div');
                            message.className = 'autoplay-message';
                            message.textContent = 'Click anywhere to start playback';
                            document.body.appendChild(message);
                            
                            // Remove message when clicked
                            document.body.addEventListener('click', () => {
                                message.remove();
                                mediaPlayer.play();
                            }, { once: true });
                        }
                    });
                });
            });
            
            if (playlistItems.length > 0) {
                loadTrack(0);
            }
        }
    });

    // Auto-play next song when current song ends
    mediaPlayer.addEventListener('ended', () => {
        loadNextTrack();
    });

    // Function to load and play a track
    function loadTrack(index) {
        if (index >= 0 && index < playlistItems.length) {
            currentTrack = index;
            const track = playlistItems[currentTrack];
            
            // Load in video player
            mediaPlayer.src = `/music/${track}`;
            
            // Update UI
            updatePlaylistHighlight();
            
            // Auto-play the song
            mediaPlayer.play().catch(error => {
                console.error('Error playing media:', error);
                if (error.name === 'NotAllowedError') {
                    // If autoplay is blocked, show message
                    const message = document.createElement('div');
                    message.className = 'autoplay-message';
                    message.textContent = 'Click anywhere to start playback';
                    document.body.appendChild(message);
                    
                    // Remove message when clicked
                    document.body.addEventListener('click', () => {
                        message.remove();
                    }, { once: true });
                }
            });
        }
    }
        if (index >= 0 && index < playlistItems.length) {
            currentTrack = index;
            const track = playlistItems[currentTrack];
            
            // Load in video player
            mediaPlayer.src = `/music/${track}`;
            
            // Update UI
            updatePlaylistHighlight();
            mediaPlayer.play();
        }
    }

    function updatePlaylistHighlight() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === currentTrack) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function loadNextTrack() {
        const nextIndex = (currentTrack + 1) % playlistItems.length;
        loadTrack(nextIndex);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
});


            
            // Update time display
            currentTime.textContent = formatTime(mediaPlayer.currentTime);
            duration.textContent = formatTime(mediaPlayer.duration);
        }
    }


