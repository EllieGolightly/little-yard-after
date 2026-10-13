let status = '联网打开一次，准备好离线小院。';
let installPrompt = null;
export function getPwaStatus() { return status; }
function setStatus(message) {
  status = message;
  document.querySelectorAll('[data-pwa-status]').forEach(node => { node.textContent = status; });
}
export async function installApp() {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return '小院已经从主屏幕打开了。';
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === 'accepted' ? '小院正在搬到主屏幕。' : '以后也可以再安装。';
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    ? '用 Safari 打开，点击分享 → 添加到主屏幕，再点击“添加”。'
    : '打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。';
}
export function initPwa() {
  if (!['http:', 'https:'].includes(location.protocol)) {
    setStatus('这是单文件离线版；手机安装请使用在线小院网址。');
    return;
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; });
  if (!('serviceWorker' in navigator)) {
    setStatus('当前浏览器暂不支持离线安装，仍可在线游玩。');
    return;
  }
  // Development previews never cache source files. The build emits the worker.
  if (['localhost', '127.0.0.1'].includes(location.hostname) && !location.pathname.includes('/little-yard-after/')) {
    setStatus('本地开发预览；发布版支持离线安装。');
    return;
  }
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'});
      const waiting = () => setStatus('新版本已准备好。关闭所有小院窗口后重新打开即可更新，存档会保留。');
      const ready = () => setStatus('离线小院已准备好，添加到主屏幕后也可以断网游玩。');
      if (registration.waiting) waiting();
      else if (registration.active) ready();
      else setStatus('正在准备离线小院，请保持联网片刻……');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') navigator.serviceWorker.controller ? waiting() : ready();
          if (worker.state === 'redundant') setStatus('本次离线准备没有完成，下次联网打开时会重试。');
        });
      });
      navigator.serviceWorker.ready.then(() => { if (!registration.waiting) ready(); });
    } catch {
      setStatus('暂未完成离线准备；可以继续在线玩，下次联网打开时会重试。');
    }
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, {once:true});
}
