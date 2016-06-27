//localStorage.setItem("tour", 1);
jQuery(document).ready(function($){

    // if tour is not set
    if(localStorage.getItem("tour")===0){
        //setup tour
        var tour = new Tour();
        
        tour.addSteps([{
                element: "#my-element",
                title: "Title of my step",
                content: "Content of my step"
            },
            {
                element: "#my-other-element",
                title: "Title of my step",
                content: "Content of my step"
            }
            ]);
        //initiatetour

        //set localStorage value to 1
        localStorage.setItem("tour", 1);
    }
    else{
        //ignore
    }
});