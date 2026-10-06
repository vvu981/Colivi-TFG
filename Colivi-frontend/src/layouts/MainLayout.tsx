import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { BottomNav } from "../components/layout/BottomNav";
import { AiAssistantWidget } from "../features/ai-assistant";

interface MainLayoutProps {
  children: React.ReactNode;
  noBottomPadding?: boolean;
  hideFooter?: boolean;
}

export const MainLayout = ({ children, noBottomPadding = false, hideFooter = false }: MainLayoutProps) => (
  <div className="flex flex-col min-h-screen bg-surface">
    <Header />
    <main className={`flex-1 w-full max-w-full ${noBottomPadding ? '' : 'pb-16 md:pb-0'}`}>
      {children}
    </main>
    {!hideFooter && <Footer />}
    <BottomNav />
    <AiAssistantWidget />
  </div>
);