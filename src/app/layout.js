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
         <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
