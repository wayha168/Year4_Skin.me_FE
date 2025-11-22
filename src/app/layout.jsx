import "./globals.css";
// import Footer from "../Components/Footer/Footer";

export default function RootLayout({ children }) {
  return (            
    <html lang="en">
      <body>
        {children}
        {/* <Footer /> */}
      </body>
    </html>
  );
}
