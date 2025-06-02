// ==UserScript==
// @name         自定义video进度条
// @namespace    http://tampermonkey.net/
// @version      2025-06-02
// @description  try to take over the world!
// @author       w2f
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...

    // 定义定时检测间隔，单位为毫秒，这里设置为每2秒检测一次
    const checkInterval = 1000;
    // 定时执行主函数
    setInterval(mainFunction, checkInterval);

    function mainFunction() {
        // 获取视频元素
        const video = document.querySelector('video');
        // 检查video是否消失，若消失则卸载playerContainer组件
        let playerContainer = document.getElementById('custom-video-controls');
        if (!video && playerContainer) {
            console.log('video 消失，卸载 playerContainer');
            playerContainer.remove();
            return;
        }
        // 检查video是否存在，若存在则加载playerContainer组件
        if (video && !playerContainer) {
            console.log('video 存在，加载 playerContainer');
            // 创建播放器容器
            playerContainer = document.createElement('div');
            playerContainer.id = 'custom-video-controls';
            playerContainer.style.position = 'fixed';
            playerContainer.style.bottom = '50px';
            playerContainer.style.left = '50%';
            playerContainer.style.transform = 'translateX(-50%)';
            playerContainer.style.width = '90%';
            playerContainer.style.background = '#222';
            playerContainer.style.borderRadius = '5px';
            playerContainer.style.display = 'flex';
            playerContainer.style.flexDirection = 'column';
            playerContainer.style.alignItems = 'center';
            playerContainer.style.padding = '10px';
            playerContainer.style.color = '#fff';
            playerContainer.style.zIndex = '9999';
            playerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';

            // 创建按钮组（播放、时间在左，其他图标在右）
            const controlsRow = document.createElement('div');
            controlsRow.style.display = 'flex';
            controlsRow.style.justifyContent = 'space-between';
            controlsRow.style.width = '100%';
            controlsRow.style.marginBottom = '8px';
            controlsRow.style.alignItems = 'center';

            // 左侧：播放/暂停 + 时间显示
            const leftControls = document.createElement('div');
            leftControls.style.display = 'flex';
            leftControls.style.alignItems = 'center';
            leftControls.style.gap = '10px';

            // 右侧：音量、倍速、全屏、新标签页打开、收藏、下载
            const rightControls = document.createElement('div');
            rightControls.style.display = 'flex';
            rightControls.style.alignItems = 'center';
            rightControls.style.gap = '15px';

            // 播放/暂停按钮
            const playPauseButton = document.createElement('button');
            playPauseButton.innerHTML = '⏸️';
            playPauseButton.style.border = 'none';
            playPauseButton.style.background = 'transparent';
            playPauseButton.style.color = '#fff';
            playPauseButton.style.cursor = 'pointer';

            playPauseButton.onclick = () => {
                if (video.paused) {
                    video.play();
                    playPauseButton.innerHTML = '⏸️';
                } else {
                    video.pause();
                    playPauseButton.innerHTML = '▶️';
                }
            }

            // 时间显示
            const timeDisplay = document.createElement('span');
            timeDisplay.textContent = '00:00 / 00:00';
            timeDisplay.style.fontSize = '12px';

            // 音量图标
            const volumeButton = document.createElement('button');
            volumeButton.innerHTML = '🔊';
            volumeButton.style.border = 'none';
            volumeButton.style.background = 'transparent';
            volumeButton.style.color = '#fff';
            volumeButton.style.cursor = 'pointer';

            volumeButton.onclick = () => {
                video.muted = !video.muted;
                volumeButton.innerHTML = video.muted ? '🔇' : '🔊';
            }

            // **优化倍速播放：点击后切换**
            const speedLevels = [1, 1.5, 2, 4]; // 预设倍速
            let currentSpeedIndex = 0; // 默认为1倍速

            const speedButton = document.createElement('button');
            speedButton.innerHTML = `⏩ ${speedLevels[currentSpeedIndex]}x`;
            speedButton.style.border = 'none';
            speedButton.style.background = 'transparent';
            speedButton.style.color = '#fff';
            speedButton.style.cursor = 'pointer';

            speedButton.onclick = () => {
                currentSpeedIndex = (currentSpeedIndex + 1) % speedLevels.length;
                video.playbackRate = speedLevels[currentSpeedIndex];
                speedButton.innerHTML = `⏩ ${speedLevels[currentSpeedIndex]}x`;
            }

            // 画中画按钮
            const pipButton = document.createElement('button');
            pipButton.innerHTML = '📺';
            pipButton.style.border = 'none';
            pipButton.style.background = 'transparent';
            pipButton.style.color = '#fff';
            pipButton.style.cursor = 'pointer';

            pipButton.onclick = async () => {
                if (video !== document.pictureInPictureElement) {
                    try {
                        await video.requestPictureInPicture();
                    } catch (error) {
                        console.error('画中画模式请求失败:', error);
                    }
                } else {
                    try {
                        await document.exitPictureInPicture();
                    } catch (error) {
                        console.error('退出画中画模式失败:', error);
                    }
                }
            };

            // 全屏按钮
            const fullScreenButton = document.createElement('button');
            fullScreenButton.innerHTML = '⛶';
            fullScreenButton.style.border = 'none';
            fullScreenButton.style.background = 'transparent';
            fullScreenButton.style.color = '#fff';
            fullScreenButton.style.cursor = 'pointer';

            fullScreenButton.onclick = () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    video.requestFullscreen();
                }
            }


            // 新标签页打开按钮
            const newTabButton = document.createElement('button');
            newTabButton.innerHTML = '🌐';
            newTabButton.style.border = 'none';
            newTabButton.style.background = 'transparent';
            newTabButton.style.color = '#fff';
            newTabButton.style.cursor = 'pointer';
            newTabButton.onclick = () => window.open(video.dataset.videosrc || video.videosrc || video.src, '_blank');

            // 喜欢按钮
            const likeButton = document.createElement('button');
            likeButton.innerHTML = '🤍';
            likeButton.style.border = 'none';
            likeButton.style.background = 'transparent';
            likeButton.style.color = '#fff';
            likeButton.style.cursor = 'pointer';
            // 初始化喜欢状态
            let isLiked = false;
            // 点击事件逻辑
            likeButton.onclick = () => {
                isLiked = !isLiked;
                if (isLiked) {
                    likeButton.innerHTML = '💖';
                    const videoInfo = {
                        // 生成唯一ID，使用当前时间戳
                        "id": Date.now().toString(),
                        // 默认获取网页标题
                        "title": getVideoTitle(video),
                        "videosrc": video.dataset.videosrc || video.src,
                        "author": "示例作者", // 需替换为实际视频作者
                        "referer": window.location.href,
                        // 调用函数获取封面图
                        "imgsrc": getVideoThumbnail(video),
                    };
                    localStorage.setItem('likedVideos', JSON.stringify([...JSON.parse(localStorage.getItem('likedVideos') || '[]'), videoInfo]));
                } else {
                    likeButton.innerHTML = '💔';
                    const likedVideos = JSON.parse(localStorage.getItem('likedVideos') || '[]');
                    const newLikedVideos = likedVideos.filter(v => v.videosrc !== (video.dataset.videosrc || video.src));
                    localStorage.setItem('likedVideos', JSON.stringify(newLikedVideos));
                }
            }
            // 监听 video 的 src 变化
            const observer = new MutationObserver((mutationsList) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                        // 监听 src 变化时，根据 localStorage 中 videosrc 的值修改喜欢状态
                        if (likeButton) {
                            const likedVideos = JSON.parse(localStorage.getItem('likedVideos')) || [];
                            const videoSrc = video.dataset.videosrc || video.src;
                            const isLiked = likedVideos.some(v => v.videosrc === videoSrc);
                            likeButton.innerHTML = isLiked ? '💖' : '💔';
                        }
                    }
                }
            });
            if (video) {
                observer.observe(video, { attributes: true, attributeFilter: ['src'] });
            }

            // 定义获取视频标题的函数
            function getVideoTitle(video) {
                if (video.title) {
                    return video.title;
                }
                let currentElement = video.parentElement;
                while (currentElement) {
                    if (currentElement.textContent.trim()) {
                        let title = currentElement.textContent.trim();
                        if (title.length > 30) {
                            return title.substring(0, 30) + '...';
                        }
                        return title;
                    }
                    currentElement = currentElement.parentElement;
                }
                return document.title;
            }

            // 定义获取视频封面图的函数
            function getVideoThumbnail(video) {
                // 优先获取视频的预览图
                if (video.poster) {
                    return video.poster;
                }

                let currentElement = video.parentElement;
                while (currentElement) {
                    const img = currentElement.querySelector('img');
                    if (img) {
                        return img.src;
                    }
                    currentElement = currentElement.parentElement;
                }

                return '';
            }

            // 下载逻辑
            const downloadButton = document.createElement('button');
            downloadButton.innerHTML = '⬇️';
            downloadButton.style.border = 'none';
            downloadButton.style.background = 'transparent';
            downloadButton.style.color = '#fff';
            downloadButton.style.cursor = 'pointer';
            downloadButton.onclick = () => window.open(video.videosrc || video.src, '_blank');

            // 设置按钮
            const settingsButton = document.createElement('button');
            settingsButton.innerHTML = '⚙️';
            settingsButton.style.border = 'none';
            settingsButton.style.background = 'transparent';
            settingsButton.style.color = '#fff';
            settingsButton.style.cursor = 'pointer';
            // 可添加点击事件逻辑
            settingsButton.onclick = () => {
                console.log('点击了设置按钮');
            }

            // 创建进度条容器
            const progressContainer = document.createElement('div');
            progressContainer.style.width = '100%';
            progressContainer.style.height = '10px';
            progressContainer.style.background = '#444';
            progressContainer.style.borderRadius = '3px';
            progressContainer.style.cursor = 'pointer';

            // 创建进度条
            const progressBar = document.createElement('div');
            progressBar.style.width = '0%';
            progressBar.style.height = '100%';
            progressBar.style.background = '#4CAF50';
            progressBar.style.borderRadius = '3px';
            progressContainer.appendChild(progressBar);

            // 监听视频播放进度
            video.addEventListener('timeupdate', () => {
                const percentage = (video.currentTime / video.duration) * 100;
                progressBar.style.width = percentage + '%';
                timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
            });
            // 格式化时间函数
            function formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return minutes.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
            }

            // 点击进度条跳转
            progressContainer.addEventListener('click', (event) => {
                const offsetX = event.offsetX;
                const newTime = (offsetX / progressContainer.offsetWidth) * video.duration;
                video.currentTime = newTime;
            });

            // 组装控制面板
            leftControls.appendChild(playPauseButton);
            leftControls.appendChild(timeDisplay);

            rightControls.appendChild(volumeButton);
            rightControls.appendChild(speedButton);
            rightControls.appendChild(fullScreenButton);
            rightControls.appendChild(pipButton);
            //rightControls.appendChild(likeButton);
            //rightControls.appendChild(newTabButton);
            //rightControls.appendChild(downloadButton);
            rightControls.appendChild(settingsButton);

            controlsRow.appendChild(leftControls);
            controlsRow.appendChild(rightControls);

            playerContainer.appendChild(controlsRow);
            playerContainer.appendChild(progressContainer); // **进度条独立放在底部**

            // 添加到页面
            document.body.appendChild(playerContainer);
        }
    }
})();