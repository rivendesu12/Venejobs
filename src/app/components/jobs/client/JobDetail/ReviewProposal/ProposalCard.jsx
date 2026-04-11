import SvgIcon from "@/app/components/Utility/SvgIcon";
import ReadMoreBtn from "../../../../button/ReadMoreBtn";
import Link from "next/link";

function initials(name) {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProposalCard({ proposal, onOpen }) {
  if (!proposal) return null;

  const {
    freelancer_name,
    offered_price,
    estimated_days,
    cover_letter,
    status,
    conversation_id,
  } = proposal;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-15">

        {/* Left — freelancer info */}
        <div className="flex w-full lg:w-[50%] flex-col gap-6">
          <div className="flex items-center gap-6 w-full justify-between">
            <div className="flex items-center gap-3.5 md:gap-6 w-full md:w-auto">

              {/* Avatar initials */}
              <div
                onClick={onOpen}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer flex-shrink-0"
              >
                {initials(freelancer_name)}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-2 lg:gap-4 cursor-pointer" onClick={onOpen}>
                  <h3 className="text-lg lg:text-2xl text-heading font-semibold">
                    {freelancer_name ?? "Freelancer"}
                  </h3>
                </div>

                <div className="flex flex-row items-center gap-6">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize
                    ${status === "accepted" ? "bg-green-100 text-green-700"
                      : status === "rejected" ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-paragraph"}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="hidden lg:flex items-center mt-2 gap-6 flex-wrap">
            <button className="bg-primary font-semibold px-5 py-2.5 rounded text-white text-sm cursor-pointer">
              Hire
            </button>
            {conversation_id && (
              <Link
                href={`/conversations/${conversation_id}`}
                className="bg-white font-semibold px-5 py-2.5 rounded text-paragraph text-sm cursor-pointer border border-gray-100"
                style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
              >
                Message
              </Link>
            )}
            <button className="text-primary text-xs md:text-sm flex flex-col items-center gap-1">
              <SvgIcon name="Like" size={22} />Shortlist
            </button>
            <button className="text-paragraph text-xs md:text-sm flex flex-col items-center gap-1">
              <SvgIcon name="Archive" size={22} />Archive
            </button>
          </div>
        </div>

        {/* Right — cover letter + bid */}
        <div className="w-full lg:w-[50%]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              <p className="text-heading text-base md:text-lg font-semibold">Cover letter</p>
              <p className="text-sm md:text-base font-semibold text-heading">
                Bid: <span className="text-xs md:text-sm font-medium text-paragraph ml-2">
                  ${Number(offered_price).toLocaleString()}
                </span>
              </p>
            </div>

            <ReadMoreBtn
              text={cover_letter}
              paragraphFont="font-normal leading-8"
              font="text-primary text-normal"
              clampClass="line-clamp-6 lg:line-clamp-4"
            />

            <div className="flex flex-col md:flex-row mt-2 gap-3 md:gap-7">
              <p className="flex gap-3 text-paragraph text-sm md:text-base font-medium">
                <SvgIcon name="Clock" size={18} />{estimated_days} day{estimated_days !== 1 ? "s" : ""} estimated
              </p>
            </div>

            {/* Mobile buttons */}
            <div className="lg:hidden flex items-center mt-2 gap-6 flex-wrap">
              <button className="bg-primary font-semibold px-5 py-2.5 rounded text-white text-sm cursor-pointer">
                Hire
              </button>
              {conversation_id && (
                <Link
                  href={`/conversations/${conversation_id}`}
                  className="bg-white font-semibold px-5 py-2.5 rounded text-paragraph text-sm cursor-pointer border border-gray-100"
                  style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
                >
                  Message
                </Link>
              )}
              <button className="text-primary text-xs flex flex-col items-center gap-1">
                <SvgIcon name="Like" size={22} />Shortlist
              </button>
              <button className="text-paragraph text-xs flex flex-col items-center gap-1">
                <SvgIcon name="Archive" size={22} />Archive
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
