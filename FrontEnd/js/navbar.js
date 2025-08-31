document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem("name");

    if (userName) {
        const nameElement = document.querySelector("#dropdownUser span");
        if (nameElement) {
            nameElement.textContent = "Hi, " + userName;
        }
    }
});
