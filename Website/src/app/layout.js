import "../styles/globals.css";
import "../styles/styles.css";
import ParticlesContainer from "../components/tsParticle/ParticlesComponent";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Luckiest_Guy,
  Major_Mono_Display,
  Bebas_Neue,
  Roboto,
  Archivo_Black,
  Teko,
} from "next/font/google";
import { PlayWInContextAPI } from "@/components/contextAPI/playWinContextAPI";
import dynamic from "next/dynamic";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WalletKeeper = dynamic(
  () => import("@/components/metamask/walletKeeper"),
  {
    ssr: false,
  }
);

const ScreenDetector = dynamic(
  () => import("@/components/utils/screenDetector"),
  {
    ssr: false,
  }
);
const bebas_neue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--bebas_neue",
});

const major_mono_display = Major_Mono_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--major_mono_display",
});

const teko = Teko({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--teko",
});
const cls = (...classnames) => {
  return classnames.join(" ");
};

export const metadata = {
  metadataBase: new URL("https://playwin-on-blockchain.netlify.app"),
  title: "PlayWin",
  description:
    "PlayWin is the platform where users can enjoy raffles and lottery",
  icons: {
    icon: "/favicon/favicon.png",
  },
  openGraph: {
    images: "/ogImage/ogImage.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={cls(
          major_mono_display.variable,
          bebas_neue.variable,
          teko.variable
        )}
      >
        <PlayWInContextAPI>
          <ToastContainer />
          <ParticlesContainer>
            <ScreenDetector />
            <WalletKeeper />
            <Header />
            {children}
            <Footer />
          </ParticlesContainer>
        </PlayWInContextAPI>
      </body>
    </html>
  );
}
