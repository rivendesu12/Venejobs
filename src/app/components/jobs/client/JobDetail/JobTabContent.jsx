import JobContent from "./JobContent";
import ReviewProposal from "./ReviewProposal";
import InviteFreelancer from "./InviteFreelancer";

export default function JobTabContent({ showData, job, proposals, jobId }) {
  const contentMap = {
    all:    <JobContent job={job} />,
    review: <ReviewProposal proposals={proposals} jobId={jobId} />,
    invite: <InviteFreelancer />,
    hire:   <div className="p-6 text-paragraph">No hires yet.</div>,
  };

  return contentMap[showData] ?? null;
}
