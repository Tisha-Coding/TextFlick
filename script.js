document.addEventListener('DOMContentLoaded', () => {
    const typingForm = document.querySelector(".typing-form");
    const chatList = document.querySelector(".chat-list");
    const suggesstions = document.querySelectorAll(".suggesstion-list .suggesstion");
    const toggleThemeButton = document.querySelector("#toggle-theme-button");
    const deleteChatButton = document.querySelector("#delete-chat-button");

    let userMessage = null;
    let isResponseGenerating = false;

    // API configuration
    const API_KEY = "AIzaSyBXlYvpcbJo6QJVFf08bKbakg5pL-GB4FY"; // Replace with your actual API key
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

    const loadLocalstorageData = () => {
        const savedChats = localStorage.getItem("savedChats");
        const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

        // Apply the stored theme
        document.body.classList.toggle("light_mode", isLightMode);
        toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

        // Restore saved chats
        chatList.innerHTML = savedChats || "";
        document.body.classList.toggle("hide-header", savedChats);
            chatList.scrollTo(0,chatList.scrollHeight);
    }

    loadLocalstorageData();

    // Create a new message element and return it
    const createMessageElement = (content, ...classes) => {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    };

    // Type out the response text character by character
    const typeText = (element, text, speed = 20, callback = null) => {
        let i = 0;
        const interval = setInterval(() => {
            element.innerHTML += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                isResponseGenerating = false;
                element.classList.remove('typing');  // Remove typing class after completion
                if (callback) callback();  // Call the callback function to display the copy icon
                localStorage.setItem("savedChats", chatList.innerHTML); // save chats to local storage
            }
            chatList.scrollTo(0,chatList.scrollHeight);
        }, speed);
    };

    // Fetch response from the API based on user message
    const generateAPIResponse = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: userMessage }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                return;
            }

            const data = await response.json();
        

            const responseText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
                ? data.candidates[0].content.parts[0].text
                : "No response from API";

            // Remove asterisks from the response text
            const cleanResponseText = responseText.replace(/\*/g, '');

            // Find the loading message and replace it with the API response
            const loadingMessage = chatList.querySelector(".message.loading");
            if (loadingMessage) {
                const textElement = loadingMessage.querySelector(".text");
                loadingMessage.classList.remove("loading");
                textElement.classList.add("typing"); // Add the typing class

                textElement.innerHTML = ''; // Clear the "Loading..." text

                // Ensure the copy icon is visible after typing
                typeText(textElement, cleanResponseText, 20, () => {
                    const copyIcon = loadingMessage.querySelector(".icon");
                    copyIcon.style.display = 'inline-block'; // Show the copy icon
                    copyIcon.addEventListener('click', () => copyMessage(copyIcon));
                });
            }

        } catch (error) {
            isResponseGenerating = false;
            console.error("Fetch Error:", error);
        }
    };

    // Show a loading message while waiting for the API response
    const showLoadingAnimation = () => {
        const html = `
            <div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text">Loading...</p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span class="icon material-symbols-rounded" style="display: none;">
                content_copy
            </span>
        `;

        const loadingMessageDiv = createMessageElement(html, "incoming", "loading");
        chatList.appendChild(loadingMessageDiv);
        chatList.scrollTo(0,chatList.scrollHeight);
        generateAPIResponse();
    };

    const copyMessage = (copyIcon) => {
        const messageText = copyIcon.parentElement.querySelector(".text").innerText;

        navigator.clipboard.writeText(messageText)
            .then(() => {
                copyIcon.innerText = "done"; // show tick icon
                setTimeout(() => copyIcon.innerText = "content_copy", 1000);  // Revert icon after one second
            })
            .catch(err => console.error('Could not copy text: ', err));
    }

    // Handle sending outgoing chat messages
    const handleOutgoingChat = () => {
        userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
        if (!userMessage || isResponseGenerating) return;

        isResponseGenerating = true;

        const html = `
            <div class="message-content">
                <img src="images/user.jpg" alt="User Image" class="avatar">
                <p class="text">${userMessage}</p>
            </div>
        `;

        const outgoingMessageDiv = createMessageElement(html, "outgoing");
        chatList.appendChild(outgoingMessageDiv);

        typingForm.querySelector(".typing-input").value = '';

        chatList.scrollTo(0,chatList.scrollHeight);  // Scroll downn to the bottom
        document.body.classList.add("hide-header"); // Hide the header once chat start

        setTimeout(showLoadingAnimation, 500);  // show loading animation after a delay
    };

    // set userMessage and handle outgoing chat when a suggesstion is clicked
    suggesstions.forEach(suggesstion => 
    {
        suggesstion.addEventListener("click", () =>
        {
            userMessage = suggesstion.querySelector(".text").innerText;
            handleOutgoingChat();
        })
    }
    )

    // Toggle between light and dark themes 
    toggleThemeButton.addEventListener("click", () => {
        const isLightMode = document.body.classList.toggle("light_mode");
        localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
        toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    });

    // Delete all chats from local storage when delete button is clicked
    deleteChatButton.addEventListener("click", () =>
    {
        if(confirm("Are you sure you want to delete all messages?"))
        {
            localStorage.removeItem("savedChats");
            loadLocalstorageData();
        }
    })

    // Prevent default form submission and handle outgoing chat
    typingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleOutgoingChat();
    });
});
