import { useState, useEffect } from "react";

export function CookieBanner({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("veris_cookie_consent");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("veris_cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("veris_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[100] rounded-2xl border border-white/10 bg-[#0c0d14]/95 backdrop-blur-xl shadow-2xl p-5"
    >
      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
        We use cookies and similar technologies from{" "}
        <span className="text-white font-medium">Dynamic Labs</span> (wallet auth) and{" "}
        <span className="text-white font-medium">Google Fonts</span> to run this app.
        No tracking cookies are used.{" "}
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
        >
          Privacy Policy
        </button>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-full bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#0c0d14]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 rounded-full border border-white/10 hover:border-white/20 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0c0d14]"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
