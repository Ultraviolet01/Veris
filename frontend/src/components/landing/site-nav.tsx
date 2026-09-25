import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { DynamicWidget, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { SiteLogo } from "./site-logo";
import { UsdcBalanceBadge } from "../UsdcBalanceBadge";

export type AppView = "overview" | "marketplace" | "playground" | "reputation" | "connect" | "docs";

interface SiteNavProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onOpenSellerStudio?: () => void;
}

type CentreTabId = "home" | "data-feeds" | "how-it-works" | "docs";

export function SiteNav({ activeView, setActiveView, onOpenSellerStudio }: SiteNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CentreTabId>("home");
  const isLoggedIn = useIsLoggedIn();

  const centreTabs: { id: CentreTabId; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "data-feeds", label: "Data Feeds" },
    { id: "how-it-works", label: "How it works" },
    { id: "docs", label: "Docs" },
  ];

  // Sync active tab with activeView and scroll position
  useEffect(() => {
    if (activeView === "marketplace") {
      setActiveTab("data-feeds");
      return;
    }

    if (activeView === "docs") {
      setActiveTab("docs");
      return;
    }

    if (activeView !== "overview") {
      return;
    }

    const handleScroll = () => {
      const howItWorksEl = document.getElementById("how-it-works");
      if (howItWorksEl) {
        const rect = howItWorksEl.getBoundingClientRect();
        // If the top of How it works section has reached near viewport top or is visible
        if (rect.top <= 200 && rect.bottom >= 200) {
          setActiveTab("how-it-works");
        } else if (window.scrollY < 400) {
          setActiveTab("home");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeView]);

  const handleTabClick = (tabId: CentreTabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);

    if (tabId === "home") {
      if (activeView !== "overview") {
        setActiveView("overview");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "data-feeds") {
      setActiveView("marketplace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "how-it-works") {
      if (activeView !== "overview") {
        setActiveView("overview");
        setTimeout(() => {
          document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (tabId === "docs") {
      setActiveView("docs");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isTabActive = (tabId: CentreTabId) => {
    if (tabId === "data-feeds") return activeView === "marketplace";
    if (tabId === "docs") return activeView === "docs";
    if (activeView !== "overview") return false;
    return activeTab === tabId;
  };

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 md:px-6">
      <nav className="flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#06070b]/85 p-2 pl-4 md:pl-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Logo */}
        <div onClick={() => handleTabClick("home")} className="cursor-pointer">
          <SiteLogo />
        </div>

        {/* Desktop View Switcher: Home, How it works, Docs */}
        <div className="hidden lg:flex items-center gap-2.5 bg-white/[0.03] p-1.5 rounded-full border border-white/5 shadow-inner">
          {centreTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`px-5 sm:px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                isTabActive(id)
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Controls: Seller Studio & Dynamic Auth (only when logged in) */}
        <div className="flex items-center gap-2">
          {onOpenSellerStudio && (
            <button
              onClick={onOpenSellerStudio}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>Seller Studio</span>
            </button>
          )}

          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <UsdcBalanceBadge />
              <DynamicWidget />
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-20 left-4 right-4 bg-[#090b12] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            {centreTabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`w-full text-left px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isTabActive(id)
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-neutral-300 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
            {onOpenSellerStudio && (
              <button
                onClick={() => {
                  onOpenSellerStudio();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium text-purple-300 hover:bg-white/5"
              >
                Seller Studio Console
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
