(function () {
    'use strict';

    const MAX_SECONDS = 15;
    const CHUNK_MS = 1000;
    const MAX_CHUNKS = Math.ceil(MAX_SECONDS * 1000 / CHUNK_MS);

    let recorder = null;
    let stream = null;
    let chunks = [];
    let isReady = false;

    function waitForCanvas() {
        return new Promise((resolve) => {
            const check = () => {
                const canvas = document.querySelector('canvas');
                if (canvas) return resolve(canvas);
                setTimeout(check, 500);
            };
            check();
        });
    }

    async function startReplayBuffer() {
        const canvas = await waitForCanvas();

        if (!canvas.captureStream) {
            console.error('captureStream nuk mbështetet nga ky browser.');
            return;
        }

        stream = canvas.captureStream(60);

        let options = {};
        if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            options.mimeType = 'video/webm;codecs=vp9';
        } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options.mimeType = 'video/webm;codecs=vp8';
        } else {
            options.mimeType = 'video/webm';
        }

        if (!window.MediaRecorder) {
            console.error('MediaRecorder nuk mbështetet nga ky browser.');
            return;
        }

        recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push({
                    blob: event.data,
                    time: Date.now()
                });

                while (chunks.length > MAX_CHUNKS) {
                    chunks.shift();
                }
            }
        };

        recorder.onerror = (e) => {
            console.error('Gabim te MediaRecorder:', e);
        };

        recorder.start(CHUNK_MS);
        isReady = true;
        console.log('Replay buffer u nis. Po ruan 15 sekondat e fundit.');
    }

    function saveLast15Seconds() {
        if (!isReady || !chunks.length) {
            console.log('Ende nuk ka video të ruajtur.');
            return;
        }

        const blob = new Blob(chunks.map(c => c.blob), {
            type: recorder.mimeType || 'video/webm'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `replay_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 5000);
        console.log('U ruajtën 15 sekondat e fundit.');
    }

    function createReplayButton() {
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
    }

    document.addEventListener('keydown', (e) => {
        if (e.key && e.key.toLowerCase() === 'r') {
            saveLast15Seconds();
        }
    });

    startReplayBuffer();
    window.addEventListener('load', () => {
        setTimeout(createReplayButton, 1500);
    });
})();
