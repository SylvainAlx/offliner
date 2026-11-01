import { useEffect, useState } from "react";
import { useOnlineStatus } from "./stores/onlineStatusStore";
import HomePage from "./components/HomePage";
import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import Help from "./components/Help";
import Profile from "./components/Profile";
import Tracking from "./components/Tracking";
import Status from "./components/Status";
import Village from "./components/Village";
import DataBackup from "./components/DataBackup";
import Achievements from "./components/Achievements";
import Sidebar, { type AppSection } from "./components/layouts/Sidebar";

function AppContent() {
  const { isOnline } = useOnlineStatus();
  const [activeSection, setActiveSection] = useState<AppSection>("village");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => useOnlineStatus.getState().initialize(), []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const renderSection = () => {
    switch (activeSection) {
      case "village":
        return <Village />;
      case "help":
        return <Help />;
      case "account":
      default:
        return (
          <>
            <Profile />
            <Status />
            <Tracking />
            <DataBackup />
          </>
        );
      case "achievements":
        return <Achievements />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-[background-color] duration-400 ease-[ease] p-0 m-0 ${
        isOnline
          ? "bg-[linear-gradient(180deg,var(--accent-bg)_0%,#ffffff_40%)]"
          : "bg-[linear-gradient(180deg,var(--green-bg)_0%,#ffffff_40%)]"
      }`}
    >
      <Header isMenuOpen={isMenuOpen} onMenuOpen={() => setIsMenuOpen(true)} />
      <div className="flex items-start gap-5 w-[min(calc(100%-32px),1080px)] mx-auto flex-1 max-md:block max-md:w-full">
        <Sidebar
          activeSection={activeSection}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onSelect={setActiveSection}
        />
        <main className="flex-[1_1_720px] flex flex-col gap-5 min-w-0 max-w-180 pb-6 w-full max-md:max-w-140 max-md:px-4 max-md:mx-auto">
          {renderSection()}
        </main>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  const [showHomePage, setShowHomePage] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("offliner:welcome-dismissed");
  });

  if (showHomePage) {
    return (
      <HomePage
        onPlay={() => {
          sessionStorage.setItem("offliner:welcome-dismissed", "1");
          setShowHomePage(false);
        }}
      />
    );
  }

  return <AppContent />;
}

export default App;
