const form = document.querySelector("#item-form");
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const data = new FormData(form);
    // Javascript object
    const item = {
        id: data.get("portfolioId"),
        title: data.get("title"),
        type: data.get("type"),
        date: data.get("date"),
        role: data.get("role"),
        description: data.get("description"),
        skills: data.get("skills"),
        reflection: {
            whatIDid: data.get("whatIid"),
            whatILearned: data.get("whatILearned"),
            challenge: data.get("challenge"),
            nextStep: data.get("nextStep")
        },
        evidence: [data.get("evidence")]
    };
})