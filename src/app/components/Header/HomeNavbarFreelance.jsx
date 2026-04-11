"use client";

import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";
import { Routes } from "../../routes";
import { useState, useEffect } from "react";
import SvgIcon from "../Utility/SvgIcon";
import { useRouter } from "next/navigation";
import toastStore from "../../store/toastStore";
import userApiStore from "../../store/userStore";
import freelancerApiStore from "../../store/freelancerApiStore";
import HomeNavbarMobileFreelance from "../navbar/HomeNavbarMobileFreelance";

export default function HomeNavbarFreelance() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;

  const { user, logout } = userApiStore();
  const { freelanceDetails } = freelancerApiStore();

  // Fetch total unread message count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/inbox");
        if (!res.ok) return;
        const data = await res.json();
        const total = (data.inbox ?? []).reduce(
          (sum, c) => sum + (c.unread_count ?? 0),
          0
        );
        setUnreadCount(total);
      } catch {
        // non-critical
      }
    }

    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, []);

  const user_logout = () => {
    try {
      logout();
      localStorage.removeItem("token");
      router.push(Routes.home);
      showSuccess("Logged Out Successfully!", "success");
    } catch (error) {
      showError(error, "error");
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    const completed = freelanceDetails?.freelancerProfile?.profile_completed;
    if (completed) {
      router.push(Routes.freelancer.page);
    } else {
      router.push(Routes.freelancer.home);
    }
  };

  const NavLinks = [
    { label: "Find Work", href: Routes.freelancer.page },
    { label: "Deliver Work", href: "" },
    { label: "Manage Finances", href: "" },
  ];

  const SidebarLinks = [
    {
      label: "Profile",
      href: Routes.freelancer.profileData,
      className: "text-3xl sm:text-2xl text-paragraph px-4 font-medium",
    },
    { label: "Find Work", href: Routes.freelancer.page },
    { label: "Deliver Work", href: "" },
    { label: "Manage Finances", href: "" },
    { label: "Message", href: Routes.messages, badge: unreadCount },
  ];

  return (
    <>
      <div className="w-full relative">
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto">
          <div className="flex justify-between items-center py-5">

            {/* Logo */}
            <Link
              href="#"
              onClick={handleLogoClick}
              className="flex gap-3 items-center cursor-pointer"
            >
              <Image
                className="w-10 md:w-[50px] md:h-[50px]"
                src="/logo_freelance.png"
                alt="logo image"
                height={50}
                width={50}
              />
              <h2 className="text-gray-600 text-lg font-extrabold">Venejobs</h2>
            </Link>

            {/* Desktop Nav */}
            <div className="lg:block hidden">
              <nav>
                <ul className="flex items-center gap-6 lg:gap-3 xl:gap-15 md:gap-10">
                  {NavLinks.map((item) => (
                    <li
                      className="text-paragraph text-base font-medium"
                      key={item.label}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}

                  {/* Message link with badge */}
                  <li className="text-paragraph text-base font-medium">
                    <Link
                      href={Routes.messages}
                      className="relative inline-flex items-center gap-1"
                    >
                      Message
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Profile */}
            <ProfileDropdown />

            {/* Mobile Menu Button */}
            <div
              role="button"
              tabIndex={0}
              className="text-black lg:hidden hover:bg-brand-strong font-medium leading-5 rounded-base text-sm cursor-pointer"
              aria-controls="drawer-navigation"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(true)}
            >
              <SvgIcon name="ToggleMenu" />
            </div>

            {/* Mobile Sidebar */}
            <HomeNavbarMobileFreelance
              isOpen={menuOpen}
              setIsOpen={setMenuOpen}
              SidebarLinks={SidebarLinks}
              logout={user_logout}
            />
          </div>
        </div>
      </div>
    </>
  );
}
