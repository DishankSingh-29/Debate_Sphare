// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');

mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileMenuBtn.innerHTML = navMenu.classList.contains('active') ? 
        '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (this.getAttribute('href') === '#') return;
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
});

// Header Scroll Effect
let lastScroll = 0;
const header = document.getElementById('main-header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('hidden');
        header.style.boxShadow = 'none';
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('hidden')) {
        // Scroll down
        header.classList.add('hidden');
    } else if (currentScroll < lastScroll && header.classList.contains('hidden')) {
        // Scroll up
        header.classList.remove('hidden');
    }
    
    // Add shadow when scrolled
    if (currentScroll > 50) {
        header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Page Toggle Functions
const signupPage = document.getElementById('signup-page');
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const debatePage = document.getElementById('debate-page');
const forgotPasswordModal = document.getElementById('forgot-password-modal');

// Show/hide functions
function showSignupPage() {
    mainPage.style.display = 'none';
    loginPage.style.display = 'none';
    debatePage.style.display = 'none';
    signupPage.style.display = 'block';
    forgotPasswordModal.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

function showLoginPage() {
    mainPage.style.display = 'none';
    signupPage.style.display = 'none';
    debatePage.style.display = 'none';
    loginPage.style.display = 'block';
    forgotPasswordModal.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

function showDebatePage() {
    mainPage.style.display = 'none';
    signupPage.style.display = 'none';
    loginPage.style.display = 'none';
    forgotPasswordModal.style.display = 'none';
    debatePage.style.display = 'block';
    document.body.style.overflow = 'auto';
    initializeDebatePage();
}

function showForgotPasswordModal() {
    forgotPasswordModal.style.display = 'block';
    document.getElementById('forgot-password-form').style.display = 'block';
    document.getElementById('forgot-password-success').style.display = 'none';
    document.body.style.overflow = 'hidden';
}

function hideAuthPages() {
    mainPage.style.display = 'block';
    signupPage.style.display = 'none';
    loginPage.style.display = 'none';
    debatePage.style.display = 'none';
    forgotPasswordModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function hideForgotPasswordModal() {
    forgotPasswordModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event listeners for signup buttons
document.getElementById('header-signup-btn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupPage();
});

document.getElementById('hero-signup-btn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupPage();
});

document.getElementById('cta-signup-btn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupPage();
});

// Event listeners for login/signup links
document.getElementById('signup-login-link').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginPage();
});

document.getElementById('login-signup-link').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupPage();
});

// Forgot password links
document.getElementById('signup-forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordModal();
});

document.getElementById('login-forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordModal();
});

// Close buttons
document.getElementById('close-signup-btn').addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthPages();
});

document.getElementById('close-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthPages();
});

document.getElementById('close-forgot-password-btn').addEventListener('click', (e) => {
    e.preventDefault();
    hideForgotPasswordModal();
});

// Back to login button
document.getElementById('back-to-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    hideForgotPasswordModal();
    showLoginPage();
});

// Form submissions
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Here you would typically handle form submission (e.g., AJAX request)
    alert('Account created successfully! Redirecting to dashboard...');
    showDebatePage();
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Here you would typically handle form submission (e.g., AJAX request)
    alert('Login successful! Redirecting to dashboard...');
    showDebatePage();
});

// Forgot password form submission
document.getElementById('forgot-password-form-content').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-password-email').value;
    
    // Show success message
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('forgot-password-success').style.display = 'block';
    document.getElementById('sent-email').textContent = email;
    
});

// Google sign in buttons
document.querySelector('.signup-btn-google').addEventListener('click', () => {
    alert('Google sign up functionality would be implemented here');
});

document.querySelector('.login-btn-google').addEventListener('click', () => {
    alert('Google login functionality would be implemented here');
});

// Intersection Observer for Animations
const animateElements = (elements, className) => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(className);
            }
        });
    }, {
        threshold: 0.1
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
};

// Animate hero content
const heroContent = document.querySelector('.hero-content');
if (heroContent) {
    setTimeout(() => {
        heroContent.classList.add('animate');
    }, 300);
}

// Animate stat items
const statItems = document.querySelectorAll('.stat-item');
animateElements(statItems, 'animate');

// Animate section titles
const sectionTitles = document.querySelectorAll('.section-title h2');
animateElements(sectionTitles, 'animate');

// Animate section descriptions
const sectionDescs = document.querySelectorAll('.section-title p');
animateElements(sectionDescs, 'animate');

// Animate step cards
const stepCards = document.querySelectorAll('.step-card');
animateElements(stepCards, 'animate');

// Animate feature cards
const featureCards = document.querySelectorAll('.feature-card');
animateElements(featureCards, 'animate');

// Animate benefit cards
const benefitCards = document.querySelectorAll('.benefit-card');
animateElements(benefitCards, 'animate');

// Animate testimonial cards
const testimonialCards = document.querySelectorAll('.testimonial-card');
animateElements([...testimonialCards], 'animate');

// Animate CTA content
const ctaContent = document.querySelector('.cta-content');
animateElements([ctaContent], 'animate');

// Logo upload functionality
const logoImg = document.querySelector('.logo-img');
const footerLogoImg = document.querySelector('.footer-logo-img');
const loginLogoImg = document.querySelector('.login-logo-img');
const signupLogoImg = document.querySelector('.signup-logo-img');
const debateLogoImg = document.querySelector('.debate-logo-img');
const logoUpload = document.createElement('input');
logoUpload.type = 'file';
logoUpload.accept = 'image/*';
logoUpload.style.display = 'none';

logoImg.addEventListener('click', () => {
    logoUpload.click();
});

footerLogoImg.addEventListener('click', () => {
    logoUpload.click();
});

loginLogoImg.addEventListener('click', () => {
    logoUpload.click();
});

signupLogoImg.addEventListener('click', () => {
    logoUpload.click();
});

debateLogoImg.addEventListener('click', () => {
    logoUpload.click();
});

logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            logoImg.src = event.target.result;
            footerLogoImg.src = event.target.result;
            loginLogoImg.src = event.target.result;
            signupLogoImg.src = event.target.result;
            debateLogoImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Floating animation for feature icons
const featureIcons = document.querySelectorAll('.feature-icon i');
featureIcons.forEach((icon, index) => {
    icon.style.animationDelay = `${index * 0.2}s`;
    icon.classList.add('floating');
});

// Debate Page Functionality
function initializeDebatePage() {
    // User profile dropdown
    const userProfile = document.getElementById('debate-user-profile');
    const userMenu = document.getElementById('debate-user-menu');
    
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        userMenu.classList.remove('active');
    });
    
    // Logout button
    document.getElementById('debate-logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            hideAuthPages();
        }
    });
    
    // Debate topics data
    const debateTopics = [
        {
            id: 1,
            title: "Should social media platforms be held legally responsible for content posted by their users?",
            category: "Technology",
            description: "This debate examines the role and responsibility of social media companies in moderating user-generated content.",
            difficulty: 3
        },
        {
            id: 2,
            title: "Is universal basic income a viable solution to job displacement caused by automation?",
            category: "Politics",
            description: "Explore the economic and social implications of implementing a universal basic income system.",
            difficulty: 4
        },
        {
            id: 3,
            title: "Should college education be free for all students?",
            category: "Education",
            description: "Debate the merits and drawbacks of making higher education tuition-free.",
            difficulty: 3
        },
        {
            id: 4,
            title: "Is artificial intelligence a threat to humanity?",
            category: "Technology",
            description: "Examine the potential risks and benefits of advanced AI systems.",
            difficulty: 4
        },
        {
            id: 5,
            title: "Should animal testing be banned worldwide?",
            category: "Ethics",
            description: "Discuss the ethical considerations and scientific necessity of animal testing.",
            difficulty: 3
        },
        {
            id: 6,
            title: "Is capitalism the best economic system for modern societies?",
            category: "Politics",
            description: "Compare capitalism with alternative economic systems and their effectiveness.",
            difficulty: 5
        },
        {
            id: 7,
            title: "Should governments impose stricter regulations on fast food to combat obesity?",
            category: "Health",
            description: "Debate the role of government in regulating food choices for public health.",
            difficulty: 2
        },
        {
            id: 8,
            title: "Is climate change the greatest threat facing humanity today?",
            category: "Environment",
            description: "Assess the severity of climate change compared to other global challenges.",
            difficulty: 3
        },
        {
            id: 9,
            title: "Should voting be mandatory in democratic countries?",
            category: "Politics",
            description: "Explore the arguments for and against compulsory voting in democracies.",
            difficulty: 3
        },
        {
            id: 10,
            title: "Is space exploration worth the investment?",
            category: "Technology",
            description: "Debate the costs and benefits of space exploration programs.",
            difficulty: 4
        },
        {
            id: 11,
            title: "Should genetic engineering of human embryos be allowed?",
            category: "Science",
            description: "Discuss the ethical and scientific implications of editing human DNA.",
            difficulty: 5
        },
        {
            id: 12,
            title: "Is remote work better than office work for most jobs?",
            category: "Business",
            description: "Compare the productivity and social impacts of remote vs. office work.",
            difficulty: 2
        },
        {
            id: 13,
            title: "Should governments provide free internet access to all citizens?",
            category: "Technology",
            description: "Debate the role of internet access as a public utility and human right.",
            difficulty: 3
        },
        {
            id: 14,
            title: "Is the concept of free will compatible with scientific determinism?",
            category: "Philosophy",
            description: "Explore the philosophical debate between free will and determinism.",
            difficulty: 5
        },
        {
            id: 15,
            title: "Should professional athletes be required to stand for national anthems?",
            category: "Politics",
            description: "Discuss the intersection of sports, politics, and personal expression.",
            difficulty: 3
        },
        {
            id: 16,
            title: "Is social media doing more harm than good to society?",
            category: "Technology",
            description: "Analyze the societal impacts of social media platforms.",
            difficulty: 3
        },
        {
            id: 17,
            title: "Should schools eliminate standardized testing?",
            category: "Education",
            description: "Debate the effectiveness and fairness of standardized testing in education.",
            difficulty: 3
        },
        {
            id: 18,
            title: "Is it ethical to eat meat in the modern world?",
            category: "Ethics",
            description: "Discuss the moral implications of meat consumption considering environmental and animal welfare concerns.",
            difficulty: 4
        },
        {
            id: 19,
            title: "Should governments regulate artificial intelligence development?",
            category: "Technology",
            description: "Debate the need for governmental oversight in AI research and deployment.",
            difficulty: 4
        },
        {
            id: 20,
            title: "Is the pursuit of economic growth compatible with environmental sustainability?",
            category: "Environment",
            description: "Explore the tension between economic development and ecological preservation.",
            difficulty: 4
        }
    ];
    
    // Populate topic list
    const topicList = document.getElementById('topic-list');
    
    function populateTopics(topics) {
        topicList.innerHTML = '';
        topics.forEach(topic => {
            const topicItem = document.createElement('div');
            topicItem.className = 'debate-topic-item';
            topicItem.dataset.id = topic.id;
            topicItem.innerHTML = `
                <h4>${topic.title}</h4>
                <p>${topic.description}</p>
                <div class="debate-topic-item-footer">
                    <span>${topic.category}</span>
                    <div class="debate-topic-item-difficulty">
                        ${'<i class="fas fa-star"></i>'.repeat(topic.difficulty)}
                        <span>${getDifficultyText(topic.difficulty)}</span>
                    </div>
                </div>
            `;
            topicList.appendChild(topicItem);
        });
    }
    
    function getDifficultyText(level) {
        switch(level) {
            case 1: return 'Easy';
            case 2: return 'Moderate';
            case 3: return 'Intermediate';
            case 4: return 'Challenging';
            case 5: return 'Expert';
            default: return 'Moderate';
        }
    }
    
    populateTopics(debateTopics);
    
    // Topic search functionality
    const topicSearch = document.getElementById('topic-search');
    topicSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredTopics = debateTopics.filter(topic => 
            topic.title.toLowerCase().includes(searchTerm) || 
            topic.description.toLowerCase().includes(searchTerm) ||
            topic.category.toLowerCase().includes(searchTerm)
        );
        populateTopics(filteredTopics);
    });
    
    // Topic category filtering
    const categoryItems = document.querySelectorAll('.debate-topic-category');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');
            
            const category = item.textContent;
            if (category === 'All') {
                populateTopics(debateTopics);
            } else {
                const filteredTopics = debateTopics.filter(topic => topic.category === category);
                populateTopics(filteredTopics);
            }
        });
    });
    
    // Topic selection
    let selectedTopicId = null;
    
    topicList.addEventListener('click', (e) => {
        const topicItem = e.target.closest('.debate-topic-item');
        if (topicItem) {
            document.querySelectorAll('.debate-topic-item').forEach(item => {
                item.classList.remove('active');
            });
            topicItem.classList.add('active');
            selectedTopicId = topicItem.dataset.id;
            document.getElementById('select-topic-btn').disabled = false;
        }
    });
    
    // Topic selection button
    document.getElementById('select-topic-btn').addEventListener('click', () => {
        if (selectedTopicId) {
            const selectedTopic = debateTopics.find(topic => topic.id == selectedTopicId);
            document.getElementById('topic-selector').style.display = 'none';
            document.getElementById('side-selector').style.display = 'block';
            document.getElementById('current-topic-display').textContent = `Topic: ${selectedTopic.title}`;
        }
    });
    
    // Cancel topic selection
    document.getElementById('cancel-topic-btn').addEventListener('click', () => {
        hideAuthPages();
    });
    
    // Back to topics button
    document.getElementById('back-to-topics-btn').addEventListener('click', () => {
        document.getElementById('side-selector').style.display = 'none';
        document.getElementById('topic-selector').style.display = 'block';
    });
    
    // Side selection
    let selectedSide = null;
    
    document.getElementById('pro-side').addEventListener('click', () => {
        document.getElementById('pro-side').classList.add('active');
        document.getElementById('con-side').classList.remove('active');
        selectedSide = 'pro';
        document.getElementById('start-debate-btn').disabled = false;
        document.getElementById('user-side-badge').className = 'debate-side-badge debate-side-pro';
        document.getElementById('user-side-badge').textContent = 'PRO';
    });
    
    document.getElementById('con-side').addEventListener('click', () => {
        document.getElementById('con-side').classList.add('active');
        document.getElementById('pro-side').classList.remove('active');
        selectedSide = 'con';
        document.getElementById('start-debate-btn').disabled = false;
        document.getElementById('user-side-badge').className = 'debate-side-badge debate-side-con';
        document.getElementById('user-side-badge').textContent = 'CON';
    });
    
    // Start debate button
    document.getElementById('start-debate-btn').addEventListener('click', () => {
        document.getElementById('side-selector').style.display = 'none';
        document.getElementById('debate-interface').classList.add('active');
        startDebateTimer();
        
        // Add welcome message from AI
        const welcomeMessages = [
            "Welcome to the debate! I'll be your opponent today. I'm ready when you are - present your first argument.",
            "Let's begin our debate. Please state your opening argument and we'll engage in a thoughtful discussion.",
            "I'm looking forward to our debate. Present your initial position and we'll explore the topic together.",
            "Ready to debate! Please share your first argument and we'll have a productive exchange of ideas."
        ];
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        addAIMessage(randomWelcome);
    });
    
    // Debate timer
    let debateTimerInterval;
    let debateSeconds = 0;
    
    function startDebateTimer() {
        debateSeconds = 0;
        debateTimerInterval = setInterval(() => {
            debateSeconds++;
            const minutes = Math.floor(debateSeconds / 60);
            const seconds = debateSeconds % 60;
            document.getElementById('debate-timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    // Debate messages
    function addUserMessage(text) {
        const messagesContainer = document.getElementById('debate-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'debate-message debate-message-user';
        messageDiv.innerHTML = `
            <div class="debate-message-header">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" class="debate-message-avatar">
                <div class="debate-message-name debate-message-name-user">You</div>
                <div class="debate-message-time">${getCurrentTime()}</div>
            </div>
            <div class="debate-message-text">${text}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function addAIMessage(text) {
        const messagesContainer = document.getElementById('debate-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'debate-message debate-message-ai';
        messageDiv.innerHTML = `
            <div class="debate-message-header">
                <img src="images/logo.png" alt="AI" class="debate-message-avatar">
                <div class="debate-message-name debate-message-name-ai">DebateBot</div>
                <div class="debate-message-time">${getCurrentTime()}</div>
            </div>
            <div class="debate-message-text">${text}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Speak the AI response
        speakAIResponse(text);
    }
    
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Text input functionality
    const debateTextInput = document.getElementById('debate-text-input');
    const debateSendBtn = document.getElementById('debate-send-btn');
    
    debateTextInput.addEventListener('input', () => {
        document.getElementById('debate-char-counter').textContent = debateTextInput.value.length;
    });
    
    debateSendBtn.addEventListener('click', () => {
        sendMessage();
    });
    
    debateTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = debateTextInput.value.trim();
        if (message) {
            addUserMessage(message);
            debateTextInput.value = '';
            document.getElementById('debate-char-counter').textContent = '0';
            
            // Simulate AI response after a delay
            setTimeout(() => {
                const aiResponses = [
                    "That's an interesting point. However, have you considered that...",
                    "I understand your perspective, but the data actually shows that...",
                    "You make a valid argument, but let me counter with...",
                    "That's a common position, but research indicates that...",
                    "I see where you're coming from, but what about the fact that...",
                    "You raise an important issue, but the opposite view suggests...",
                    "That's a compelling argument, but consider this alternative...",
                    "I appreciate that perspective. However, another way to look at it is...",
                    "That's a thoughtful point. Let me offer a different viewpoint...",
                    "You've presented that well. On the other hand, we might consider..."
                ];
                
                // More sophisticated responses based on debate side
                let selectedResponses = aiResponses;
                if (selectedSide === 'pro') {
                    selectedResponses = [
                        "As someone arguing against this position, I would point out that...",
                        "The counterargument to your point would be that...",
                        "From the opposing perspective, we might argue that...",
                        "Your pro argument is interesting, but consider this con perspective...",
                        "As the opposing side, I would challenge that by saying..."
                    ];
                } else if (selectedSide === 'con') {
                    selectedResponses = [
                        "From the supporting perspective, one might respond that...",
                        "A proponent of this view would likely argue that...",
                        "The supporting argument to your con position would be...",
                        "Your counterargument is noted, but supporters might say...",
                        "As someone taking the opposite position, I would respond with..."
                    ];
                }
                
                const randomResponse = selectedResponses[Math.floor(Math.random() * selectedResponses.length)];
                addAIMessage(randomResponse);
            }, 1500);
        }
    }
    
    // Voice input functionality
    const debateVoiceBtn = document.getElementById('debate-voice-btn');
    const voiceRecordingIndicator = document.getElementById('voice-recording-indicator');
    let recognition;
    let isListening = false;
    let finalTranscript = '';
    
    // Initialize speech recognition
    function initSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            
            recognition.onstart = function() {
                isListening = true;
                debateVoiceBtn.classList.add('listening');
                voiceRecordingIndicator.classList.add('active');
            };
            
            recognition.onend = function() {
                isListening = false;
                debateVoiceBtn.classList.remove('listening');
                voiceRecordingIndicator.classList.remove('active');
                
                // If we have a final transcript, add it to the input
                if (finalTranscript) {
                    debateTextInput.value = finalTranscript;
                    document.getElementById('debate-char-counter').textContent = finalTranscript.length;
                    finalTranscript = '';
                }
            };
            
            recognition.onresult = function(event) {
                let interimTranscript = '';
                finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Show interim results in the input field
                if (interimTranscript) {
                    debateTextInput.value = interimTranscript;
                    document.getElementById('debate-char-counter').textContent = interimTranscript.length;
                }
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                isListening = false;
                debateVoiceBtn.classList.remove('listening');
                voiceRecordingIndicator.classList.remove('active');
                finalTranscript = '';
            };
            
            return true;
        } catch (e) {
            console.error('Speech recognition not supported', e);
            debateVoiceBtn.disabled = true;
            debateVoiceBtn.title = "Voice input not supported in your browser";
            return false;
        }
    }
    
    // Initialize speech synthesis for AI voice
    function initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            return true;
        } else {
            console.warn('Speech synthesis not supported');
            return false;
        }
    }
    
    // Initialize both voice features
    const speechRecognitionSupported = initSpeechRecognition();
    const speechSynthesisSupported = initSpeechSynthesis();
    
    // Voice button event listeners
    if (speechRecognitionSupported) {
        debateVoiceBtn.addEventListener('click', toggleVoiceRecognition);
        
        function toggleVoiceRecognition() {
            if (isListening) {
                recognition.stop();
            } else {
                finalTranscript = '';
                recognition.start();
            }
        }
    }
    
    // Function to speak AI responses
    let synth = window.speechSynthesis;
    let utterance = null;
    
    function speakAIResponse(text) {
        if (speechSynthesisSupported) {
            // Cancel any ongoing speech
            if (synth.speaking) {
                synth.cancel();
            }
            
            // Create a new utterance
            utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to find a good voice
            const voices = synth.getVoices();
            const preferredVoices = voices.filter(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('English') ||
                voice.lang.includes('en')
            );
            
            if (preferredVoices.length > 0) {
                // Use the first preferred voice
                utterance.voice = preferredVoices[0];
            } else if (voices.length > 0) {
                // Fallback to any available voice
                utterance.voice = voices[0];
            }
            
            // Speak the utterance
            synth.speak(utterance);
        }
    }
    
    // End debate button
    document.getElementById('end-debate-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to end this debate? You will receive a performance review.')) {
            clearInterval(debateTimerInterval);
            document.getElementById('debate-interface').classList.remove('active');
            document.getElementById('debate-rating').classList.add('active');
            
            // Stop any ongoing AI speech
            if (synth && synth.speaking) {
                synth.cancel();
            }
        }
    });
    
    // New debate button
    document.getElementById('new-debate-btn').addEventListener('click', () => {
        document.getElementById('debate-rating').classList.remove('active');
        document.getElementById('topic-selector').style.display = 'block';
        document.getElementById('debate-messages').innerHTML = '';
        
        // Reset timer
        clearInterval(debateTimerInterval);
        document.getElementById('debate-timer').textContent = '00:00';
    });
    
    // View details button
    document.getElementById('view-details-btn').addEventListener('click', () => {
        alert('Detailed analysis would be shown here in a full implementation.');
    });
}