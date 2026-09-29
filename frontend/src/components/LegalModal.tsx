import { X } from "lucide-react";

type LegalView = "privacy" | "terms";

interface LegalModalProps {
  view: LegalView;
  onClose: () => void;
}

export function LegalModal({ view, onClose }: LegalModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#08090e] p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1">Veris Protocol</p>
            <h2 id="legal-modal-title" className="text-xl font-semibold text-white">
              {view === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Last updated: September 2026</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X size={16} />
          </button>
        </div>

        {view === "privacy" ? <PrivacyContent /> : <TermsContent />}

        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-[11px] text-neutral-600">
            Questions?{" "}
            <a
              href="mailto:hello@veris.xyz"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
            >
              hello@veris.xyz
            </a>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <div className="text-xs text-neutral-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function PrivacyContent() {
  return (
    <div>
      <Section title="Overview">
        <p>
          Veris Protocol ("we", "us") operates the Veris data marketplace at{" "}
          <span className="text-white font-mono text-[11px]">veris.xyz</span>. This policy
          explains what data we collect, how we use it, and your rights.
        </p>
        <p>
          Veris is built on a non-custodial, on-chain architecture. <strong className="text-neutral-300">We do not
          store your personal data on our servers.</strong> All transaction data is public on
          the Monad blockchain.
        </p>
      </Section>

      <Section title="Data We Collect">
        <p><strong className="text-neutral-300">Wallet address</strong> — provided by you when you connect a wallet via Dynamic Labs. Used solely to interact with on-chain contracts.</p>
        <p><strong className="text-neutral-300">On-chain activity</strong> — all escrow jobs, payments, and reputation scores are publicly recorded on Monad. This data is immutable and not under our control.</p>
        <p><strong className="text-neutral-300">Session data</strong> — Dynamic Labs may store authentication tokens in your browser's local storage to maintain your session.</p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          <strong className="text-neutral-300">Dynamic Labs</strong> — provides embedded wallet
          creation and authentication. Dynamic Labs processes wallet data under their own{" "}
          <a href="https://dynamic.xyz/privacy" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Privacy Policy</a>.
        </p>
        <p>
          <strong className="text-neutral-300">Google Fonts</strong> — fonts (Geist, Manrope) are
          loaded from Google's CDN. Google may log your IP address per their{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Privacy Policy</a>.
        </p>
        <p>
          <strong className="text-neutral-300">Anthropic (Claude)</strong> — the AI chat assistant
          sends your natural-language queries to Anthropic's API. Do not include sensitive
          personal information in chat messages.
        </p>
      </Section>

      <Section title="Cookies & Local Storage">
        <p>
          We use browser <strong className="text-neutral-300">local storage</strong> (not cookies) to:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Remember your cookie consent preference</li>
          <li>Maintain your wallet session (via Dynamic Labs)</li>
        </ul>
        <p>We do not use advertising or tracking cookies.</p>
      </Section>

      <Section title="Your Rights (GDPR / UK GDPR)">
        <p>If you are located in the EU or UK, you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Access the personal data we hold about you</li>
          <li>Request deletion of your off-chain data (note: on-chain data is immutable)</li>
          <li>Withdraw consent at any time</li>
          <li>Lodge a complaint with your local supervisory authority</li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a href="mailto:privacy@veris.xyz" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            privacy@veris.xyz
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>On-chain data is permanent by the nature of the Monad blockchain. Session tokens stored in local storage are cleared when you disconnect your wallet or clear your browser storage.</p>
      </Section>

      <Section title="Changes">
        <p>We may update this policy. Significant changes will be announced on our GitHub repository. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="Contact">
        <p>
          Veris Protocol · Monad Metropolis Hackathon Project ·{" "}
          <a href="mailto:hello@veris.xyz" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">hello@veris.xyz</a>
        </p>
      </Section>
    </div>
  );
}

function TermsContent() {
  return (
    <div>
      <Section title="Acceptance">
        <p>
          By accessing or using Veris Protocol ("the Protocol"), you agree to these Terms. If you
          do not agree, do not use the Protocol. These Terms apply to the testnet deployment on
          Monad (Chain ID 10143).
        </p>
      </Section>

      <Section title="Nature of the Protocol">
        <p>
          Veris is a decentralised, autonomous data marketplace. Smart contracts operate
          deterministically on the Monad blockchain. <strong className="text-neutral-300">We provide
          no custodial services.</strong> You retain control of your wallet at all times.
        </p>
        <p>
          <strong className="text-neutral-300">Testnet disclaimer:</strong> This deployment is on
          Monad Testnet using test USDC. Testnet tokens have no monetary value. Do not send real
          assets to testnet addresses.
        </p>
      </Section>

      <Section title="Refund Policy">
        <p>
          Veris provides an <strong className="text-neutral-300">automatic, code-enforced refund</strong> mechanism:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>If a data seller meets the promised freshness SLA → seller receives 98% of the escrow, 2% goes to the protocol treasury.</li>
          <li>If the SLA is not met (data is stale or delivery fails) → <strong className="text-neutral-300">100% of escrowed funds are automatically returned</strong> to your wallet by the smart contract. No human action required.</li>
        </ul>
        <p>
          These outcomes are enforced by <span className="font-mono text-[11px] text-neutral-300">SlaEvaluator.sol</span> and
          cannot be overridden by Veris Protocol or any third party.
        </p>
      </Section>

      <Section title="Spending Limits">
        <p>
          The Protocol enforces a <strong className="text-neutral-300">hard spending cap of $50 USDC</strong> per
          transaction, checked client-side before any wallet signature is requested. Do not attempt
          to circumvent this limit by interacting with contracts directly.
        </p>
      </Section>

      <Section title="No Warranties">
        <p>
          The Protocol is provided "as is" without warranties of any kind. On-chain data freshness
          is guaranteed by cryptographic attestation, not by Veris Protocol as a legal entity.
          We make no representation that data from third-party operators is accurate, complete, or
          fit for any purpose.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Veris Protocol shall not be liable
          for any indirect, incidental, special, or consequential damages arising from use of the
          Protocol, including but not limited to loss of funds due to smart contract bugs, operator
          downtime, or blockchain congestion.
        </p>
      </Section>

      <Section title="Prohibited Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Use the Protocol for money laundering or sanctions evasion</li>
          <li>Attempt to exploit smart contract vulnerabilities</li>
          <li>Impersonate other sellers or submit fraudulent attestations</li>
          <li>Use the Protocol in any jurisdiction where it is prohibited</li>
        </ul>
      </Section>

      <Section title="Governing Law">
        <p>
          These Terms are governed by the laws of England and Wales. Disputes shall be resolved
          by the courts of England and Wales, except where mandatory local consumer law applies.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Veris Protocol · Monad Metropolis Hackathon Project ·{" "}
          <a href="mailto:hello@veris.xyz" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">hello@veris.xyz</a>
        </p>
      </Section>
    </div>
  );
}
