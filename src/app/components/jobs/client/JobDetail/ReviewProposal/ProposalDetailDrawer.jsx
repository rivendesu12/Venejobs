"use client";
import { useState } from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import JobButtonTabs from "@/app/components/jobs/client/JobDetail/JobButtonTabs";
import Link from "next/link";

function initials(name) {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProposalDetailDrawer({ isOpen, onClose, proposal }) {
  const [showData, setshowData] = useState("coverLetter");

  const tabs = [
    { label: "Cover letter", id: "coverLetter" },
    { label: "Completed jobs", id: "completedJobs" },
    { label: "Portfolio", id: "portfolio" },
  ];

  if (!proposal) return null;

  const { freelancer_name, offered_price, estimated_days, cover_letter, status, conversation_id } = proposal;

  const content = {
    coverLetter: (
      <div className="flex flex-col gap-6">
        {/* Freelancer header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {initials(freelancer_name)}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-heading">{freelancer_name}</h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize w-fit
              ${status === "accepted" ? "bg-green-100 text-green-700"
                : status === "rejected" ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-paragraph"}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Bid summary */}
        <div className="flex gap-8 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-paragraph text-sm">Offered price</span>
            <span className="font-semibold text-heading text-lg">
              ${Number(offered_price).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-paragraph text-sm">Estimated days</span>
            <span className="font-semibold text-heading text-lg">
              {estimated_days} day{estimated_days !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Cover letter */}
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-base text-heading">Cover letter</h3>
          <p className="text-paragraph text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
            {cover_letter}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap mt-2">
          <button className="bg-primary text-white font-semibold px-6 py-3 rounded text-sm cursor-pointer">
            Hire
          </button>
          {conversation_id && (
            <Link
              href="/messages"
              onClick={onClose}
              className="bg-white border border-gray-200 text-paragraph font-semibold px-6 py-3 rounded text-sm cursor-pointer"
              style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
            >
              Message
            </Link>
          )}
          <button className="text-primary font-semibold text-sm flex items-center gap-2">
            <SvgIcon name="Like" size={20} /> Shortlist
          </button>
          <button className="text-paragraph font-semibold text-sm flex items-center gap-2">
            <SvgIcon name="Archive" size={20} /> Archive
          </button>
        </div>
      </div>
    ),
    completedJobs: (
      <p className="text-paragraph text-sm">Completed jobs history coming soon.</p>
    ),
    portfolio: (
      <p className="text-paragraph text-sm">Portfolio coming soon.</p>
    ),
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 left-0 h-screen max-h-screen overflow-y-auto no-scrollbar w-[97%] xl:w-[75%] bg-white z-50 transform transition-transform duration-300 rounded-r-[40px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
      >
        <div className="flex flex-col gap-8 max-w-[95%] lg:max-w-[880px] xl:max-w-[1000px] 2xl:max-w-[1230px] mx-4 my-6 md:mx-5 md:my-8 lg:my-8 lg:mb-10 lg:mr-10 lg:ml-auto">
          <div className="flex justify-between items-center">
            <button className="cursor-pointer" onClick={onClose}>
              <SvgIcon size={32} name="LeftArrow" color="#666666" />
            </button>
          </div>
          <div className="flex flex-col gap-8 lg:gap-10">
            <JobButtonTabs tabs={tabs} tabGap="4" showData={showData} setshowData={setshowData} />
            {content[showData]}
          </div>
        </div>
      </div>
    </>
  );
}
