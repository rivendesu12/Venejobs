"use client";
import { useState } from "react";
import ProposalCard from "./ReviewProposal/ProposalCard";
import SearchFilter from "./SearchFilter";
import ProposalDetailDrawer from "./ReviewProposal/ProposalDetailDrawer";
import JobTabs from "@/app/components/Client/homeUI/JobTabs";

export default function ReviewProposal({ proposals = [], jobId }) {
  const [showData, setshowData] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  function openDrawer(proposal) {
    setSelectedProposal(proposal);
    setIsDrawerOpen(true);
  }

  const tabs = [
    { label: `All proposals (${proposals.length})` },
    { label: "Shortlisted" },
    { label: "Messaged" },
    { label: "Archived" },
  ];

  const visibleProposals = showData === 0 ? proposals : [];

  return (
    <div className="flex flex-col gap-8">
      <JobTabs tabs={tabs} showData={showData} setshowData={setshowData} />
      <SearchFilter />

      <div className="flex flex-col gap-10">
        {visibleProposals.length === 0 ? (
          <p className="text-paragraph text-sm">No proposals yet.</p>
        ) : (
          visibleProposals.map((proposal, i) => (
            <div key={proposal.id}>
              <ProposalCard proposal={proposal} onOpen={() => openDrawer(proposal)} />
              {i !== visibleProposals.length - 1 && <hr className="border-[#44444414] mt-10" />}
            </div>
          ))
        )}
      </div>

      <ProposalDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        proposal={selectedProposal}
      />
    </div>
  );
}
