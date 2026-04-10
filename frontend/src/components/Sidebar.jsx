import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import "../../Style/dashboard.css";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = () => {
  const { open, setOpen } = useSidebar();
  const sidebarRef = useRef(null);

  // Close on click outside (but not when clicking the toggle in topbar)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest(".sidebar-toggle")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  return (
    <aside ref={sidebarRef} className={`sidebar ${open ? "open" : "closed"}`}>
      <h3 className="sidebar-title">Admin Panel</h3>
      <nav>
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">🏠</span>
          <span className="text">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">📊</span>
          <span className="text">Reports</span>
        </NavLink>
        <NavLink to="/admin/inventory" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">📦</span>
          <span className="text">Inventory</span>
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">🧾</span>
          <span className="text">Orders</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">👥</span>
          <span className="text">Users</span>
        </NavLink>
        <NavLink to="/admin/bargain-requests" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">🤝</span>
          <span className="text">Bargain</span>
        </NavLink>
        <NavLink to="/admin/shopping" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">🛒</span>
          <span className="text">Shopping</span>
        </NavLink>
        <NavLink to="/admin/shopping?view=categories" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">🗂️</span>
          <span className="text">Shop By Category</span>
        </NavLink>
        <NavLink to="/admin/wishlist" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">💖</span>
          <span className="text">Wishlist</span>
        </NavLink>
        <div className="sidebar-divider" />
        <NavLink to="/admin/profile" className={({ isActive }) => isActive ? "active" : ""}>
          <span className="icon">👤</span>
          <span className="text">Profile</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
