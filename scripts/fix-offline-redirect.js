/**
 * 修复离线重定向问题
 *
 * 这个脚本会检查并修复导致自动跳转到 /offline 页面的问题
 */

// 检查网络状态
function checkNetworkStatus() {
  console.log('=== 网络状态检查 ===');
  console.log('navigator.onLine:', navigator.onLine);

  // 检查连接类型
  if (navigator.connection) {
    console.log('Connection Info:', {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    });
  }

  return navigator.onLine;
}

// 清除 Service Worker
async function clearServiceWorkers() {
  console.log('=== 清除 Service Workers ===');

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('找到', registrations.length, '个 Service Workers');

      for (const registration of registrations) {
        console.log('注销:', registration.scope);
        await registration.unregister();
      }

      console.log('✅ Service Workers 已清除');
      return true;
    } catch (error) {
      console.error('❌ 清除 Service Workers 失败:', error);
      return false;
    }
  } else {
    console.log('当前浏览器不支持 Service Workers');
    return true;
  }
}

// 清除缓存
async function clearCaches() {
  console.log('=== 清除缓存 ===');

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log('找到', cacheNames.length, '个缓存');

      for (const cacheName of cacheNames) {
        console.log('删除缓存:', cacheName);
        await caches.delete(cacheName);
      }

      console.log('✅ 缓存已清除');
      return true;
    } catch (error) {
      console.error('❌ 清除缓存失败:', error);
      return false;
    }
  } else {
    console.log('当前浏览器不支持 Cache API');
    return true;
  }
}

// 清除存储
function clearStorage() {
  console.log('=== 清除存储 ===');

  // 清除 localStorage 中的离线相关数据
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('offline') || key.includes('sw-') || key.includes('cache-'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    console.log('删除 localStorage:', key);
    localStorage.removeItem(key);
  });

  // 清除 sessionStorage
  sessionStorage.clear();
  console.log('✅ 存储已清理');
}

// 重定向到首页
function redirectToHome() {
  console.log('=== 重定向到首页 ===');

  // 添加时间戳防止缓存
  const timestamp = Date.now();
  const url = window.location.origin + '?t=' + timestamp;

  console.log('正在跳转到:', url);
  window.location.href = url;
}

// 自动修复函数
async function autoFix() {
  console.log('开始自动修复离线重定向问题...\n');

  // 1. 检查网络状态
  const isOnline = checkNetworkStatus();

  if (!isOnline) {
    console.error('\n❌ 您当前确实处于离线状态');
    console.log('请检查网络连接后重试');
    return;
  }

  // 2. 清除 Service Workers
  const swCleared = await clearServiceWorkers();

  // 3. 清除缓存
  const cacheCleared = await clearCaches();

  // 4. 清除存储
  clearStorage();

  // 5. 如果都成功了，重定向
  if (swCleared && cacheCleared) {
    console.log('\n✅ 修复完成！');
    console.log('将在 2 秒后重定向到首页...');

    setTimeout(() => {
      redirectToHome();
    }, 2000);
  } else {
    console.log('\n⚠️ 修复过程中遇到问题，但会尝试重定向...');
    setTimeout(() => {
      redirectToHome();
    }, 2000);
  }
}

// 如果在离线页面，自动执行修复
if (window.location.pathname === '/offline' || window.location.pathname.endsWith('/offline')) {
  console.warn('检测到您在离线页面');
  autoFix();
}

// 导出函数供手动调用
window.fixOfflineRedirect = {
  autoFix,
  checkNetworkStatus,
  clearServiceWorkers,
  clearCaches,
  clearStorage,
  redirectToHome
};

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl + Shift + F: 强制修复
  if (e.ctrlKey && e.shiftKey && e.key === 'F') {
    e.preventDefault();
    console.log('触发强制修复...');
    autoFix();
  }
});

console.log('\n离线修复脚本已加载');
console.log('提示：按 Ctrl+Shift+F 手动触发修复');