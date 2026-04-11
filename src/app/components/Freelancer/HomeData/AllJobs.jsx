import jobApiStore from "@/app/store/jobStore";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/routes";

import ReadMoreBtn from "../../button/ReadMoreBtn";
import PaginationFreelance from "../../Pagination/PaginationFreelance";
import JobCardSkeleton from "../../Skeletons/JobCardSkeleton";
import Image from "next/image";
import SvgIcon from "../../Utility/SvgIcon";

export default function AllJobs() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { jobs, totalpagenum, fetchAllJob, loading, hasFetched } =
    jobApiStore();

  useEffect(() => {
    fetchAllJob(page, limit);
  }, [page]);

  const selectPage = (selectedPage) => {
    if (selectedPage >= 1 && selectedPage <= totalpagenum) {
      setPage(selectedPage);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return "-";
    if (duration === "ongoing") return "Ongoing";
    const [start, end, unit] = duration.split("_");
    return `${start} to ${end} ${unit}`;
  };
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  useEffect(() => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        width: currentTab.offsetWidth,
        left: currentTab.offsetLeft,
      });
    }
  }, [activeTab]);

  const tabs = [
    {
      label: "My feed",
    },
  ];

  const formatBudgetType = (budgettype) => {
    let capitalizedType =
      budgettype.charAt(0).toUpperCase() + budgettype.slice(1);
    return capitalizedType;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-[1040px]">
        {/* Tabs */}
        <div className="flex gap-5 md:gap-15 justify-start relative">
          {tabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => setActiveTab(index)}
              className="relative"
            >
              <p
                className={`font-medium cursor-pointer text-sm md:text-base tracking-wide pb-3
                ${activeTab === index ? "text-secondary" : "text-gray-400"}
              `}
              >
                {tab.label}
              </p>
            </button>
          ))}
        </div>

        {/* HR */}
        <div className="relative mt-1">
          <hr className="border-[#44444414]" />

          {/* Active underline */}
          <div
            className="absolute top-0 h-0.5 bg-secondary transition-all duration-300"
            style={{
              width: indicatorStyle.width,
              left: indicatorStyle.left,
            }}
          />
        </div>
      </div>

      {/* ✅ FIRST LOAD SKELETON ONLY */}
      {!hasFetched &&
        loading &&
        Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}

      {/* ✅ EMPTY STATE */}
      {hasFetched && !loading && (!jobs || jobs.length === 0) && (
        <div className="flex justify-center mt-12">
          <h2 className="text-xl font-semibold text-gray-600">
            No Jobs Posted Yet
          </h2>
        </div>
      )}

      {/* ✅ JOB LIST */}
      {jobs?.map((item) => (
        <div
          key={item.id}
          onClick={() => router.push(`${Routes.freelancer.jobdetail}?id=${item.id}`)}
          className="rounded-xl border border-[rgba(68,68,68,0.08)] bg-white p-6 flex flex-col gap-4 max-w-[1040px] cursor-pointer hover:border-secondary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Image
              src={"/company.png"}
              height={"32"}
              width={"38"}
              alt="Logo of company"
              className="h-[30px] w-[30px] md:w-[38px] md:h-8"
            />
            <h2 className="font-semibold text-heading">Adobe</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center ">
              <h2 className="font-semibold text-lg md:text-xl max-w-[700px]">
                {item.title}
              </h2>
              <p className="text-paragraph text-sm text-nowrap">
                {formatDuration(item.duration)}
              </p>
            </div>

            {/* budget and industry */}
            <div className="flex flex-wrap items-center justify-between">
              <p className="font-medium">
                {formatBudgetType(item.budget_type)} - {item?.experience_level}{" "}
                - Est. Budget:{" "}
                <span className="text-paragraph font-medium"> {item.budget_amount}</span>
              </p>

              <div className="flex flex-col md:flex-row md:gap-8 md:items-center">
                <div className="text-paragraph text-sm flex items-center gap-3">
                  <SvgIcon name="BusinessSector" size="18" />
                  <p className="font-medium text-sm text-paragraph">
                    {item.category
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}
                  </p>
                </div>

                <div className="text-paragraph text-sm flex items-center gap-3">
                  <SvgIcon name="Clock" size="16" />
                  <p className="font-medium text-sm text-paragraph">{item.project_size}</p>
                </div>
              </div>
            </div>
          </div>
          <hr className="text-gray-200" />

          <div className="flex flex-col gap-3 mt-4">
            <h3 className="font-semibold text-base">Qualifications :</h3>
            <div className="text-paragraph">
              <ReadMoreBtn
                text={item.description}
                font="text-secondary text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.skills?.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-2.5 text-sm bg-gray-100 rounded-4xl text-paragraph font-medium"
              >
                <p className="font-semibold text-paragraph">

                  {skill.name}
                </p>
                {/* For exact ui comment out below */}
                {/* <span className="ml-1 text-gray-500">({skill.level})</span> */}
              </span>
            ))}
          </div>
        </div>
      ))}

      {hasFetched && totalpagenum > 1 && (
        <PaginationFreelance
          page={page}
          totalPages={totalpagenum}
          selectPage={selectPage}
        />
      )}
    </div>
  );
}
