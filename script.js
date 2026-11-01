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
    displayCard(item);
})

function displayCard(item) {
    const container = document.getElementById("card-container");

    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";

    const content = document.createElement("div");
    content.className = "card p-3 shadow-sm h-100";

    function addText(tag, text){
        const element = document.createElement(tag);
        element.textContent = text ?? "";
        content.appendChild(element);
    }

    addText("h1", item.title);
    addText("p", "Type: " + item.type);
    addText("p", "Date: " + item.date);
    addText("p", "Role: " + item.role);
    addText("p", "Description: " + item.description);
    addText("p", "Skills: " + item.skills);

    addText("h1", "Reflection");
    addText("p", "What I Did: " + item.reflection.WhatIid);
    addText("p", "What I Lerned: " + item.reflection.whatILearned);
    addText("p", "Challenge: " + item.reflection.challenge);
    addText("p", "Next Step: " + item.reflection.nextStep);

    addText("p", "Evidence: " + item.evidence.join(", "));

    card.appendChild(content);
}