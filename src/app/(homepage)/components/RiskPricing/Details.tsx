export default function RiskPanel() {
  return (
    <div className="w-full max-w-[1080px] rounded-[20px] border border-black/10 bg-white text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7b7b]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M5 15L10 10L14 14L20 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-[24px] font-semibold tracking-[-0.02em]">
            Risk Panel
          </h2>
        </div>

        <p className="text-sm text-black/50">Data provided by [partner name]</p>
      </div>

      {/* Score Section */}
      <div className="border-b border-black/10 px-6 py-5">
        <div className="flex items-center gap-5">
          <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[8px] bg-[#d5f4d7] text-[32px] font-semibold text-[#2d4d31]">
            AA+
          </div>

          <div>
            <div className="text-[24px] leading-none font-semibold">
              Low Risk
            </div>

            <div className="mt-2 text-[15px] text-black/50">
              [Partner name] score
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="border-b border-black/10 px-6 py-5">
        <div className="grid grid-cols-6 gap-6">
          {[
            {
              icon: "💧",
              title: "Strong",
              subtitle: "Liquidity Health",
            },
            {
              icon: "🏗️",
              title: "Moderate",
              subtitle: "Leverage",
            },
            {
              icon: "🪙",
              title: "Stablecoin",
              subtitle: "Asset Type",
            },
            {
              icon: "📈",
              title: "Very Strong",
              subtitle: "Growth Potential",
            },
            {
              icon: "📉",
              title: "Critical",
              subtitle: "Debt Levels",
            },
            {
              icon: "💼",
              title: "Balanced",
              subtitle: "Asset Allocation",
            },
          ].map((item) => (
            <div key={item.title} className="min-w-0">
              <div className="flex items-start gap-2">
                <span className="mt-[1px] text-[15px]">{item.icon}</span>

                <div>
                  <div className="text-[18px] leading-none font-medium">
                    {item.title}
                  </div>

                  <div className="mt-1 text-[13px] leading-snug text-black/50">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consensus PD */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3 rounded-[8px] bg-[#d8f4d8] px-5 py-3 text-[#29482d]">
          <span className="text-[24px]">🗠</span>

          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-semibold">0.27%</span>

            <span className="text-[14px] text-[#29482d]/70">
              Consensus PD (Ann.)
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-8 rounded-[6px] bg-[#f3f3f3] px-6 py-5 text-black">
          <button className="flex items-center gap-2 text-[16px] font-medium text-[#1570ef] transition-opacity hover:opacity-80">
            <span>View on [partner name]</span>

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17L17 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 7H17V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00a6c7] text-sm text-white">
              ✓
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[16px] font-medium text-[#3b3b3b]">
                Gnosis Contract
              </span>

              <span className="text-[14px] text-[#9c9c9c]">
                0x0f388d7e65a969dbcbfab21bc3ab6629af78f4cf
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
