document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem("name");

    if (userName) {
        // Update "Hi, Name" in topbar
        const nameElement = document.querySelector("#dropdownUser span");
        if (nameElement) {
            nameElement.textContent = "Hi, " + userName;
        }

        // Update full name inside dropdown profile
        const profileNameElement = document.querySelector(".profile-dropdown .fw-bold");
        if (profileNameElement) {
            profileNameElement.textContent = userName;
        }

        // Update avatar image
        const profileImage = document.querySelector(".profile-dropdown img");
        if (profileImage) {
            profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4e73df&color=fff&bold=true`;
        }
        const topAvatar = document.querySelector("#dropdownUser img");
        if (topAvatar) {
            topAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=fff&color=4e73df&bold=true`;
        }
    }
});
