(function (root) {
  'use strict';

  const BUILD_ID = '20261004-beta-line-entry-08';
  const RECOVERY_PREFIX = 'healthCompanionBuildRecovery:';

  function recoveryUrl(href, liveBuildId) {
    const url = new URL(href);
    url.searchParams.set('v', liveBuildId);
    return url.toString();
  }

  function shouldRecover(expectedBuildId, liveBuildId, recoveredBuildId) {
    return Boolean(liveBuildId && liveBuildId !== expectedBuildId && recoveredBuildId !== liveBuildId);
  }

  function showUpdateRequired({ liveBuildId, location }) {
    const document = root.document;
    if (!document) return;
    const render = () => {
      if (!document.body) return;
      let notice = document.getElementById('health-build-update-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'health-build-update-notice';
        notice.setAttribute('role', 'status');
        notice.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;padding:12px;background:#172637;color:#fff;display:flex;gap:12px;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 12px #0006';
        const label = document.createElement('span');
        label.textContent = '有新版本可用，更新後可取得最新修正。';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '更新頁面';
        button.style.cssText = 'padding:8px 12px;border:0;border-radius:8px;background:#10b981;color:#071b16;font-weight:700;white-space:nowrap';
        notice.append(label, button);
        document.body.appendChild(notice);
      }
      notice.querySelector('button').onclick = () => {
        const url = new URL(recoveryUrl(location.href, liveBuildId));
        url.searchParams.set('buildRefresh', String(Date.now()));
        location.replace(url.toString());
      };
    };
    if (document.body) render();
    else document.addEventListener('DOMContentLoaded', render, { once: true });
  }

  async function checkLiveBuild(options = {}) {
    const fetchImpl = options.fetchImpl || root.fetch?.bind(root);
    const location = options.location || root.location;
    const expectedBuildId = options.expectedBuildId || BUILD_ID;
    // Script and HTML can come from different cache generations. Read the HTML
    // marker rather than using this script's version as proof of page freshness.
    const loadedBuildId = options.loadedBuildId || root.document?.querySelector('meta[name="health-companion-build"]')?.getAttribute('content')
      || (root.document ? 'UNVERSIONED_HTML' : expectedBuildId);
    let storage = null;
    try { storage = options.storage || root.sessionStorage; } catch { /* Storage may be blocked in an embedded browser. */ }
    const entryVersionToken = new URL(location.href).searchParams.get('v') || null;
    const diagnostics = root.HEALTH_BUILD_DIAGNOSTICS = {
      expectedBuildId,
      liveDeployedBuildId: null,
      liffLoadedBuildId: loadedBuildId,
      entryVersionToken,
      recovery: 'NOT_REQUIRED'
    };
    root.EXPECTED_BUILD_ID = expectedBuildId;
    root.LIFF_LOADED_BUILD_ID = loadedBuildId;
    if (!fetchImpl) return diagnostics;
    try {
      const response = await fetchImpl(`build.json?expected=${encodeURIComponent(expectedBuildId)}&t=${Date.now()}`, {cache: 'no-store'});
      if (!response.ok) throw Error(`BUILD_MANIFEST_HTTP_${response.status}`);
      const manifest = await response.json();
      const liveBuildId = typeof manifest?.buildId === 'string' && /^[A-Za-z0-9._-]{1,120}$/.test(manifest.buildId) ? manifest.buildId : '';
      if (!liveBuildId) throw Error('INVALID_BUILD_MANIFEST');
      diagnostics.liveDeployedBuildId = liveBuildId || null;
      root.LIVE_DEPLOYED_BUILD_ID = diagnostics.liveDeployedBuildId;
      const key = RECOVERY_PREFIX + liveBuildId;
      let recoveredBuildId = '', storageAvailable = false;
      try { recoveredBuildId = storage?.getItem(key) || ''; storageAvailable = Boolean(storage); } catch { /* Fall back to an explicit action. */ }
      const mismatch = loadedBuildId !== liveBuildId || expectedBuildId !== liveBuildId;
      if (mismatch) {
        let canReload = storageAvailable && options.autoReload !== false && recoveredBuildId !== liveBuildId;
        if (canReload) {
          try { storage.setItem(key, liveBuildId); canReload = storage.getItem(key) === liveBuildId; }
          catch { canReload = false; }
        }
        if (canReload) {
          diagnostics.recovery = 'ONE_TIME_RELOAD';
          location.replace(recoveryUrl(location.href, liveBuildId));
        } else {
          diagnostics.recovery = 'UPDATE_REQUIRED';
          (options.onUpdateRequired || showUpdateRequired)({ liveBuildId, location });
        }
      }
      return diagnostics;
    } catch (error) {
      diagnostics.recovery = 'CHECK_UNAVAILABLE';
      diagnostics.error = error?.message || String(error);
      return diagnostics;
    }
  }

  const api = {BUILD_ID, recoveryUrl, shouldRecover, checkLiveBuild};
  root.HealthBuildVersion = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document && root.location) {
    void checkLiveBuild();
    // A long-lived LIFF tab must learn about a release without discarding edits.
    let lastResumeCheck = 0;
    const resume = () => {
      if (root.document.visibilityState === 'hidden' || Date.now() - lastResumeCheck < 60_000) return;
      lastResumeCheck = Date.now();
      void checkLiveBuild({ autoReload: false });
    };
    root.document.addEventListener('visibilitychange', resume);
    root.addEventListener?.('pageshow', event => { if (event.persisted) resume(); });
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
