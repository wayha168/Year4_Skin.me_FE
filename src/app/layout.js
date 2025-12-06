import "./globals.css";
import { AuthProvider } from "./lib/Authentication/AuthContext";

export const metadata = {
  title: "Skinme.store - Your Skincare E-commerce Platform",
  description: "An e-commerce platform for skincare products",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
