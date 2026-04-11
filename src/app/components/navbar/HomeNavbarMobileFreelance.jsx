"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomeNavbarMobileFreelance({
  isOpen,
  setIsOpen,
  SidebarLinks,
  logout,
}) {
  return (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* DRAWER MENU */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-white shadow-xl z-50 p-5
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 mt-4">
          <div className="flex items-center gap-3">
            <Image
              src="/home/logo-home.png"
              width={40}
              height={40}
              alt="logo"
              className="cursor-pointer"
            />
            <h3 className="text-lg font-semibold text-gray-600">Venejobs</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 text-4xl leading-none hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <hr className="mb-4" />

        {/* NAVIGATION */}
        <nav className="flex flex-col items-start gap-2 mt-2">
          {SidebarLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative py-2.5 px-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-lg w-full transition flex items-center justify-between"
              onClick={() => setIsOpen(false)}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="min-w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5 leading-none">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* SIGN OUT BUTTON FIXED */}
          <button
            type="button"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full py-2.5 px-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Sign out
          </button>
        </nav>
      </div>
    </>
  );
}
