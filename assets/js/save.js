(function () {
    'use strict';

    const MAX_SECONDS = 15;
    const CHUNK_MS = 1000;
    const MAX_CHUNKS = Math.ceil(MAX_SECONDS * 1000 / CHUNK_MS);

    let recorder = null;
    let chunks = [];
    let statusBox = null;
    let previewVideo = null;
    let selectedCanvas = null;

    function log(msg) {
        console.log('[REPLAY]', msg);
        if (statusBox) statusBox.textContent = msg;
    }

    function createUI() {
        if (!document.getElementById('saveReplayBtn')) {
            const btn = document.createElement('button');
            btn.id = 'saveReplayBtn';
            btn.textContent = 'Save Replay';
            Object.assign(btn.style, {
                position: 'fixed',
                right: '20px',
                bottom: '80px',
                zIndex: '999999',
                padding: '10px 14px',
                background: '#111',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '10px',
                fontSize: '14px'
            });
            btn.addEventListener('click', saveLast15Seconds);
            document.body.appendChild(btn);
        }

        if (!document.getElementById('saveReplayStatus')) {
            statusBox = document.createElement('div');
            statusBox.id = 'saveReplayStatus';
            statusBox.textContent = 'Replay loading...';
            Object.assign(statusBox.style, {
                position: 'fixed',
                right: '20px',
                bottom: '130px',
                zIndex: '999999',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                maxWidth: '280px'
            });
            document.body.appendChild(statusBox);
        } else {
            statusBox = document.getElementById('saveReplayStatus');
        }

        if (!document.getElementById('saveReplayPreview')) {
            previewVideo = document.createElement('video');
            previewVideo.id = 'saveReplayPreview';
            previewVideo.autoplay = true;
            previewVideo.muted = true;
            previewVideo.playsInline = true;
            Object.assign(previewVideo.style, {
                position: 'fixed',
                right: '20px',
                bottom: '180px',
                width: '220px',
                height: '124px',
                background: '#000',
                border: '1px solid #666',
                borderRadius: '8px',
                zIndex: '999999'
            });
            document.body.appendChild(previewVideo);
        } else {
            previewVideo = document.getElementById('saveReplayPreview');
        }
    }

    function getAllCanvases() {
        return [...document.querySelectorAll('canvas')];
    }

    function pickBestCanvas() {
        const canvases = getAllCanvases();
        if (!canvases.length) return null;

        canvases.forEach((c, i) => {
            console.log(`[REPLAY] canvas ${i}: ${c.width}x${c.height}`, c);
        });

        canvases.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        return canvases[0];
    }

    function waitForCanvas() {
        return new Promise((resolve) => {
            const check = () => {
                const canvas = pickBestCanvas();
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    resolve(canvas);
                    return;
                }
                setTimeout(check, 1000);
            };
            check();
        });
    }

    async function startReplayBuffer() {
        createUI();

        if (!window.MediaRecorder) {
            log('MediaRecorder nuk mbështetet');
            return;
        }

        selectedCanvas = await waitForCanvas();
        log(`Canvas zgjedhur: ${selectedCanvas.width}x${selectedCanvas.height}`);

        if (!selectedCanvas.captureStream) {
            log('captureStream nuk mbështetet');
            return;
        }

        const stream = selectedCanvas.captureStream(30);
        previewVideo.srcObject = stream;

        const track = stream.getVideoTracks()[0];
        if (!track) {
            log('Ska video track');
            return;
        }

        console.log('[REPLAY] track settings:', track.getSettings ? track.getSettings() : 'no settings');

        let options = {};
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 4000000 };
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options = { mimeType: 'video/webm', videoBitsPerSecond: 4000000 };
        } else {
            log('webm nuk mbështetet');
            return;
        }

        try {
            recorder = new MediaRecorder(stream, options);
        } catch (err) {
            log('MediaRecorder failed: ' + err.message);
            console.error(err);
            return;
        }

        recorder.ondataavailable = (event) => {
            const size = event.data ? event.data.size : 0;
            console.log('[REPLAY] chunk size:', size);

            if (size > 0) {
                chunks.push(event.data);
                while (chunks.length > MAX_CHUNKS) chunks.shift();
                log(`Recording OK: ${chunks.length}/${MAX_CHUNKS} | ${size} bytes`);
            } else {
                log('Chunk bosh');
            }
        };

        recorder.onerror = (e) => {
            console.error('[REPLAY] recorder error', e);
            log('Recorder error');
        };

        recorder.start(CHUNK_MS);
        log('Replay buffer u nis');
    }

    function saveLast15Seconds() {
        if (!chunks.length) {
            log('Nuk ka chunks');
            return;
        }

        const totalSize = chunks.reduce((sum, b) => sum + b.size, 0);
        log(`Saving ${totalSize} bytes`);

        if (totalSize <= 0) {
            log('Chunks janë bosh');
            return;
        }

        const blob = new Blob(chunks, {
            type: recorder?.mimeType || 'video/webm'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `replay_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        log('Replay u ruajt');
    }

    document.addEventListener('keydown', (e) => {
        if (e.key && e.key.toLowerCase() === 'r') {
            saveLast15Seconds();
        }
    });

    window.addEventListener('load', () => {
        setTimeout(startReplayBuffer, 2500);
    });
})();
