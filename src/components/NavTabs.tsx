'use client';

interface NavTabsProps {
  activeTab: 'test' | 'calibration' | 'history';
  onTabChange: (tab: 'test' | 'calibration' | 'history') => void;
}

export default function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const tabs = [
    { key: 'test' as const, label: '试验控制' },
    { key: 'calibration' as const, label: '设备校准' },
    { key: 'history' as const, label: '记录查询' },
  ];

  return (
    <nav className="bg-[#111122] border-b border-[#2a2a4a] px-6">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
