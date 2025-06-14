const CACHE_NAME = 'music-player-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/offline.html',
    '/media/player.js',
    '/media/player.css',
    '/media/player.html'
].concat(
    // Add all music files
    ['/music'].map(prefix => {
        return [
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
        ].map(file => `${prefix}/${file}`);
    })
).flat();

// Cache all assets during install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache all files at once
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) throw Error(`Failed to fetch ${url}`);
                                const responseClone = response.clone();
                                return cache.put(url, responseClone);
                            })
                            .catch(error => {
                                console.error(`Error caching ${url}:`, error);
                                return Promise.resolve(); // Don't fail the installation
                            });
                    })
                )
                .then(() => {
                    console.log('All assets cached successfully');
                    return self.skipWaiting();
                })
                .catch(error => {
                    console.error('Cache failed:', error);
                    return Promise.resolve();
                });
            })
    );
});

// Handle fetch events
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Handle media files with range requests
            if (event.request.headers.get('range')) {
                const url = new URL(event.request.url);
                if (urlsToCache.includes(url.pathname)) {
                    return handleRangeRequest(event);
                }
            }

            // Try network first, then cache
            return fetch(event.request)
                .then(response => {
                    if (!response.ok) {
                        return caches.match(event.request);
                    }
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                });
        })
    );
});

// Handle range requests for media files
function handleRangeRequest(event) {
    return caches.match(event.request)
        .then(cachedResponse => {
            if (cachedResponse) {
                const range = event.request.headers.get('range');
                const contentRange = range.replace(/bytes=/, '');
                const parts = contentRange.split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : undefined;
                const total = cachedResponse.headers.get('content-length');
                const chunksize = end - start + 1;
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4'
                };

                return cachedResponse.blob()
                    .then(blob => {
                        const sliced = blob.slice(start, end + 1);
                        return new Response(sliced, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: head
                        });
                    });
            }
            return fetch(event.request);
        });
}

// Cache all assets during install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache all files at once
                // Cache static assets
                return cache.addAll(urlsToCache)
                    .then(() => {
                        // Cache media files
                        return Promise.all(mediaFiles.map(file => {
                            return fetch(file)
                                .then(response => {
                                    if (!response.ok) throw Error(`Failed to fetch ${file}`);
                                    const responseClone = response.clone();
                                    return cache.put(file, responseClone);
                                });
                        }));
                    })
                    .then(() => self.skipWaiting())
                    .catch(error => {
                        console.error('Cache failed:', error);
                        return Promise.resolve();
                    });
            })
    );
});

// Handle fetch events
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;

                // Handle media files with range requests
                if (event.request.headers.get('range')) {
                    return handleRangeRequest(event);
                }

                return fetch(event.request)
                    .then(response => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                        return response;
                    })
                    .catch(() => {
                        return caches.match('/offline.html');
                    });
            })
    );
});

// Handle range requests for media files
function handleRangeRequest(event) {
    return caches.match(event.request)
        .then(cachedResponse => {
            if (cachedResponse) {
                const range = event.request.headers.get('range');
                const contentRange = range.replace(/bytes=/, '');
                const parts = contentRange.split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : undefined;
                const total = cachedResponse.headers.get('content-length');
                const chunksize = end - start + 1;
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4'
                };

                return cachedResponse.blob()
                    .then(blob => {
                        const sliced = blob.slice(start, end + 1);
                        return new Response(sliced, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: head
                        });
                    });
            }
            return fetch(event.request);
        });
}

                // Cache MP4 files
                const musicFiles = [
                    'Country Music 2024 - Morgan Wallen, Luke Combs, Brett Young, Kane Brown, Luke Bryan, Chris Stapleton.mp4',
                    'Luke Bryan - That\'s My Kind Of Night (Official Music Video).mp4'
                ];

                return Promise.all(musicFiles.map(file => {
                    const url = `/music/${file}`;
                    
                    // Create a new request with the correct path
                    const request = new Request(url, {
                        headers: {
                            'Cache-Control': 'no-store'
                        }
                    });

                    return fetch(request)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to fetch ${file}`);
                            }
                            return cache.put(url, response);
                        })
                        .catch(error => {
                            console.error(`Failed to cache ${file}:`, error);
                        });
                }));
            })
    );
});

// Handle file listing
self.addEventListener('message', event => {
    if (event.data.action === 'getMusicFiles') {
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.keys()
                    .then(keys => {
                        const musicFiles = keys
                            .filter(key => key.url.startsWith('/music/') && key.url.endsWith('.mp4'))
                            .map(key => key.url.replace('/music/', ''));
                        return musicFiles;
                    });
            })
            .then(files => {
                event.source.postMessage({
                    type: 'musicFiles',
                    files: files
                });
            })
            .catch(error => {
                console.error('Failed to get music files:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to retrieve music files'
                });
            });
    }
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            const fetchRequest = event.request.clone();
            
            // Handle media files differently
            if (event.request.headers.get('range')) {
                const url = event.request.url;
                const fileName = url.split('/').pop();
                const request = new Request(`/music/${fileName}`, {
                    headers: {
                        'Range': event.request.headers.get('range')
                    }
                });

                return fetch(request)
                    .then(response => {
                        if (!response.ok) {
                            return caches.match(event.request);
                        }
                        
                        const contentRange = response.headers.get('content-range');
                        const totalLength = contentRange ? parseInt(contentRange.split('/')[1]) : null;
                        
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(error => {
                        return caches.match(event.request);
                    });
            }
            
            return fetch(fetchRequest)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(error => console.error('Cache update failed:', error));

                    return response;
                })
                .catch(error => {
                    console.error('Fetch failed:', error);
                    return caches.match(event.request);
                });
        })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const title = 'Offline Music Player';
    const options = {
        body: 'You can use the app offline!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle media file updates
self.addEventListener('message', event => {
    if (event.data.action === 'updateMediaCache') {
        const mediaFiles = event.data.files;
        
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    mediaFiles.map(file => {
                        const fileName = file.split('\\').pop();
                        const url = `/music/${fileName}`;
                        return fetch(url)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(url, response);
                                }
                                throw new Error('Failed to fetch media file');
                            });
                    })
                );
            })
            .catch(error => {
                console.error('Failed to update media cache:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to update media cache'
                });
            });
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('offline-cache-') && 
                           cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName)
                        .catch(error => console.error('Failed to delete cache:', error));
                })
            );
        })
    );
    
    // Claim control of all clients
    return self.clients.claim();
});

// Handle file listing
self.addEventListener('message', event => {
    if (event.data.action === 'getMusicFiles') {
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.keys()
                    .then(keys => {
                        const musicFiles = keys
                            .filter(key => key.url.startsWith('/music/') && key.url.endsWith('.mp4'))
                            .map(key => key.url.replace('/music/', ''));
                        return musicFiles;
                    });
            })
            .then(files => {
                event.source.postMessage({
                    type: 'musicFiles',
                    files: files
                });
            })
            .catch(error => {
                console.error('Failed to get music files:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to retrieve music files'
                });
            });
    }
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            const fetchRequest = event.request.clone();
            
            // Handle media files differently
            if (event.request.headers.get('range')) {
                const url = event.request.url;
                const fileName = url.split('/').pop();
                const request = new Request(`/music/${fileName}`, {
                    headers: {
                        'Range': event.request.headers.get('range')
                    }
                });

                return fetch(request)
                    .then(response => {
                        if (!response.ok) {
                            return caches.match(event.request);
                        }
                        
                        const contentRange = response.headers.get('content-range');
                        const totalLength = contentRange ? parseInt(contentRange.split('/')[1]) : null;
                        
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(error => {
                        return caches.match(event.request);
                    });
            }
            
            return fetch(fetchRequest)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(error => console.error('Cache update failed:', error));

                    return response;
                })
                .catch(error => {
                    console.error('Fetch failed:', error);
                    return caches.match(event.request);
                });
        })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const title = 'Offline Music Player';
    const options = {
        body: 'You can use the app offline!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle media file updates
self.addEventListener('message', event => {
    if (event.data.action === 'updateMediaCache') {
        const mediaFiles = event.data.files;
        
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    mediaFiles.map(file => {
                        const fileName = file.split('\\').pop();
                        const url = `/music/${fileName}`;
                        return fetch(url)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(url, response);
                                }
                                throw new Error('Failed to fetch media file');
                            });
                    })
                );
            })
            .catch(error => {
                console.error('Failed to update media cache:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to update media cache'
                });
            });
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('offline-cache-') && 
                           cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName)
                        .catch(error => console.error('Failed to delete cache:', error));
                })
            );
        })
    );
    
    // Claim control of all clients
    return self.clients.claim();
});

// Handle file listing
self.addEventListener('message', event => {
    if (event.data.action === 'getMusicFiles') {
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.keys()
                    .then(keys => {
                        const musicFiles = keys
                            .filter(key => key.url.startsWith('/music/') && key.url.endsWith('.mp4'))
                            .map(key => key.url.replace('/music/', ''));
                        return musicFiles;
                    });
            })
            .then(files => {
                event.source.postMessage({
                    type: 'musicFiles',
                    files: files
                });
            })
            .catch(error => {
                console.error('Failed to get music files:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to retrieve music files'
                });
            });
    }
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            const fetchRequest = event.request.clone();
            
            // Handle media files differently
            if (event.request.headers.get('range')) {
                return fetch(fetchRequest)
                    .then(response => {
                        if (!response.ok) {
                            return caches.match(event.request);
                        }
                        
                        const contentRange = response.headers.get('content-range');
                        const totalLength = contentRange ? parseInt(contentRange.split('/')[1]) : null;
                        
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(error => {
                        return caches.match(event.request);
                    });
            }
            
            return fetch(fetchRequest)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(error => console.error('Cache update failed:', error));

                    return response;
                })
                .catch(error => {
                    console.error('Fetch failed:', error);
                    return caches.match(event.request);
                });
        })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const title = 'Offline Music Player';
    const options = {
        body: 'You can use the app offline!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle media file updates
self.addEventListener('message', event => {
    if (event.data.action === 'updateMediaCache') {
        const mediaFiles = event.data.files;
        
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    mediaFiles.map(file => {
                        return fetch(`/music/${file}`)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(`/music/${file}`, response);
                                }
                                throw new Error('Failed to fetch media file');
                            });
                    })
                );
            })
            .catch(error => {
                console.error('Failed to update media cache:', error);
                event.source.postMessage({
                    type: 'error',
                    message: 'Failed to update media cache'
                });
            });
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('offline-cache-') && 
                           cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName)
                        .catch(error => console.error('Failed to delete cache:', error));
                })
            );
        })
    );
    
    // Claim control of all clients
    return self.clients.claim();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('offline-cache-') && 
                           cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName)
                        .catch(error => console.error('Failed to delete cache:', error));
                })
            );
        })
    );
    
    // Claim control of all clients
    return self.clients.claim();
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            const fetchRequest = event.request.clone();
            
            // Handle media files differently
            if (event.request.headers.get('range')) {
                return fetch(fetchRequest)
                    .then(response => {
                        if (!response.ok) {
                            return caches.match(event.request);
                        }
                        
                        const contentRange = response.headers.get('content-range');
                        const totalLength = contentRange ? parseInt(contentRange.split('/')[1]) : null;
                        
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(error => {
                        return caches.match(event.request);
                    });
            }
            
            return fetch(fetchRequest)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(error => console.error('Cache update failed:', error));

                    return response;
                })
                .catch(error => {
                    console.error('Fetch failed:', error);
                    return caches.match(event.request);
                });
        })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const title = 'Offline Music Player';
    const options = {
        body: 'You can use the app offline!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle media file updates
self.addEventListener('message', event => {
    if (event.data.action === 'updateMediaCache') {
        const mediaFiles = event.data.files;
        
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    mediaFiles.map(file => {
                        return fetch(`/music/${file}`)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(`/music/${file}`, response);
                                }
                                throw new Error('Failed to fetch media file');
                            });
                    })
                );
            })
            .catch(error => {
                console.error('Failed to update media cache:', error);
            });
    }
});

// Handle file listing
self.addEventListener('message', event => {
    if (event.data.action === 'getMusicFiles') {
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.keys()
                    .then(keys => {
                        const musicFiles = keys
                            .filter(key => key.url.startsWith('/music/') && key.url.endsWith('.mp4'))
                            .map(key => key.url.replace('/music/', ''));
                        return musicFiles;
                    });
            })
            .then(files => {
                event.source.postMessage({
                    type: 'musicFiles',
                    files: files
                });
            })
            .catch(error => {
                console.error('Failed to get music files:', error);
            });
    }
});
