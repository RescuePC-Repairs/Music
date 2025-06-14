const CACHE_NAME = 'music-player-v2';
const GITHUB_URL = 'https://rescuepc-repairs.github.io/Music/';

// Cache static assets
const staticAssets = [
    GITHUB_URL + 'index.html',
    GITHUB_URL + 'style.css',
    GITHUB_URL + 'manifest.json',
    GITHUB_URL + 'icon-192x192.png',
    GITHUB_URL + 'icon-512x512.png'
];

// Update music files to use GitHub URL
const cachedMusicFiles = [
    'Alan Jackson, Jimmy Buffett - It\'s Five O\' Clock Somewhere (Official HD Video).mp4',
    'Billy Currington - People Are Crazy (Official Music Video).mp4',
    'Billy Currington - Pretty Good At Drinkin\' Beer (Official Music Video).mp4',
    'Chris Stapleton - Starting Over (Official Music Video).mp4',
    'Chris Stapleton - Tennessee Whiskey (Official Audio).mp4',
    'Darius Rucker - Wagon Wheel (Official Music Video).mp4',
    'Dierks Bentley - 5-1-5-0 (Official Music Video).mp4',
    'Dierks Bentley - Drunk On A Plane (Official Music Video).mp4',
    'Dierks Bentley - Somewhere On A Beach (Official Music Video).mp4',
    'Florida Georgia Line - May We All ft. Tim McGraw.mp4',
    'Kenny Chesney - Don\'t Blink (Official Video).mp4',
    'Kenny Chesney - No Shoes, No Shirt, No Problems (Official Video).mp4',
    'Kenny Chesney, Uncle Kracker - When The Sun Goes Down (Official Video).mp4',
    'Luke Bryan - Drunk On You (Official Music Video).mp4',
    'Luke Bryan - Huntin\', Fishin\', And Lovin\' Every Day (Official Music Video).mp4',
    'Luke Bryan - I Don\'t Want This Night To End (Official Music Video).mp4',
    'Luke Bryan - That\'s My Kind Of Night (Official Music Video).mp4',
    'Luke Combs - Beautiful Crazy (Official Video).mp4',
    'Luke Combs - Hurricane (Official Video).mp4',
    'Luke Combs - She Got the Best of Me (Official Video).mp4',
    'Luke Combs - When It Rains It Pours (Official Video).mp4',
    'Rehab - Bartender Song (Sittin\' At A Bar).mp4',
    'Toby Keith - As Good As I Once Was.mp4',
    'Zac Brown Band - Chicken Fried (Official Music Video) ｜ The Foundation.mp4',
    'Zac Brown Band - Knee Deep Feat. Jimmy Buffett (Official Music Video) ｜ You Get What You Give.mp4',
    'Zac Brown Band - Toes (Official Video).mp4'
].map(file => GITHUB_URL + 'music/' + file);

// Install event - cache static assets and music files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache static assets first
                return cache.addAll(staticAssets)
                    .then(() => {
                        // Then cache music files
                        return Promise.all(
                            cachedMusicFiles.map(file => {
                                return fetch(file)
                                    .then(response => {
                                        if (response.ok) {
                                            return cache.put(file, response);
                                        }
                                        throw new Error(`Failed to cache ${file}`);
                                    })
                                    .catch(error => {
                                        console.error(`Error caching ${file}:`, error);
                                        // Continue with other files even if one fails
                                        return null;
                                    });
                            })
                        );
                    })
            })
            .catch(error => {
                console.error('Installation failed:', error);
                return Promise.resolve(); // Return a resolved promise
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('music-player-') && cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    if (response.ok) {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                }).catch(() => {
                    if (event.request.headers.get('range')) {
                        // Handle range requests for video streaming
                        return new Response(null, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: {
                                'Content-Range': 'bytes */*'
                            }
                        });
                    }
                    return new Response(null, { status: 404 });
                });
            })
        );
    }
});
    '/music/Alan Jackson, Jimmy Buffett - It\'s Five O\' Clock Somewhere (Official HD Video).mp4',
    '/music/Billy Currington - People Are Crazy (Official Music Video).mp4',
    '/music/Billy Currington - Pretty Good At Drinkin\' Beer (Official Music Video).mp4',
    '/music/Chris Stapleton - Starting Over (Official Music Video).mp4',
    '/music/Chris Stapleton - Tennessee Whiskey (Official Audio).mp4',
    '/music/Darius Rucker - Wagon Wheel (Official Music Video).mp4',
    '/music/Dierks Bentley - 5-1-5-0 (Official Music Video).mp4',
    '/music/Dierks Bentley - Drunk On A Plane (Official Music Video).mp4',
    '/music/Dierks Bentley - Somewhere On A Beach (Official Music Video).mp4',
    '/music/Florida Georgia Line - May We All ft. Tim McGraw.mp4',
    '/music/Kenny Chesney - Don\'t Blink (Official Video).mp4',
    '/music/Kenny Chesney - No Shoes, No Shirt, No Problems (Official Video).mp4',
    '/music/Kenny Chesney, Uncle Kracker - When The Sun Goes Down (Official Video).mp4',
    '/music/Luke Bryan - Drunk On You (Official Music Video).mp4',
    '/music/Luke Bryan - Huntin\', Fishin\', And Lovin\' Every Day (Official Music Video).mp4',
    '/music/Luke Bryan - I Don\'t Want This Night To End (Official Music Video).mp4',
    '/music/Luke Bryan - That\'s My Kind Of Night (Official Music Video).mp4',
    '/music/Luke Combs - Beautiful Crazy (Official Video).mp4',
    '/music/Luke Combs - Hurricane (Official Video).mp4',
    '/music/Luke Combs - She Got the Best of Me (Official Video).mp4',
    '/music/Luke Combs - When It Rains It Pours (Official Video).mp4',
    '/music/Rehab - Bartender Song (Sittin\' At A Bar).mp4',
    '/music/Toby Keith - As Good As I Once Was.mp4',
    '/music/Zac Brown Band - Chicken Fried (Official Music Video) ｜ The Foundation.mp4',
    '/music/Zac Brown Band - Knee Deep Feat. Jimmy Buffett (Official Music Video) ｜ You Get What You Give.mp4',
    '/music/Zac Brown Band - Toes (Official Video).mp4'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache static assets first
                return cache.addAll(staticAssets)
                    .then(() => {
                        // Then cache music files
                        return Promise.all(
                            musicFiles.map(file => {
                                return fetch(file)
                                    .then(response => {
                                        if (response.ok) {
                                            return cache.put(file, response);
                                        }
                                        throw new Error(`Failed to cache ${file}`);
                                    })
                                    .catch(error => {
                                        console.error(`Error caching ${file}:`, error);
                                        // Continue with other files even if one fails
                                        return null;
                                    });
                            })
                        );
                    })
            })
            .catch(error => {
                console.error('Installation failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('music-player-') && cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    if (response.ok) {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                }).catch(() => {
                    if (event.request.headers.get('range')) {
                        // Handle range requests for video streaming
                        return new Response(null, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: {
                                'Content-Range': 'bytes */*'
                            }
                        });
                    }
                    return new Response(null, { status: 404 });
                });
            })
        );
    }
});
