/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        "main-color": "#0078d7",
        "highlight-color": "#ffc13c",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        major_mono_display: ["var(--major_mono_display)"],
        bebas_neue: ["var(--bebas_neue)"],
        teko: ["var(--teko)"],
      },
    },
  },
  plugins: [],
};

/*
    struct RaffleInfo {
        PrizeType prizeType;
        Status status;
        address prize;
        uint256 prizeAmount;
        uint256 prizeId;
        uint256 deadline;
        uint256 entryPrice;
        uint256 minRaffleEntries; 
        uint256 maxRaffleEntries;
        uint256 minEntriesPerUser;
        uint256 maxEntriesPerUser;
        address creator;
        address winner;
        uint256 winningEntryNumber;
        uint256 totalEntries;
    }

*/
