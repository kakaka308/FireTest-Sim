'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Flame } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useSimulationStore((s) => s.setUser);
  const [role, setRole] = useState<'admin' | 'experimenter'>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const username = role === 'admin' ? 'admin' : 'experimenter';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setUser({
        userid: data.userid,
        username: data.username,
        usertype: data.usertype,
      });
      router.push('/dashboard');
    } catch {
      setError('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            ISO 11820 试验仿真系统
          </h1>
          <p className="text-sm text-gray-400">建筑材料不燃性试验</p>
        </div>

        <div className="panel max-w-sm mx-auto space-y-6">
          {/* 角色选择 */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">选择角色</label>
            <div className="flex gap-3">
              <button
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                  role === 'admin'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                管理员
              </button>
              <button
                onClick={() => setRole('experimenter')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                  role === 'experimenter'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                试验员
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {role === 'admin' ? '账号: admin / 密码: 123456' : '账号: experimenter / 密码: 123456'}
            </p>
          </div>

          {/* 密码 */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">访问密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="请输入密码"
              className="input-field text-lg py-3"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-base"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          ISO 11820:2022 · Building Material Non-Combustibility Test Simulator
        </p>
      </div>
    </div>
  );
}
