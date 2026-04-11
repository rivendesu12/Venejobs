"use client";
import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";
import { Routes } from "../../routes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SvgIcon from "../Utility/SvgIcon";
import toastStore from "../../store/toastStore";
import userApiStore from "../../store/userStore";
import HomeNavbarMobileMenu from "../navbar/HomeNavbarMobileMenu";

export default function HomeNavbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;

  const { user, loading, error, fetchProfile, logout } = userApiStore();

  const userLogout = () => {
    try {
      logout();
      localStorage.removeItem("token");
      router.push(Routes.home);
      //currenly just removing from localstorage but still in cookie
      showSuccess("Logged Out Successfully!", "success");
    } catch (error) {
      showError(error, "error");
    }
  };

  const NavLinks = [
    {
      label: "Find Talent",
      href: "",
      icon: "",
    },
    {
      label: "Post a Job",
      href: Routes.client.job_post.form,
      icon: "",
    },
    {
      label: "Manage Work",
      href: "",
      icon: "",
    },
    {
      label: "Reports",
      href: "",
      icon: "",
    },
    {
      label: "Message",
      href: Routes.messages,
      icon: "",
    },
  ];

  const SidebarLinks = [
    {
      label: "Profile",
      href:
        user?.role_id === 2
          ? Routes.client.profile.home
          : Routes.freelancer.profile.home,
    },
    {
      label: "Find Talent",
      href: "",
      icon: "",
    },
    {
      label: "Post a job",
      href: "",
      icon: "",
    },
    {
      label: "Manage Work",
      href: "",
      icon: "",
    },
    {
      label: "Reports",
      href: "",
      icon: "",
    },
    {
      label: "Message",
      href: Routes.messages,
      icon: "",
    },
  ];

  return (
    <>
      <div className="w-full relative ">
        <div
          className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center py-5 ">
            {/* Logo */}
            <div className="flex gap-3 items-center">
              <Link href={Routes.client.home}>
                <Image
                  className="cursor-pointer w-10 md:w-[50px] md:h-[50px]"
                  src="/home/logo-home.png"
                  alt="logo image"
                  height={500}
                  width={500}
                  style={{ width: 40, height: 40 }}
                />
              </Link>
              <h1 className="text-gray-600  text-lg font-extrabold cursor-pointer">
                <Link href={Routes.client.home}>Venejobs</Link>
              </h1>
            </div>

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
                </ul>
              </nav>
            </div>

            {/* Profile */}
            <ProfileDropdown />

            {/* 🔥 MOVED HERE — Mobile Hamburger Button */}
            <div
              role="button"
              tabIndex={0}
              className="text-black lg:hidden hover:bg-brand-strong font-medium leading-5 rounded-base text-sm  cursor-pointer"
              aria-controls="drawer-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <SvgIcon name="ToggleMenu" />
            </div>
          </div>

          <HomeNavbarMobileMenu
            isOpen={menuOpen}
            setIsOpen={setMenuOpen}
            SidebarLinks={SidebarLinks}
            userLogout={userLogout}
          />
        </div>
      </div>
    </>
  );
}
