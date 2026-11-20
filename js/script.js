document.addEventListener("DOMContentLoaded", function () {

    // Automatically update copyright year
    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Mobile navigation
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Live tool search
    const searchInput = document.getElementById("toolSearch");
    const toolCards = document.querySelectorAll(".tool-card");
    const noResults = document.getElementById("noResults");

    if (searchInput) {
        searchInput.addEventListener("input", function () {

            const searchValue = searchInput.value.toLowerCase().trim();
            let visibleCount = 0;

            toolCards.forEach(function (card) {

                const toolName = card.dataset.name.toLowerCase();
                const toolTitle = card.textContent.toLowerCase();

                const matches =
                    toolName.includes(searchValue) ||
                    toolTitle.includes(searchValue);

                card.style.display = matches ? "" : "none";

                if (matches) {
                    visibleCount++;
                }
            });

            if (noResults) {
                noResults.hidden = visibleCount !== 0;
            }
        });
    }

    // Contact form: honest frontend-only validation.
    // Email delivery will be connected before public launch.
    const contactForm = document.getElementById("contactForm");

    if (contactForm) {
        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const message = document.getElementById("contactMessage");

            if (message) {
                message.textContent =
                    "Your form is ready, but message delivery has not been connected yet. Please try again after this feature is configured.";
            }
        });
    }

});
