export const Routes = {
  home: "/",
  messages: "/messages",

  client: {
    home: "/client",
    chat: "/client/chat/",
    hirePayment: "/client/HirePayment/",

    job_post: {
      home: "/client/jobpost/",
      form: "/client/jobpost/forms/",
    },

    profile: {
      home: "/profile/client",
      info: "/profile/client/Info",
      bill: "/profile/client/Bill",
    },
  },

  freelancer: {
    home: "/freelancer",
    get_started: "/freelancer/addProfileDetails",
    page: "/freelancer/home",
    chat: "/freelancer/chat/",
    jobdetail: "/freelancer/JobDetail/",
    // jobsearch:"/freelancer/JobSearch/",
    proposal: "/freelancer/Proposal/",
    profileData: "/freelancer/profileData",

    profile: {
      home: "/profile/freelancer",
      info: "/profile/freelancer/Info",
      billing: "/profile/freelancer/BillingPage",
    },

    service: {
      home: "/freelancer/AddService/",
      form: "/freelancer/AddService/form",
    },
  },

  auth: {
    signup: "/auth/signup/",
  },
};
