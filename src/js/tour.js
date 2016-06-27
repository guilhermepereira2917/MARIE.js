var tour = new Tour({
  steps: [
  {
    element: "program-container",
    title: "Coding Area",
    content: "Type code here"
  },
  {
    element: "register-container",
    title: "Register Container",
    content: "This shows you how the register runs through each command"
  },
  {
    element: "status-info",
    title: "Debug Info",
    content: "This shows you how the register runs through each command"
  },

]});

// Initialize the tour
tour.init();

// Start the tour
tour.start();