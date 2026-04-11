import JobDetail from "./JobContent/JobDetail";
import RightPanel from "./JobContent/RightPanel";

const JobContent = ({ job }) => {
  return (
    <div className="flex flex-col lg:flex-row mt-3 lg:mt-10 gap-8">
      <JobDetail job={job} />
      <RightPanel job={job} />
    </div>
  );
};
export default JobContent;
