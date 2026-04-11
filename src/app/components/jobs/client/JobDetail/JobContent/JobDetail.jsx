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

const JobDetail = ({ job }) => {
  if (!job) return null;

  const skills = Array.isArray(job.skills)
    ? job.skills.map((s) => {
        try { return typeof s === "string" ? JSON.parse(s) : s; }
        catch { return { name: s, level: "" }; }
      })
    : [];

  return (
    <div className="lg:flex-1 flex flex-col gap-8 border-b lg:border-b-0 border-[#44444414] pb-8 lg:pb-0">

      {/* Description */}
      <div className="flex flex-col gap-4 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-base lg:text-lg text-heading">Project Description</h2>
        <p className="text-paragraph text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
          {job.description}
        </p>
      </div>

      {/* Budget, experience, duration, size */}
      <div className="flex flex-wrap gap-8 lg:gap-14 border-b border-[#44444414] pb-8">
        <div className="flex gap-4 items-center">
          <SvgIcon name="PriceTag" />
          <div className="flex flex-col gap-1">
            <h3 className="text-heading font-semibold lg:text-lg">
              ${Number(job.budget_amount).toLocaleString()}
            </h3>
            <p className="text-paragraph text-sm lg:text-base font-medium capitalize">
              {job.budget_type} price
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <SvgIcon name="PersonWSetting" size={24} />
          <div className="flex flex-col gap-1">
            <h3 className="text-heading font-semibold lg:text-lg capitalize">
              {job.experience_level}
            </h3>
            <p className="text-paragraph text-sm lg:text-base font-medium">Experience level</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <SvgIcon name="Clock" size={24} />
          <div className="flex flex-col gap-1">
            <h3 className="text-heading font-semibold lg:text-lg">
              {formatDuration(job.duration)}
            </h3>
            <p className="text-paragraph text-sm lg:text-base font-medium">Duration</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <SvgIcon name="BusinessSector" size={24} />
          <div className="flex flex-col gap-1">
            <h3 className="text-heading font-semibold lg:text-lg capitalize">
              {job.project_size}
            </h3>
            <p className="text-paragraph text-sm lg:text-base font-medium">Project size</p>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-base lg:text-lg text-heading">Category</h2>
        <p className="text-paragraph text-sm lg:text-base font-medium">
          {formatCategory(job.category)}
        </p>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-4 border-b border-[#44444414] pb-8">
        <h2 className="font-semibold text-base lg:text-lg text-heading">Skills & Expertise</h2>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="relative overflow-hidden bg-[#FAFAFA] px-4 py-2.5 font-medium text-paragraph rounded-full
                           border border-gray-100 text-sm lg:text-base
                           transition-all duration-300
                           before:content-[''] before:absolute before:inset-0
                           before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                           before:-z-10 hover:before:translate-x-0 z-10"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-paragraph text-sm">No skills specified.</p>
        )}
      </div>

      {/* Attachment */}
      {job.attachment && (
        <div className="flex flex-col gap-4 pb-8">
          <h2 className="font-semibold text-base lg:text-lg text-heading">Attachments</h2>
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_URL}${job.attachment}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-[#44444414] rounded px-3 py-2 w-fit hover:bg-gray-50"
          >
            <div className="bg-gray-200 p-2 md:p-3 rounded-full">
              <SvgIcon name="File" size={28} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-heading text-xs md:text-sm font-medium">
                {job.attachment.split("/").pop()}
              </h3>
              <p className="text-paragraph text-[10px] md:text-xs">Download</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
