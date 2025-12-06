import "./globals.css";
import { AuthProvider } from "./lib/Authentication/AuthContext";
// import FontAwesome from "../Components/FontAwesome/FontAwesome.jsx";

export const metadata = {
  title: "Skinme_store",
  description: "An e-commerce platform for skincare products",};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* <FontAwesome /> */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
