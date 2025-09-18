import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar/NavBar";
import PageTransition from "./components/PageTransition/PageTransition";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { ThemeProvider } from "./components/ThemeProvider/ThemeProvider";
import { verifyUser, simplifyUser } from "./utils/auth-utils";
import ServiceStatus from "./components/ServiceStatus/ServiceStatus";
import SmallFooter from "./components/SmallFooter/SmallFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boolean",
  description: "Build anything.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRecord = await verifyUser();
  const simpleUser = simplifyUser(userRecord);
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ backgroundColor: 'var(--background)' }}>
        <ThemeProvider>
          <NavBar serverUser={simpleUser} />
          <ServiceStatus />
          <PageTransition type="fade" duration={0.75}>
            {children}
          </PageTransition>
          <ScrollToTop />
        </ThemeProvider>
        {/* Global black fade overlay for route transitions */}
        <div id="global-fade" style={{position:'fixed',inset:0,background:'#000',opacity:0,pointerEvents:'none',transition:'opacity 360ms ease',zIndex:1000}} />
        <script dangerouslySetInnerHTML={{__html:`(function(){
          var fade=document.getElementById('global-fade');
          function fadeOut(){ if(!fade) return; fade.style.opacity='1'; fade.style.pointerEvents='auto'; }
          function fadeIn(){ if(!fade) return; fade.style.opacity='0'; fade.style.pointerEvents='none'; }
          window.__fadeToBlack = fadeOut; window.__fadeFromBlack = fadeIn;
          // On page show, ensure we fade in from black if coming from a transition
          if(document.visibilityState==='visible'){ fadeIn(); }
          window.addEventListener('pageshow',fadeIn);
        })();`}} />
        {/* Bottom vignette removed */}
      </body>
    </html>
  );
}
