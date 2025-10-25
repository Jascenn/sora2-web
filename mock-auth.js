// 模拟认证 API 服务器
// 在开发环境模拟后端响应

const http = require('http');

// Helper function to parse cookies
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });

  return cookies;
};

const mockUsers = {
  'admin@sora2.com': {
    id: 'admin-001',
    email: 'admin@sora2.com',
    nickname: 'Administrator',
    role: 'admin',
    credits: 999999,
    avatarUrl: null
  },
  'user@sora2.com': {
    id: 'user-001',
    email: 'user@sora2.com',
    nickname: 'Test User',
    role: 'user',
    credits: 100,
    avatarUrl: null
  },
  'test@sora2.com': {
    id: 'test-001',
    email: 'test@sora2.com',
    nickname: 'Test User',
    role: 'user',
    credits: 50,
    avatarUrl: null
  }
};

// 存储token到用户的映射（模拟JWT token存储）
const tokenUserMap = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);

  // 处理不同的 API 路径
  if (url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = mockUsers[email];

        if (user) {
          console.log(`✓ Login successful: ${email}`);

          // Set HttpOnly cookie for authentication
          const token = 'mock-jwt-token-' + Date.now();

          // 存储token到用户的映射
          tokenUserMap.set(token, email);

          const cookieValue = `auth_token=${token}; HttpOnly; Path=/; SameSite=lax; Max-Age=86400`;
          res.setHeader('Set-Cookie', cookieValue);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: {
              user: user,
              token: token
            }
          }));
        } else {
          console.log(`✗ Login failed: ${email} (user not found)`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '用户不存在或密码错误'
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (url === '/api/users/profile' && req.method === 'GET') {
    // 从 Cookie 中获取用户信息
    const cookieHeader = req.headers.cookie || '';
    console.log(`[DEBUG] Received Cookie header: ${cookieHeader}`);
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;
    console.log(`[DEBUG] Parsed auth_token: ${token}`);

    if (token) {
      // 从token映射中查找用户邮箱
      const userEmail = tokenUserMap.get(token);
      console.log(`[DEBUG] Token resolved to email: ${userEmail}`);

      if (userEmail && mockUsers[userEmail]) {
        const user = mockUsers[userEmail];
        console.log(`[DEBUG] Resolved user: ${userEmail}`, user);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            user: user
          }
        }));
        return;
      }
    }

    // 未登录或无效 token
    console.log(`[DEBUG] No valid token found, returning 401`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '未登录'
    }));
  }
  else if (url === '/api/videos' && req.method === 'GET') {
    // 模拟视频列表
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        videos: [
          {
            id: 'video-001',
            title: '示例视频 1',
            description: '这是一个示例视频',
            status: 'completed',
            url: '/sample-video-1.mp4',
            thumbnail: '/sample-thumb-1.jpg',
            userId: 'user-001',
            createdAt: '2025-01-20T10:30:00Z'
          },
          {
            id: 'video-002',
            title: '示例视频 2',
            description: '这是另一个示例视频',
            status: 'processing',
            url: null,
            thumbnail: '/sample-thumb-2.jpg',
            userId: 'admin-001',
            createdAt: '2025-01-21T15:45:00Z'
          }
        ]
      }
    }));
  }
  else if (url === '/api/videos/create' && req.method === 'POST') {
    // 模拟创建视频
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newVideo = {
          id: 'video-' + Date.now(),
          title: data.title || '未命名视频',
          description: data.description || '',
          status: 'processing',
          url: null,
          thumbnail: null,
          userId: data.userId || 'user-001',
          createdAt: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: newVideo
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (url === '/api/auth/register' && req.method === 'POST') {
    // 模拟用户注册
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password, nickname } = JSON.parse(body);

        // 检查用户是否已存在
        if (mockUsers[email]) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '用户已存在'
          }));
          return;
        }

        // 创建新用户
        const newUser = {
          id: 'user-' + Date.now(),
          email,
          nickname: nickname || email.split('@')[0],
          role: 'user',
          credits: 100,
          avatarUrl: null
        };

        mockUsers[email] = newUser;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            user: newUser
          }
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (url === '/api/credits/balance' && req.method === 'GET') {
    // 模拟积分查询
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (token && tokenUserMap.has(token)) {
      const userEmail = tokenUserMap.get(token);
      const user = mockUsers[userEmail];

      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            balance: user.credits
          }
        }));
        return;
      }
    }

    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '未登录'
    }));
  }
  else if (url === '/api/generate' && req.method === 'POST') {
    // 模拟视频生成
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (token && tokenUserMap.has(token)) {
      const userEmail = tokenUserMap.get(token);
      const user = mockUsers[userEmail];

      if (user && user.credits >= 50) {
        // 扣除积分
        user.credits -= 50;

        const generatedVideo = {
          id: 'video-' + Date.now(),
          title: 'AI生成的视频',
          description: '这是由AI生成的视频',
          status: 'completed',
          url: '/generated-video.mp4',
          thumbnail: '/generated-thumb.jpg',
          userId: user.id,
          createdAt: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            video: generatedVideo,
            remainingCredits: user.credits
          }
        }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '积分不足',
          required: 50
        }));
      }
      return;
    }

    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '未登录'
    }));
  }
  else if (url === '/api/history' && req.method === 'GET') {
    // 模拟历史记录
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (token && tokenUserMap.has(token)) {
      const userEmail = tokenUserMap.get(token);
      const userId = mockUsers[userEmail]?.id;

      const mockHistory = [
        {
          id: '1',
          title: '未来城市',
          description: '展示2050年的智能城市',
          thumbnail: '/thumb-1.jpg',
          videoUrl: '/video-1.mp4',
          createdAt: '2025-01-20T10:30:00Z',
          duration: '30s',
          status: 'completed',
          creditsUsed: 50,
          userId: userId
        },
        {
          id: '2',
          title: '自然风光',
          description: '山川河流的壮丽景色',
          thumbnail: '/thumb-2.jpg',
          videoUrl: '/video-2.mp4',
          createdAt: '2025-01-19T15:45:00Z',
          duration: '45s',
          status: 'completed',
          creditsUsed: 75,
          userId: userId
        },
        {
          id: '3',
          title: '科技生活',
          description: 'AI改变日常生活的场景',
          thumbnail: '/thumb-3.jpg',
          videoUrl: null,
          createdAt: '2025-01-18T09:20:00Z',
          duration: '60s',
          status: 'processing',
          creditsUsed: 100,
          userId: userId
        }
      ];

      // 过滤用户自己的历史记录
      const userHistory = mockHistory.filter(v => v.userId === userId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          videos: userHistory
        }
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
    }
  }
  else if (url.startsWith('/api/credits/transactions') && req.method === 'GET') {
    // 模拟积分交易记录
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (token && tokenUserMap.has(token)) {
      const userEmail = tokenUserMap.get(token);
      const userId = mockUsers[userEmail]?.id;

      const mockTransactions = [
        {
          id: 'tx-001',
          description: '注册赠送',
          amount: 100,
          type: 'bonus',
          createdAt: '2025-01-20T10:00:00Z',
          userId: userId
        },
        {
          id: 'tx-002',
          description: '生成视频 - 未来城市',
          amount: -50,
          type: 'consumption',
          createdAt: '2025-01-20T10:30:00Z',
          userId: userId
        },
        {
          id: 'tx-003',
          description: '充值套餐',
          amount: 500,
          type: 'recharge',
          createdAt: '2025-01-19T15:00:00Z',
          userId: userId
        }
      ];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          transactions: mockTransactions
        }
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
    }
  }
  else if (url === '/api/admin/stats' && req.method === 'GET') {
    // 模拟管理员统计数据
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.auth_token;

    if (token && tokenUserMap.has(token)) {
      const userEmail = tokenUserMap.get(token);
      const user = mockUsers[userEmail];

      if (user && user.role === 'admin') {
        const mockStats = {
          totalUsers: 1250,
          totalVideos: 5680,
          totalCredits: 125000,
          todayRevenue: 8900,
          activeUsers: 320,
          processingVideos: 45
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: mockStats
        }));
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '权限不足'
        }));
      }
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
    }
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
});

const PORT = 3101;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 Mock API Server running on http://127.0.0.1:${PORT}`);
  console.log('\n📋 测试账号：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('管理员账号：');
  console.log('  邮箱: admin@sora2.com');
  console.log('  密码: admin123');
  console.log('');
  console.log('普通用户账号：');
  console.log('  邮箱: user@sora2.com');
  console.log('  密码: admin123');
  console.log('');
  console.log('测试账号：');
  console.log('  邮箱: test@sora2.com');
  console.log('  密码: 任意密码');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock server...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});