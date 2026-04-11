import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import jobApiStore from "@/app/store/jobStore";
import StepperNumber from "./StepperNumber";
import BudgetSkeleton from "../Skeletons/BudgetSkeleton";
import NumericInputField from "../common/NumericInputField";
import StepNavigation from "@/app/components/JobpostStepperForm/StepNavigation";
import { JobFormStep } from "@/app/components/JobpostStepperForm/JobFormStep";

const BudgetOptions = ({ nextStep, prevStep, setStep, fromReview }) => {
  const {
    register,
    formState: { errors },
    trigger,
    watch,
    setValue
  } = useFormContext();
  const [loadingNext, setLoadingNext] = useState(false);

  const priceType = watch("budget_type");

  const validateFields = async (callback) => {
    setLoadingNext(true);

    const valid = await trigger(["budget_type", "budget_amount"]);
    if (valid) callback();

    setLoadingNext(false);
  };

  const { budget_data, loading, getBudgetData } = jobApiStore();

  useEffect(() => {
    getBudgetData();
  }, []);

  const handlePrev = async () => {
    prevStep();
  };

  useEffect(() => {
    if (budget_data?.length) {
      setValue("budget_type", budget_data[0].code);
    }
  }, [budget_data]);
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <StepperNumber currstep={JobFormStep.budgetOptions} />
      <div className="flex gap-6 lg:gap-25 flex-col lg:flex-row">
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-semibold leading-tight text-heading">
            Set Your Budget with Confidence
          </h2>
          <p className="text-paragraph text-base lg:text-[18px]">
            Provide a budget range that aligns with your project goals. This
            helps attract the right talent while ensuring your expectations are
            clear
          </p>
        </div>

        <div className="flex flex-col w-full ">
          <div className="flex flex-col gap-4 w-full ">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                  Tell us about your budget.
                </h2>
                <p className="text-gray-500 text-sm xl:text-base font-medium tracking-wide">
                  This will help us match you to talent within your range.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {loading
                  ? Array.from({ length: 2 }).map((_, index) => (
                    <BudgetSkeleton key={index} />
                  ))
                  : budget_data?.map((item) => (
                    <label
                      key={item.id}
                      htmlFor={`budget_type_${item.code}`}
                      className="flex justify-between items-start gap-4 bg-neutral-primary-soft
                 border border-[#D0D5DD] rounded-lg p-5 hover:bg-neutral-secondary-medium
                 cursor-pointer w-full h-full transition-all has-checked:bg-[#5BBB7B0D]">
                      {/* Left Content */}
                      <div className="flex flex-col gap-3 w-full">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_1_3603)">
                            <path
                              d="M11.927 24.0486L15.9028 20.0728L13.2524 17.4221L14.5776 16.0969L17.228 18.7473L18.5535 17.4221L17.228 16.0969L18.5535 14.7717L17.228 13.4463L15.9028 14.7717L14.5776 13.4463L10.6018 17.4221L13.2524 20.0728L11.927 21.3979L9.27661 18.7473L7.95117 20.0728L9.27661 21.3979L7.95117 22.7231L9.27661 24.0483L10.6018 22.7231L11.927 24.0486Z"
                              fill="#333333"
                            />
                            <path
                              d="M28.8244 15.1031L27.8303 8.14533C29.1299 6.84601 30.3132 5.36481 31.0774 4.08161C31.4597 3.43952 32.6233 1.48542 31.5691 0.430978C30.5149 -0.62322 28.5608 0.540353 27.9184 0.922677C26.6352 1.68684 25.154 2.87019 23.855 4.1695C23.8547 4.1695 23.8547 4.1695 23.8547 4.16975L16.897 3.17561L0 20.0728L11.9272 32.0001L28.8244 15.1031ZM28.4665 2.78889C29.1907 2.31892 29.7063 2.07942 30.0349 1.96516C29.9206 2.29377 29.6811 2.8094 29.2112 3.53352C28.7422 4.25568 28.1504 5.02351 27.4912 5.77058L27.3335 4.66682L26.2297 4.5091C26.9765 3.84968 27.7444 3.25788 28.4665 2.78889ZM17.5596 5.16364L25.677 6.32331L25.8389 7.45759C25.061 8.1717 24.269 8.79279 23.5527 9.25055C23.4497 9.09406 23.3296 8.94562 23.1919 8.80817C22.0957 7.71198 20.3122 7.71198 19.2161 8.80817C18.1201 9.90412 18.1201 11.6878 19.2161 12.7838C20.3122 13.8799 22.0957 13.8799 23.1919 12.7838C23.6438 12.3321 23.9087 11.7635 23.9883 11.1746C24.6662 10.7943 25.405 10.2786 26.1543 9.66584L26.8364 14.4405L11.9272 29.3494L2.65039 20.0728L17.5596 5.16364ZM21.8667 11.4586C21.5007 11.8245 20.9077 11.825 20.5415 11.4586C20.176 11.0931 20.176 10.4986 20.5415 10.1334C20.907 9.76789 21.5012 9.76789 21.8667 10.1334C22.2331 10.4996 22.2329 11.0924 21.8667 11.4586Z"
                              fill="#333333"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1_3603">
                              <rect width="32" height="32" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>

                        <p className="text-sm xl:text-base text-heading font-semibold">
                          {item.label}
                        </p>

                        <p className="w-full text-sm text-paragraph font-medium">
                          {item.description}
                        </p>
                      </div>

                      {/* Radio — fully clickable because wrapped in label */}
                      <input
                        id={`budget_type_${item.code}`}
                        type="radio"
                        value={item.code}
                        {...register("budget_type", {
                          required: "Please select at least one option",
                        })}
                        name="budget_type"
                        className="w-5 h-5 text-primary accent-primary cursor-pointer"
                      />
                    </label>
                  ))}
              </div>

              {errors.budget_type && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.budget_type.message}
                </span>
              )}

              <div className="flex flex-col gap-4">
                <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                  What’s the Ideal Budget for Your Project?
                </h2>
                <p className="text-gray-500 text-sm xl:text-base font-medium tracking-wide">
                  You can talk about the cost with your freelancer and set
                  milestones to make the project progress smoothly.
                </p>

                <div className="w-48">
                  <NumericInputField
                    label="Budget Amount"
                    name="budget_amount"
                    placeholder="Enter budget amount"
                    prefix="$"
                    register={register}
                    error={errors?.budget_amount?.message}
                    focusBorder="primary"
                    rules={{
                      required: {
                        value: true,
                        message: "Please enter budget amount",
                      },
                      pattern: {
                        value: /^[0-9]+$/,
                        message: "Numbers only",
                      },
                      validate: (value) => {
                        if (priceType === "fixed" && Number(value) < 1) {
                          return "Amount cannot be less than 1 for fixed price";
                        }
                        if (priceType === "monthly" && Number(value) < 300) {
                          return "Amount cannot be less than 300 for monthly price";
                        }
                        return true;
                      },
                    }}
                    maxLength={10}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <StepNavigation
          onNext={() => validateFields(nextStep)}
          onBack={prevStep}
          showReviewBack={fromReview}
          onReviewBack={() =>
            validateFields(() => setStep(JobFormStep.review))
          }
          loading={loadingNext}
        />
      </div>
    </div>
  );
};

export default BudgetOptions;
