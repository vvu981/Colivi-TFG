const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirs = [
  'assets',
  'components/ui',
  'components/layout',
  'components/feedback',
  'config',
  'features/auth/api',
  'features/auth/components',
  'features/auth/hooks',
  'features/auth/types',
  'features/housing/api',
  'features/housing/components',
  'features/housing/hooks',
  'features/housing/types',
  'features/expenses/api',
  'features/expenses/components',
  'features/expenses/hooks',
  'features/expenses/types',
  'features/reports/api',
  'features/reports/components',
  'features/reports/hooks',
  'features/reports/types',
  'hooks',
  'layouts',
  'lib',
  'pages',
  'routes',
  'services',
  'styles',
  'types',
  'utils'
];

dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

const files = {
  'components/ui/Button.tsx': 'import React from "react";\n\nexport const Button = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (\n  <button className={className} {...props}>{children}</button>\n);',
  'components/ui/Input.tsx': 'import React from "react";\n\nexport const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (\n  <input className={className} {...props} />\n);',
  'components/ui/Card.tsx': 'import React from "react";\n\nexport const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (\n  <div className={className}>{children}</div>\n);',
  'components/layout/Header.tsx': 'import React from "react";\n\nexport const Header = () => <header>Header</header>;',
  'components/layout/Sidebar.tsx': 'import React from "react";\n\nexport const Sidebar = () => <aside>Sidebar</aside>;',
  'components/layout/Footer.tsx': 'import React from "react";\n\nexport const Footer = () => <footer>Footer</footer>;',
  'components/feedback/Spinner.tsx': 'import React from "react";\n\nexport const Spinner = () => <div>Loading...</div>;',
  'components/feedback/ErrorBoundary.tsx': 'import React from "react";\n\nexport class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {\n  state = { hasError: false };\n  static getDerivedStateFromError() { return { hasError: true }; }\n  render() { return this.state.hasError ? <div>Error</div> : this.props.children; }\n}',
  'config/env.ts': 'export const ENV = {\n  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"\n};',
  'config/constants.ts': 'export const CONSTANTS = {\n  APP_NAME: "Colivi"\n};',
  'features/auth/index.ts': '// Export Auth Feature',
  'features/housing/index.ts': '// Export Housing Feature',
  'features/expenses/index.ts': '// Export Expenses Feature',
  'features/reports/index.ts': '// Export Reports Feature',
  'layouts/MainLayout.tsx': 'import React from "react";\n\nexport const MainLayout = ({ children }: { children: React.ReactNode }) => (\n  <div className="flex h-screen">\n    <main className="flex-1">{children}</main>\n  </div>\n);',
  'layouts/AuthLayout.tsx': 'import React from "react";\n\nexport const AuthLayout = ({ children }: { children: React.ReactNode }) => (\n  <div className="flex min-h-screen items-center justify-center bg-slate-50">\n    {children}\n  </div>\n);',
  'lib/utils.ts': 'import { ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}',
  'lib/axios.ts': 'import axios from "axios";\nimport { ENV } from "../config/env";\n\nexport const apiClient = axios.create({\n  baseURL: ENV.API_URL,\n});\n\napiClient.interceptors.request.use((config) => {\n  const token = localStorage.getItem("token");\n  if (token && config.headers) {\n    config.headers.Authorization = `Bearer ${token}`;\n  }\n  return config;\n});',
  'pages/HomePage.tsx': 'import React from "react";\n\nexport const HomePage = () => <div>Home Page</div>;',
  'pages/LoginPage.tsx': 'import React from "react";\n\nexport const LoginPage = () => <div>Login Page</div>;',
  'pages/DashboardPage.tsx': 'import React from "react";\n\nexport const DashboardPage = () => <div>Dashboard Page</div>;',
  'routes/AppRoutes.tsx': 'import React from "react";\n\nexport const AppRoutes = () => <div>App Routes</div>;',
  'routes/ProtectedRoute.tsx': 'import React from "react";\n\nexport const ProtectedRoute = ({ children }: { children: React.ReactNode }) => <>{children}</>;',
  'types/index.ts': 'export type BaseEntity = {\n  id: string;\n  createdAt: string;\n};',
  'utils/index.ts': 'export const formatDate = (date: Date) => date.toISOString();\nexport const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;'
};

Object.entries(files).forEach(([file, content]) => {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
});

// Move index.css to styles/index.css if it exists in src/
const rootIndexCss = path.join(srcDir, 'index.css');
const stylesIndexCss = path.join(srcDir, 'styles', 'index.css');
if (fs.existsSync(rootIndexCss)) {
  fs.renameSync(rootIndexCss, stylesIndexCss);
}

// Update main.tsx import if needed
const mainTsxPath = path.join(srcDir, 'main.tsx');
if (fs.existsSync(mainTsxPath)) {
  let mainContent = fs.readFileSync(mainTsxPath, 'utf8');
  mainContent = mainContent.replace(/"\.\/index\.css"/g, '"./styles/index.css"');
  mainContent = mainContent.replace(/'\.\/index\.css'/g, "'./styles/index.css'");
  fs.writeFileSync(mainTsxPath, mainContent);
}

console.log("Scaffolding complete.");
