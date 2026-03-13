import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../Style/dashboard.css";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";

const AdminLayout = () => {
  const { open } = useSidebar();

  useEffect(() => {
    const handleKeyShortcuts = (e) => {
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector(".topbar-search input")?.focus();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        document.querySelector(".sidebar-toggle")?.click();
      }
      if (e.key === "Escape") {
        document.body.click();
      }
    };
    window.addEventListener("keydown", handleKeyShortcuts);
    return () => window.removeEventListener("keydown", handleKeyShortcuts);
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className={`admin-main${open ? "" : " sidebar-closed"}`}>
        <Topbar />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;