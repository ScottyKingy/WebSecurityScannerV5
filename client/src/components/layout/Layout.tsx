import { ReactNode } from "react";
import Navbar from "./Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useDevBar } from "@/hooks/useDevBar";
import DevBar from "./DevBar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { isVisible } = useDevBar();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      {isVisible && <DevBar />}
    </div>
  );
}