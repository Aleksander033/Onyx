(function () {
    'use strict';

    const MAX_SECONDS = 15;
    const CHUNK_MS = 1000;
    const MAX_CHUNKS = Math.ceil(MAX_SECONDS * 1000 / CHUNK_MS);

    let recorder = null;
    let chunks = [];
    let isReady = false;
    let statusBox = null;

    function log(msg) {
        console.log('[REPLAY]', msg);
        if (statusBox) statusBox.textContent = msg;
    }

    function createUI() {
        if (document.getElementById('saveReplayBtn')) return;

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
            maxWidth: '220px'
        });

        document.body.appendChild(statusBox);
    }

    function getBestCanvas() {
        const canvases = [...document.querySelectorAll('canvas')];
        if (!canvases.length) return null;

        canvases.sort((a, b) => {
            const areaA = (a.width || 0) * (a.height || 0);
            const areaB = (b.width || 0) * (b.height || 0);
            return areaB - areaA;
        });

        return canvases[0];
    }

    function waitForCanvas() {
        return new Promise((resolve) => {
            const check = () => {
                const canvas = getBestCanvas();
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    return resolve(canvas);
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

        const canvas = await waitForCanvas();
        log(`Canvas gjetur: ${canvas.width}x${canvas.height}`);

        if (!canvas.captureStream) {
            log('captureStream nuk mbështetet');
            return;
        }

        const stream = canvas.captureStream(30);

        let options = {};
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            options.mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options.mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options.mimeType = 'video/webm';
        }

        try {
            recorder = new MediaRecorder(stream, options);
        } catch (err) {
            log('MediaRecorder error: ' + err.message);
            return;
        }

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
                while (chunks.length > MAX_CHUNKS) {
                    chunks.shift();
                }
                isReady = true;
                log(`Recording... chunks: ${chunks.length}/${MAX_CHUNKS}`);
            }
        };

        recorder.onerror = (e) => {
            log('Recorder error');
            console.error(e);
        };

        try {
            recorder.start(CHUNK_MS);
            log('Replay buffer u nis');
        } catch (err) {
            log('Start failed: ' + err.message);
        }
    }

    function saveLast15Seconds() {
        if (!isReady || !chunks.length) {
            log('Ska replay akoma');
            return;
        }

        const blob = new Blob(chunks, {
            type: (recorder && recorder.mimeType) || 'video/webm'
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
        setTimeout(startReplayBuffer, 2000);
    });
})();
