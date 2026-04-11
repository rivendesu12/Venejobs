"use client";
import { useState, useEffect } from "react";
import ClientLayout from "@/app/layout/ClientLayout";
import JobTabContent from "@/app/components/jobs/client/JobDetail/JobTabContent";
import JobButtonTabs from "@/app/components/jobs/client/JobDetail/JobButtonTabs";
import { useParams } from "next/navigation";
import jobApiStore from "@/app/store/jobStore";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function JobDetail() {
  const [showData, setshowData] = useState("all");
  const [proposals, setProposals] = useState([]);
  const params = useParams();
  const jobId = params.jobId;

  const { job, loading, error, getJobById } = jobApiStore();

  useEffect(() => {
    if (jobId) getJobById(jobId);
  }, [jobId, getJobById]);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}/proposals`)
      .then((r) => r.ok ? r.json() : { proposals: [] })
      .then((d) => setProposals(d.proposals ?? []))
      .catch(() => {});
  }, [jobId]);

  const tabs = [
    { id: "all",    label: "Job details" },
    { id: "review", label: `Review Proposals (${proposals.length})` },
    { id: "invite", label: "Invite Freelancers" },
    { id: "hire",   label: "Hire" },
  ];

  if (loading) {
    return (
      <ClientLayout>
        <div className="text-center my-20 text-lg font-medium text-paragraph">
          Loading job details…
        </div>
      </ClientLayout>
    );
  }

  if (!job || error) {
    return (
      <ClientLayout>
        <div className="text-center my-20">
          <h2 className="text-2xl font-semibold text-heading">No job available</h2>
          <p className="text-paragraph mt-2">This job does not exist or has been removed.</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex flex-col gap-6 lg:gap-8">

          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-[40px] text-heading font-semibold leading-tight">
              {job.title}
            </h1>
            <p className="text-paragraph text-sm font-medium">
              Posted {timeAgo(job.created_at)}
              <span className="mx-2">·</span>
              <span className="capitalize">{job.status}</span>
            </p>
          </div>

          {/* Tabs + content */}
          <div className="flex flex-col gap-4 lg:gap-8">
            <JobButtonTabs tabs={tabs} showData={showData} setshowData={setshowData} />
            <JobTabContent showData={showData} job={job} proposals={proposals} jobId={jobId} />
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
