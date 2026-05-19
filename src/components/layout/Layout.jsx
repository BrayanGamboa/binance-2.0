import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import "./Layout.css";

export function Layout() {
  return (
    <div className="app_layout">
      <Header />
      <div className="app_body">
        <Sidebar />
        <main className="app_main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
