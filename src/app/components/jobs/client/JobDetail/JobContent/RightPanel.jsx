import SvgIcon from "@/app/components/Utility/SvgIcon";

const RightPanel = ({ job }) => {
  if (!job) return null;

  const jobUrl = typeof window !== "undefined"
    ? window.location.href
    : "";

  function copyLink() {
    if (jobUrl) navigator.clipboard.writeText(jobUrl).catch(() => {});
  }

  return (
    <div className="lg:w-56 flex flex-col-reverse lg:flex-col gap-8 lg:border-l border-[#44444414] lg:pl-6">

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <button className="text-primary w-full font-medium text-base flex items-center gap-4 cursor-pointer hover:opacity-75">
          <SvgIcon name="PostEdit" /> Edit posting
        </button>
        <button className="text-primary w-full font-medium text-base flex items-center gap-4 cursor-pointer hover:opacity-75">
          <SvgIcon name="Eye2" size={22} /> View posting
        </button>
        <button className="text-red-500 w-full font-medium text-base flex items-center gap-4 cursor-pointer hover:opacity-75">
          <SvgIcon name="DeleteRed" size={22} /> Remove posting
        </button>
      </div>

      {/* Job info summary */}
      <div className="flex flex-col gap-5 border-b border-[#44444414] lg:border-none pb-8 lg:pb-0">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-base text-heading">Job status</h3>
          <span className={`inline-flex items-center gap-2 text-sm font-semibold capitalize
            ${job.status === "published" ? "text-secondary" : "text-paragraph"}`}>
            <span className={`w-2 h-2 rounded-full inline-block
              ${job.status === "published" ? "bg-secondary" : "bg-gray-400"}`} />
            {job.status}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-base text-heading">Budget</h3>
          <p className="text-paragraph text-sm font-medium capitalize">
            ${Number(job.budget_amount).toLocaleString()} · {job.budget_type}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-base text-heading">Experience</h3>
          <p className="text-paragraph text-sm font-medium capitalize">
            {job.experience_level}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-base text-heading">Job link</h2>
          <input
            type="text"
            readOnly
            value={jobUrl}
            className="border border-gray-200 px-2 py-2 rounded text-xs text-paragraph w-full"
          />
          <button
            onClick={copyLink}
            className="text-primary font-semibold text-sm text-left hover:underline"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
