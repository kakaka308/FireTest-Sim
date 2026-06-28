/** @type {import('next').NextConfig} */
const nextConfig = {
  // 将 exceljs/jspdf 标记为服务端外部包（避免打包 Node.js 原生模块）
  serverExternalPackages: ['exceljs', 'jspdf', 'jspdf-autotable'],
  experimental: {
    serverComponentsExternalPackages: ['exceljs', 'jspdf', 'jspdf-autotable'],
  },
};

module.exports = nextConfig;
