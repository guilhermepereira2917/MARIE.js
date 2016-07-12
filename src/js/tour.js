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
                onShow: viewHome,
                smartPlacement: true,
                element: "#brand",
                title: "Welcome to MARIE.js",
                content: "This tour introduces the features and how to use MARIE.js"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#program-container",
                title: "Coding Area",
                content: "This is where you type your code here"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#register-container",
                title: "Registers",
                content: "This shows you the register values"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#tab-container",
                title: "Values and Outputs",
                content: "This shows you the output in Register Log, Output Values and how the data is being transferred in RTL"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                backdrop: true,
                element: "#status-info",
                title: "Status bar",
                content: "Shows you current status: also shows error messages"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#bottom-menu",
                title: "Control Bar",
                content: "This is the bar used for stepping through the code, and building it"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#assemble",
                title: "Assembling the Code",
                content: "Build the code here"
            },
            {
                onShow: viewHome,
                smartPlacement: true,
                element: "#step",
                title: "Step",
                content: "Step Through the Code using this button"
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
                onShow: viewHome,
                smartPlacement: true,
                element: "#output-select",
                title: "Select Output Type",
                content: "Change the output type here with the options (HEX - Base 8, DEC - Base 10, ASCII - Base 16) . This by default is set to HEX. ",
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
