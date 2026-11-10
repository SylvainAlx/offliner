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
import InstallGuide from "./components/install/InstallGuide";
import InstallBanner from "./components/install/InstallBanner";
import UnobservedGapPrompt from "./components/UnobservedGapPrompt";
import { useInstall } from "./stores/installStore";

function AppContent() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
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
      <InstallBanner />
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
      <UnobservedGapPrompt />
    </div>
  );
}

const WELCOME_DISMISSED_KEY = "offliner:welcome-dismissed";
const INSTALL_GUIDE_SEEN_KEY = "offliner:install-guide-seen";

type Stage = "welcome" | "install" | "app";

function App() {
  const isStandalone = useInstall((state) => state.isStandalone);
  const [stage, setStage] = useState<Stage>(() => {
    if (!sessionStorage.getItem(WELCOME_DISMISSED_KEY)) return "welcome";
    if (!sessionStorage.getItem(INSTALL_GUIDE_SEEN_KEY)) return "install";
    return "app";
  });

  // In a browser tab, every new session goes through the install guide;
  // once installed, the app opens directly after the welcome page.
  if (stage === "welcome") {
    return (
      <HomePage
        onPlay={() => {
          sessionStorage.setItem(WELCOME_DISMISSED_KEY, "1");
          setStage("install");
        }}
      />
    );
  }

  if (stage === "install" && !isStandalone) {
    return (
      <InstallGuide
        onContinue={() => {
          sessionStorage.setItem(INSTALL_GUIDE_SEEN_KEY, "1");
          setStage("app");
        }}
      />
    );
  }

  return <AppContent />;
}

export default App;
