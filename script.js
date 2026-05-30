const puller = document.getElementById('theme-puller-container');
const string = document.getElementById('string');
const htmlElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

let isPulling = false;
let startY = 0;
let currentY = 0;
let velocity = 0;
const stiffness = 0.2; 
const damping = 0.75;  
const MAX_PULL = 60;       
let rotation = 0;          
let angularVelocity = 0;   
const angularStiffness = 0.08; 
const angularDamping = 0.95;  

function startPull(e) {
    isPulling = true;
    document.body.classList.add('is-pulling');
    startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    string.style.transition = 'none';
    angularVelocity = 0; 
    velocity = 0;       
    cancelAnimationFrame(animationId);
}

function handleMove(e) {
    if (!isPulling) return;
    
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    let rawDeltaY = clientY - startY;
    
    if (rawDeltaY > 0) {
        e.preventDefault();
        const nextY = Math.min(Math.pow(rawDeltaY, 0.85), MAX_PULL);
        velocity = nextY - currentY;
        currentY = nextY;
        
        puller.style.transform = `translateY(${currentY}px)`;
        
        const stretch = 1 + (currentY / 300);
        const thin = 1 - (currentY / 600);
        string.style.transform = `scale(${thin}, ${stretch})`;
    }
}

let animationId;

function endPull() {
    if (!isPulling) return;
    isPulling = false;
    document.body.classList.remove('is-pulling');
    
    if (currentY > 40) {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    angularVelocity = (velocity * 0.1) + (Math.random() - 0.5) * 2;

    animateSpring();
}

// Mouse Events
puller.addEventListener('mousedown', startPull);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', endPull);

puller.addEventListener('mouseenter', () => {
    if (!isPulling) {
        cancelAnimationFrame(animationId);
        angularVelocity += (Math.random() - 0.5) * 2;
        animateSpring();
    }
});

puller.addEventListener('touchstart', startPull, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', endPull);

function animateSpring() {
    const acceleration = (0 - currentY) * stiffness;
    velocity += acceleration;
    velocity *= damping;
    currentY += velocity;

    const angularAcc = (0 - rotation) * angularStiffness;
    angularVelocity += angularAcc;
    angularVelocity *= angularDamping;
    rotation += angularVelocity;

    puller.style.transform = `translateY(${currentY}px) rotate(${rotation}deg)`;
    
    const stretch = 1 + (currentY / 300);
    const thin = 1 - (currentY / 600);
    string.style.transform = `scale(${thin}, ${stretch})`;

    if (Math.abs(velocity) > 0.01 || Math.abs(currentY) > 0.01 || Math.abs(angularVelocity) > 0.01) {
        animationId = requestAnimationFrame(animateSpring);
    } else {
        currentY = 0;
        velocity = 0;
        rotation = 0;
        angularVelocity = 0;
        puller.style.transform = 'translateY(0) rotate(0deg)';
    }
}

// --- Navigation Highlight Logic ---
const sections = document.querySelectorAll('section, footer');
const navLinks = document.querySelectorAll('.nav-links a');
const navLogo = document.querySelector('.nav-logo');

const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px', 
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href').substring(1) === sectionId);
            });
            navLogo.classList.toggle('active', sectionId === 'main');
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

navLogo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.15 
});

revealElements.forEach(el => revealObserver.observe(el));


const stack = document.getElementById('imageStack');
const cards = Array.from(stack.querySelectorAll('.stack-card'));

let isDraggingStack = false;
let stackStartX = 0;
let stackDeltaX = 0;

function cycleCard(direction = 'right') {
    const topCard = cards.find(card => card.classList.contains('active')) || cards[0];
    if (!topCard || topCard.classList.contains('swiping-left') || topCard.classList.contains('swiping-right')) return;
    
    const swipeClass = direction === 'left' ? 'swiping-left' : 'swiping-right';

    const index = cards.indexOf(topCard);
    cards.splice(index, 1);
    cards.push(topCard);


    topCard.classList.add(swipeClass);
    topCard.classList.remove('active');


    updateStack();

    setTimeout(() => {
        topCard.classList.remove(swipeClass);
    }, 400);
}

function updateStack() {
    cards.forEach((card, i) => {
        card.style.zIndex = -i;
        const offset = i * 15;
        card.style.transform = `translate(${offset}px, ${offset}px)`;
        if (i === 0) card.classList.add('active');
        else card.classList.remove('active');
    });
}

updateStack(); 

function handleDragStart(e) {
    const topCard = cards.find(card => card.classList.contains('active')) || cards[0];
    if (!topCard || topCard.classList.contains('swiping-left') || topCard.classList.contains('swiping-right')) return;

    isDraggingStack = true;
    document.body.classList.add('is-pulling');
    stackStartX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    topCard.style.transition = 'none';
}

function handleDragMove(e) {
    if (!isDraggingStack) return;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    stackDeltaX = clientX - stackStartX;
    
    if (Math.abs(stackDeltaX) > 10 && e.cancelable) {
        e.preventDefault();
    }
    
    const topCard = cards.find(card => card.classList.contains('active')) || cards[0];
    const rotation = stackDeltaX / 10;
    topCard.style.transform = `translate(${stackDeltaX}px, ${-Math.abs(stackDeltaX / 20)}px) rotate(${rotation}deg)`;
}

function handleDragEnd() {
    if (!isDraggingStack) return;
    isDraggingStack = false;
    document.body.classList.remove('is-pulling');
    
    const topCard = cards.find(card => card.classList.contains('active')) || cards[0];
    topCard.style.transition = ''; 

    if (Math.abs(stackDeltaX) > 100) {
        cycleCard(stackDeltaX > 0 ? 'right' : 'left');
    } else {
        updateStack();
    }
    stackDeltaX = 0;
}

stack.addEventListener('mousedown', handleDragStart);
window.addEventListener('mousemove', handleDragMove);
window.addEventListener('mouseup', handleDragEnd);

stack.addEventListener('touchstart', handleDragStart, { passive: true });
window.addEventListener('touchmove', handleDragMove, { passive: false });
window.addEventListener('touchend', handleDragEnd);


const modal = document.getElementById('projectModal');
const modalClose = document.querySelector('.modal-close');
const projectCards = document.querySelectorAll('.project-card');


const projectDetails = {
    "SnapAlert": {
        description: "SnapAlert is a critical emergency response platform available on both web and mobile. It allows users to document emergencies through real-time photo and video capture, automatically notifying authorities to ensure rapid assistance and incident documentation.",
        techStack: [
            { name: "Expo React-native", icon: "fa-brands fa-react" },
            { name: "Supabase", icon: "fa-solid fa-database" },
            { name: "JS", icon: "fa-brands fa-js" }
        ],
        live: "#",
        github: "#"
    },
    "FlexPlanner": {
        description: "FlexPlanner is a comprehensive fitness companion that allows users to explore exercises filtered by target muscle groups. The application provides detailed movement guides while tracking user progress over time and managing nutritional goals through an integrated calorie tracker.",
        techStack: [
            { name: "Kotlin", icon: "fa-solid fa-mobile-screen-button" },
            { name: "Jetpack Compose", icon: "fa-solid fa-layer-group" },
            { name: "SQLite", icon: "fa-solid fa-server" },
            { name: "Supabase", icon: "fa-solid fa-database" }
        ],
        live: "#",
        github: "#"
    },
    "Attendee": {
        description: "A robust attendance monitoring system designed specifically for Medical Representatives. It streamlines task tracking, location monitoring, and daily workflow management to ensure efficiency in the field.",
        techStack: [
            { name: "Kotlin", icon: "fa-solid fa-mobile-screen-button" },
            { name: "Jetpack Compose", icon: "fa-solid fa-layer-group" },
            { name: "Supabase", icon: "fa-solid fa-database" },
            { name: "SQLite", icon: "fa-solid fa-server" },
            { name: "Hostinger", icon: "fa-solid fa-cloud" }
        ],
        live: "#",
        github: "#"
    },
    "Adventures of Eggy": {
        description: "Adventures of Eggy is a physics-based 2D platformer. Players navigate through various obstacles as a fragile egg. The core mechanic revolves around gravity and height: if Eggy jumps or falls from too high a distance, the shell cracks, forcing a level restart. It requires careful movement and strategic jumping.",
        techStack: [
            { name: "Python", icon: "fa-brands fa-python" },
            { name: "Pygame", icon: "fa-solid fa-gamepad" },
            { name: "SQLite", icon: "fa-solid fa-server" }
        ],
        live: "#",
        github: "#"
    }
};

projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const projectId = card.getAttribute('data-project');
        const details = projectDetails[projectId];
        
        if (details) {
            document.getElementById('modalImage').src = card.querySelector('img').src;
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalTitle').innerText = projectId;
            document.getElementById('modalDescription').innerText = details.description;

            const techStackContainer = document.getElementById('modalTechStack');
            techStackContainer.innerHTML = ''; 
            details.techStack.forEach(tech => {
                const tag = document.createElement('div');
                tag.className = 'tech-tag';
                tag.innerHTML = `<i class="${tech.icon}"></i> ${tech.name}`;
                techStackContainer.appendChild(tag);
            });

            const liveLink = document.getElementById('modalLiveLink');
            const githubLink = document.getElementById('modalGithubLink');

   
            liveLink.style.display = (details.live === "#" || !details.live) ? 'none' : 'inline-block';
            liveLink.href = details.live;

            githubLink.style.display = (details.github === "#" || !details.github) ? 'none' : 'inline-block';
            githubLink.href = details.github;
            
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    });
});

function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

modalClose.addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });


const timeline = document.querySelector('.timeline-list');
let isDown = false;
let startX;
let scrollLeft;

timeline.addEventListener('mousedown', (e) => {
    isDown = true;
    timeline.classList.add('grabbing');
    startX = e.pageX - timeline.offsetLeft;
    scrollLeft = timeline.scrollLeft;
});

timeline.addEventListener('mouseleave', () => {
    isDown = false;
});

timeline.addEventListener('mouseup', () => {
    isDown = false;
});

timeline.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - timeline.offsetLeft;
    const walk = (x - startX) * 2; 
    timeline.scrollLeft = scrollLeft - walk;
});


const scrollHint = document.getElementById('scrollHint');
timeline.addEventListener('scroll', () => {
    if (timeline.scrollLeft > 20) {
        scrollHint.style.opacity = '0';
        setTimeout(() => scrollHint.style.display = 'none', 500);
    }
}, { once: true });


const profileWrapper = document.querySelector('.hero-image-wrapper');
const profileImg = document.querySelector('.profile-img');

if (profileWrapper && profileImg) {
    profileWrapper.addEventListener('mousemove', (e) => {
        const rect = profileWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const moveX = (x - centerX) / 25;
        const moveY = (y - centerY) / 25;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        profileWrapper.style.setProperty('--mouse-x', `${xPercent}%`);
        profileWrapper.style.setProperty('--mouse-y', `${yPercent}%`);

        profileImg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
    });

    profileWrapper.addEventListener('mouseleave', () => {
        profileImg.style.transform = `translate(0, 0) scale(1)`;
    });
}


const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const formData = new FormData(this);

        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        try {
            const response = await fetch(this.action, {
                method: "POST",
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                contactForm.style.display = 'none';
                contactSuccess.style.display = 'flex';
            } else {
                const data = await response.json();
                alert(data.error || "Oops! There was a problem submitting your form.");
                submitBtn.disabled = false;
                submitBtn.innerText = 'Send Message';
            }
        } catch (error) {
            alert("Oops! There was a problem connecting to the server.");
            submitBtn.disabled = false;
            submitBtn.innerText = 'Send Message';
        }
    });
}