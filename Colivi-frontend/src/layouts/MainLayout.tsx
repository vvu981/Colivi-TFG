import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { AiAssistantWidget } from "../features/ai-assistant";

export const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1 w-full max-w-full">
      {children}
    </main>
    <Footer />
    <AiAssistantWidget />
  </div>
);