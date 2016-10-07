$(document).ready(function() {
    function viewHome() {
        window.location.hash = "";
    }

    function viewDatapath() {
        window.location.hash = "#datapath";
    }

    try {
        var tour = new Tour({
            onEnd: viewHome,
            steps: [
            {
                smartPlacement: true,
                backdrop: false,
                element: "#logo",
                title: "Welcome to MARIE.js",
                content: "This tour introduces the features and how to use MARIE.js"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: false,
                element: "#google",
                title: "Google Services",
                content: "We added Google Services! Click here to import/export from Google Drive",
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#program-container",
                title: "Coding Area",
                content: "This is where you type your code here, you can debug your code by opening 'Watchlist' and clicking to the right of the line number to add breakpoints. Green line shows current excution, grey line shows 'fetch' line "
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#register-container",
                title: "Registers",
                content: "This area shows you the register values, we have the Accumlator (AC), Program Counter (PC), IR"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#tab-container",
                title: "Values and Outputs",
                content: "This shows you the output in Register Log, Output Values and how the data is being transferred in RTL, MAR, MBR and Input/Output"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#status-info",
                title: "Status bar",
                content: "This is the status bar, this area shows you error messages or statuses to help you debug your code. Some examples include: RunTime Error, OverflowError, etc. "
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#output-select",
                title: "Select Output Type",
                content: "Change the output type here with the options (HEX - Base 8, DEC - Base 10, ASCII - Base 16) . This by default is set to HEX. ",
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#bottom-menu",
                title: "Control Bar",
                content: "This is the control bar used for controlling the execution and the assembling of the code"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#assemble",
                title: "Assembling the Code",
                content: "This button builds the code"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#step",
                title: "Step",
                content: "This steps one line through the code"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#microstep",
                title: "Microstep",
                content: "Step thorugh the code by each individual command here"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#step-back",
                title: "Stepping Backwards through the Code",
                content: "This is an awesome debugging feature where you can step back through each individual line to see where you've gone wrong"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#run",
                title: "Run",
                content: "Run the code, what else? This button can also pause the current execution during code execution"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#restart",
                title: "Restart",
                content: "Have you tried turning it on and off again? This does exactly that. But this also preserves memory contents"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#delay-slider",
                title: "Delay Slider",
                content: "This slider sets the timing of the execution of each step"
            },
            {
                onShow: viewDatapath,
                smartPlacement: true,
                element: "#datapath",
                title: "Datapath",
                content: "The datapath visualises how the simulator works by illustrating how micro-instructions are performed on the CPU."
            },
            {
                onShow: viewDatapath,
                smartPlacement: true,
                backdrop: true,
                element: "#datapath-status-bar",
                title: "Status bar",
                content: "Same as one shown in home screen: Shows you current status: also shows error messages"
            }
            ]});
        // Initialize the tour
        tour.init();

        // Start the tour
        tour.start();
    }
    catch(ex) {
        console.error(ex);
    }

    // Crude way of rerunning tour
    // Clears localStorage variable, then reloads page
    $( "#starttour" ).click(function() {
        window.localStorage.removeItem('tour_current_step'); //remove tour current step var
        window.localStorage.removeItem('tour_end'); //removes tour variable
        location.reload(); //reload page
    });
});
