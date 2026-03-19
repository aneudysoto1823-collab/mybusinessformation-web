import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBusinessFormation.com | Florida LLC Formation",
  description: "Form your LLC in Florida from anywhere in the world. LLC + Bank Account + Stripe. 100% online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}