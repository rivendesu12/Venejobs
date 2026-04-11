"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FreelancerLayout from "@/app/layout/FreelancerLayout";
import ProposalForm from "@/app/components/ProposalForm";
import userApiStore from "@/app/store/userStore";
import jobApiStore from "@/app/store/jobStore";
import SvgIcon from "@/app/components/Utility/SvgIcon";

function formatDuration(duration) {
  if (!duration) return "—";
  if (duration === "ongoing") return "Ongoing";
  const parts = duration.split("_");
  if (parts.length === 3) return `${parts[0]} to ${parts[1]} ${parts[2]}`;
  return duration;
}

function formatCategory(cat) {
  if (!cat) return "—";
  return cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function JobDetailPage() {
  const [showForm, setShowForm] = useState(false);
  const [proposalDone, setProposalDone] = useState(false);
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");

  const { user } = userApiStore();
  const { job, loading, error, getJobById } = jobApiStore();

  useEffect(() => {
    if (jobId) getJobById(jobId);
  }, [jobId, getJobById]);

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="w-full max-w-[90%] xl:max-w-[1240px] mx-auto my-20 text-center text-paragraph">
          Loading job details…
        </div>
      </FreelancerLayout>
    );
  }

  if (!job || error) {
    return (
      <FreelancerLayout>
        <div className="w-full max-w-[90%] xl:max-w-[1240px] mx-auto my-20 text-center">
          <h2 className="text-2xl font-semibold text-heading">Job not found</h2>
          <p className="text-paragraph mt-2">This job may have been removed or does not exist.</p>
        </div>
      </FreelancerLayout>
    );
  }

  const skills = Array.isArray(job.skills)
    ? job.skills.map((s) => (typeof s === "string" ? JSON.parse(s) : s))
    : [];

  const isOwner = user && String(user.id) === String(job.client_id);
  const canApply = jobId && user && !isOwner;

  return (
    <FreelancerLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex flex-col lg:flex-row gap-10 border-b border-gray-200 pb-10">

          {/* ── LEFT: Main content ── */}
          <div className="flex flex-col gap-8 lg:flex-1">

            {/* Title + meta */}
            <div className="flex flex-col gap-4 border-b border-gray-200 pb-8">
              <h1 className="text-3xl lg:text-[40px] font-semibold text-heading leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-paragraph text-sm font-medium">
                <span>Posted {timeAgo(job.created_at)}</span>
                <span>·</span>
                <span>{formatCategory(job.category)}</span>
                <span>·</span>
                <span className="capitalize">{job.status}</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-8">
              <h2 className="font-semibold text-lg text-heading">Project Description</h2>
              <p className="text-paragraph text-base leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Budget + experience + duration */}
            <div className="flex flex-col gap-6 border-b border-gray-200 pb-8">
              <div className="flex flex-wrap gap-10">
                <div className="flex gap-4 items-center">
                  <SvgIcon name="PriceTag" />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-heading text-base">
                      ${Number(job.budget_amount).toLocaleString()}
                    </h3>
                    <p className="text-paragraph text-sm capitalize">{job.budget_type} price</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <SvgIcon name="PersonWSetting" />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-heading text-base capitalize">
                      {job.experience_level}
                    </h3>
                    <p className="text-paragraph text-sm">Experience level</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <SvgIcon name="Clock" size={24} />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-heading text-base">
                      {formatDuration(job.duration)}
                    </h3>
                    <p className="text-paragraph text-sm">Project duration</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <SvgIcon name="BusinessSector" size={24} />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-heading text-base capitalize">
                      {job.project_size}
                    </h3>
                    <p className="text-paragraph text-sm">Project size</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-8">
                <h2 className="font-semibold text-lg text-heading">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-[#FAFAFA] border border-gray-100 px-4 py-2 rounded-2xl text-paragraph text-sm font-medium"
                    >
                      {skill.name}
                      {skill.level && (
                        <span className="ml-1 text-xs text-gray-400">· {skill.level}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachment */}
            {job.attachment && (
              <div className="flex flex-col gap-3 border-b border-gray-200 pb-8">
                <h2 className="font-semibold text-lg text-heading">Attachments</h2>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_URL}${job.attachment}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 border border-gray-200 rounded px-4 py-3 w-fit hover:bg-gray-50"
                >
                  <div className="bg-gray-100 p-2 rounded-full">
                    <SvgIcon name="File" size={24} />
                  </div>
                  <div>
                    <p className="text-heading text-sm font-medium">
                      {job.attachment.split("/").pop()}
                    </p>
                    <p className="text-paragraph text-xs">Download attachment</p>
                  </div>
                </a>
              </div>
            )}

            {/* Proposal form */}
            {canApply && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-xl text-heading">Submit a Proposal</h2>
                  {!proposalDone && (
                    <button
                      onClick={() => setShowForm((v) => !v)}
                      className="bg-secondary text-white px-5 py-2.5 rounded font-semibold text-sm"
                    >
                      {showForm ? "Cancel" : "Apply Now"}
                    </button>
                  )}
                </div>

                {showForm && !proposalDone && (
                  <ProposalForm
                    jobId={jobId}
                    onSuccess={() => { setProposalDone(true); setShowForm(false); }}
                  />
                )}

                {proposalDone && (
                  <p className="text-secondary font-semibold text-sm">
                    Your proposal was submitted successfully!
                  </p>
                )}
              </div>
            )}

            {isOwner && (
              <p className="text-paragraph text-sm italic">This is your job posting.</p>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="lg:w-64 flex flex-col gap-8 lg:border-l border-gray-200 lg:pl-8">
            {canApply && !proposalDone && (
              <button
                onClick={() => { setShowForm(true); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }}
                className="bg-secondary w-full text-white px-4 py-3 rounded font-semibold text-base"
              >
                Apply Now
              </button>
            )}

            {proposalDone && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded px-4 py-3 text-sm font-semibold text-center">
                Proposal submitted!
              </div>
            )}

            <div className="flex flex-col gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-heading text-base">About the job</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-paragraph">Budget</span>
                  <span className="font-semibold text-heading capitalize">
                    ${Number(job.budget_amount).toLocaleString()} · {job.budget_type}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-paragraph">Duration</span>
                  <span className="font-semibold text-heading">{formatDuration(job.duration)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-paragraph">Experience</span>
                  <span className="font-semibold text-heading capitalize">{job.experience_level}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-paragraph">Project size</span>
                  <span className="font-semibold text-heading capitalize">{job.project_size}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-paragraph">Category</span>
                  <span className="font-semibold text-heading">{formatCategory(job.category)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
}
