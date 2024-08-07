// import Layout from "@/components/layout/layout";
import "../css/globals.css";
import "../css/styles.css";
import "../css/animation.css";
import "../css/toastfy.css";

import "react-toastify/ReactToastify.min.css";
import dynamic from "next/dynamic";
import { ToastContainer } from "react-toastify";
import { Acme, Bebas_Neue, Roboto_Slab } from "next/font/google";
import PlayWInContextAPI from "./contextAPI/playWinContextAPI";
// import ParticlesComponent from "@/components/tsParticles/particlesComponent";

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

const Web3Modal = dynamic(() => import("../web3Modal/web3Modal"), {
  ssr: false,
});
const ParticlesComponent = dynamic(
  () => import("@/components/tsParticles/particlesComponent"),
  {
    ssr: false,
  }
);
const Layout = dynamic(() => import("@/components/layout/layout"), {
  ssr: false,
});
const bebas_neue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--bebas_neue",
});

const acme = Acme({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--acme",
});

const roboto_slab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--acme",
});

const cls = (...classnames) => {
  return classnames.join(" ");
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={cls(
          acme.variable,
          bebas_neue.variable,
          roboto_slab.variable
        )}
      >
        <PlayWInContextAPI>
          <ToastContainer />
          <ParticlesComponent />
          <Web3Modal>
            <Layout>{children}</Layout>
          </Web3Modal>
        </PlayWInContextAPI>
      </body>
    </html>
  );
}
