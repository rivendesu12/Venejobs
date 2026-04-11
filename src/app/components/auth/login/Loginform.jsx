"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";

import userApiStore from "@/app/store/userStore";
import toastStore from "@/app/store/toastStore";
import LoginModalWrapper from "./LoginModalWrapper";
import LoginHeader from "./LoginHeader";
import LoginFormFields from "./LoginFormFields";
import LoginActions from "./LoginActions";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import { Routes } from "@/app/routes";

export default function Loginform({ setActiveModal, setUserEmail }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible((v) => !v);

  const login = userApiStore((s) => s.login);
  const sendOtp = userApiStore((s) => s.resendOtp);
  const showSuccess = toastStore.getState().showSuccess;
  const showError = toastStore.getState().showError;
  const { freelanceDetails, getPersonalDetails, personalDetailLoading } =
    freelancerApiStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleLogin = async (data) => {
    try {
      const res = await login(data);

      if (!res?.success) {
        showError(res?.data?.message || "Login failed", "error");
        return;
      }

      const { token, user } = res.data;

      showSuccess(res.data.message, "success");

      // Save token in parallel
      await Promise.all([
        axios.post("/api/set-token", { token }),
        Promise.resolve(localStorage.setItem("token", token)),
      ]);

      // Role-based routing
      if (user?.role_name === "freelancer") {
        await handleFreelancerRedirect();
        return;
      }

      if (user?.role_name === "client") {
        router.push(Routes.client.home);
        return;
      }

      if (user?.role_name === "admin") {
        router.replace(Routes.home);
        return;
      }

      router.replace(Routes.home);
    } catch (error) {
      const message = error?.response?.data?.message;
      showError(message || "Login error", "error");
    }
  };

  const handleFreelancerRedirect = async () => {
    try {
      const [profileRes] = await Promise.all([
        getPersonalDetails(),
        // add more API calls here if needed
      ]);

      if (profileRes?.data?.freelancerProfile != null) {
        router.push(Routes.freelancer.page);
      } else {
        router.push(Routes.freelancer.home);
      }
    } catch (err) {
      router.push(Routes.freelancer.home);
    }
  };

  return (
    <LoginModalWrapper setActiveModal={setActiveModal}>
      <LoginHeader setActiveModal={setActiveModal} />

      <form
        onSubmit={handleSubmit(handleLogin)}
        className="space-y-4 py-10 px-2 md:px-4 md:py-15"
      >
        <LoginFormFields
          register={register}
          errors={errors}
          isVisible={isVisible}
          toggleVisibility={toggleVisibility}
        />

        <LoginActions
          setActiveModal={setActiveModal}
          isSubmitting={isSubmitting}
        />
      </form>
    </LoginModalWrapper>
  );
}
