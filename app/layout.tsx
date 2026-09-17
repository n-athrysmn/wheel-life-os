import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Wheel — Life Operating System",
  description:
    "Keep track of everything you’re becoming. An intentional home for your chronicles, quests, and possibilities.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang='en' className='antialiased' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { document.documentElement.dataset.theme = localStorage.getItem("wheel-theme") === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.theme = "light"; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
