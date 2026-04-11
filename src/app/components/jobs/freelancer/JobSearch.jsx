import jobApiStore from "@/app/store/jobStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import ReadMoreBtn from "../../button/ReadMoreBtn";
import JobFilterSidebar from "../client/JobFilterSidebar";
import PaginationFreelance from "../../Pagination/PaginationFreelance";
import { Routes } from "@/app/routes";

export default function JobSearch() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { jobs, pagenum, totalpagenum, loading, error, fetchAllJob } =
    jobApiStore();

  useEffect(() => {
    fetchAllJob(page, limit);
  }, [page]);

  useEffect(() => {
    setTotalPages(totalpagenum);
  }, [totalpagenum]);

  const selectPage = (selectedPage) => {
    if (
      selectedPage >= 1 &&
      selectedPage <= totalPages &&
      selectedPage !== page
    ) {
      setPage(selectedPage);
    }
  };

  const totalResults = totalpagenum * limit;

  const formatDuration = (duration) => {
    if (duration === "ongoing") return "ongoing";
    const [start, end, unit] = duration.split("_");
    return `${start} to ${end} ${unit}`;
  };

  return (
    <>
      <JobFilterSidebar
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      <div className="hidden lg:block w-px bg-gray-200"></div>
      <div className="flex flex-col w-full lg:w-[70%] lg:w-4/5 gap-6 ml-0 lg:ml-5">
        <div className="flex flex-col md:flex-row gap-5 md:justify-between mb-2">
          <div className="flex flex-row md:justify-normal justify-between md:w-1/2 gap-6">
            <div className="relative">
              <select className="w-full  appearance-none border border-gray-300 bg-white px-4 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-black md:pr-10">
                <option>Sort By Latest</option>
                <option>Sort By Oldest</option>
                <option>Sort By Most Relevant</option>
                <option>Sort By Highest Payment</option>
                <option>Sort By Lowest Payment</option>
              </select>
              <svg
                className="w-4 h-4 absolute right-5 md:right-[30px] top-1/2 -translate-y-1/2 pointer-events-none text-gray-800"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <button className="hidden lg:flex border border-[#DFDFDF] p-2 md:px-8 md:py-3 rounded-full text-gray-800 text-xs md:text-base items-center gap-2 float-right">
              Filter
              <SvgIcon name="Filter" color="#04040E" />
            </button>
            <button
              className="flex float-right lg:hidden border border-[#FAFAFA] bg-white p-3 rounded-full text-gray-800 text-xs items-center gap-2"
              onClick={() => setShowFilters(true)}
              style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
            >
              <SvgIcon name="Filter" color="#04040E" />
            </button>
          </div>
          <p className="flex flex-row gap-2 md:gap-4 items-center justify-end text-gray-800 text-sm">
            {jobs && jobs.length > 0
              ? `Showing ${(page - 1) * limit + 1}–${(page - 1) * limit + jobs.length
              } of ${totalResults} results`
              : "No results found"}
            <button className="min-w-10 min-h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-secondary text-white">
              <SvgIcon name="Pagination_List" />
            </button>
          </p>
        </div>
        {/* main container for jobs */}
        {!jobs || jobs.length === 0 ? (
          <p>No jobs available.</p>
        ) : (
          jobs?.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`${Routes.freelancer.jobdetail}?id=${item.id}`)}
              className="flex flex-col p-5 border rounded border-gray-200 gap-4 hover:border-secondary transition-colors cursor-pointer"
            >
              {/* title and image */}
              <div className="flex items-center gap-2">
                <Image
                  src={"/logo.png"}
                  height={"32"}
                  width={"38"}
                  alt="Logo of company"
                />
                <h2 className="text-base md:text-lg text-[#3B3A40]">Adobe</h2>
              </div>

              {/* job title and time ago */}
              <div className="flex flex-col gap-3 ">
                <div className="flex justify-between items-center gap-2">
                  <h2 className="text-heading font-medium text-xl md:text-2xl max-w-[700px]">
                    {item.title}
                  </h2>
                  <p className="text-paragraph text-sm text-nowrap">
                    {formatDuration(item.duration)}
                  </p>
                </div>

                {/* budget and industry */}
                <div className="flex items-center justify-between flex-wrap sm:flex-row">
                  <p className="text-heading font-medium">
                    {item.budget_type} - {item.experience_level} - Est. Budget:{" "}
                    <span className="text-paragraph">
                      {" "}
                      {item.budget_amount}
                    </span>
                  </p>

                  <div className="flex items-center gap-8">
                    <p className="text-paragraph text-sm">{item.category}</p>
                    <p className="text-paragraph text-sm">
                      {item.project_size}
                    </p>
                  </div>
                </div>
              </div>
              <hr className="border-gray-200" />

              {/* job desc */}
              <div className="flex flex-col gap-3 mt-4">
                <h3 className="text-heading font-medium text-lg">
                  Qualifications :
                </h3>
                <ReadMoreBtn
                  text={item.description}
                  font="font-medium text-[#5BBB7B]"
                />
              </div>

              {/*category or skills */}
              <div className="flex items-center gap-3 flex-wrap">
                {item.skills.map((item) => (
                  <p
                    className="text-sm lg:text-base cursor-pointer
                    relative overflow-hidden
                    bg-[#FAFAFA] p-3 font-medium text-paragraph rounded-full
                    transition-all duration-300
                    before:content-[''] before:absolute before:inset-0
                    before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                    before:-z-10
                    hover:before:translate-x-0
                    z-10"
                    key={item}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
        {/* pagiantion */}
        <PaginationFreelance
          page={page}
          selectPage={selectPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
