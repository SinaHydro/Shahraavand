// =================================================================
// CONFIGURATION 
// =================================================================
// !!! این آدرس را با آدرس Web App خود جایگزین کنید
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOHF5T2NVaPqE-2U_zVfF6-T3NlDRe7JMSxVm3lIWFjr-7bnOozHNLRA_2n1JYOjfx/exec';

// آدرس پایه برای لینک‌دهی به پست‌ها (اگر روی دامنه اصلی است، خالی بگذارید)
// مثال: 'https://shahraavand.ir/BlogP/' یا فقط '/BlogP/'
const POST_BASE_URL = 'https://shahraavand.ir/BlogP/';
// =================================================================


document.addEventListener('DOMContentLoaded', () => {
    // تشخیص اینکه در کدام صفحه هستیم و اجرای تابع مربوطه
    if (document.getElementById('posts-container')) {
        initIndexPage();
    }
    if (document.getElementById('post-content')) {
        initPostPage();
    }
});


/**
 * تابع عمومی برای دریافت داده از گوگل اسکریپت
 */
async function fetchData(action, params = '') {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=${action}${params}`);
        if (!response.ok) throw new Error(`Network response error`);
        const result = await response.json();
        if (result.status === 'success') return result.data;
        throw new Error(result.message || 'Script error');
    } catch (error) {
        console.error('FetchData Error:', error);
        return null;
    }
}


// =================================================================
// INDEX PAGE LOGIC
// =================================================================
async function initIndexPage() {
    const postsContainer = document.getElementById('posts-container');
    const categoriesContainer = document.getElementById('categories-container');
    const posts = await fetchData('getPosts');

    if (posts && Array.isArray(posts)) {
        postsContainer.innerHTML = ''; // پاک کردن لودر
        const categories = new Set();

        posts.forEach(post => {
            const tagsHtml = (post.tags || '').split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('');
            const postLink = `${POST_BASE_URL}${post.postId}.html`;

            const postCard = `
            <div class="post-card">
                <a href="${postLink}" onclick="handlePostClick('${post.postId}'); return false;">
                    <img src="${post.imageUrl}" alt="${post.title}" class="post-card-image">
                </a>
                <div class="post-card-content">
                    <div class="post-card-author">
                        <img src="${post.authorImageUrl}" alt="${post.authorName}">
                        <span>${post.authorName}</span>
                    </div>
                    <a href="${postLink}" onclick="handlePostClick('${post.postId}'); return false;">
                        <h3>${post.title}</h3>
                        <p>${post.description || ''}</p>
                    </a>
                    <div class="post-card-tags">${tagsHtml}</div>
                    <div class="post-card-footer">
                        <div class="stat"><i class="fas fa-clock"></i>${post.readTime} دقیقه</div>
                        <div class="stat"><i class="fas fa-heart"></i>${JSON.parse(post.likes || '[]').length}</div>
                        <div class="stat"><i class="fas fa-eye"></i>${post.clicks || 0}</div>
                    </div>
                </div>
            </div>`;
            postsContainer.innerHTML += postCard;

            if (post.category) categories.add(post.category.trim());
        });

        categories.forEach(cat => {
            categoriesContainer.innerHTML += `<span class="category-chip">${cat}</span>`;
        });

    } else {
        postsContainer.innerHTML = `<p>متاسفانه مشکلی در بارگذاری مطالب پیش آمده است.</p>`;
    }
}


/**
 * مدیریت کلیک روی پست و هدایت به صفحه مربوطه
 */
function handlePostClick(postId) {
    // ارسال درخواست POST برای شمارش کلیک بدون اختلال در ناوبری
    navigator.sendBeacon(`${SCRIPT_URL}`, JSON.stringify({ action: 'incrementClick', slideId: postId }));
    // هدایت کاربر
    window.location.href = `${POST_BASE_URL}${postId}.html`;
}


// =================================================================
// POST PAGE LOGIC
// =================================================================
async function initPostPage() {
    const path = window.location.pathname;
    const postId = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
    const contentContainer = document.getElementById('post-content');

    if (!postId) {
        contentContainer.innerHTML = '<p>شناسه پست نامعتبر است.</p>';
        return;
    }

    const slides = await fetchData('getPostById', `&id=${postId}`);

    if (slides && Array.isArray(slides) && slides.length > 0) {
        const firstSlide = slides[0];
        setupHero(firstSlide);
        renderSlides(slides);
        setupSidebar(slides, firstSlide);
        loadSuggestedPosts(firstSlide.category, postId);
        setupInteractiveFeatures();
    } else {
        contentContainer.innerHTML = `<p>خطا در بارگذاری پست.</p>`;
    }
}

function setupHero(postData) {
    document.title = postData.title;
    const hero = document.getElementById('post-hero');
    hero.style.setProperty('--bg-image', `url(${postData.imageUrl})`);
    document.getElementById('hero-title').textContent = postData.title;
    document.getElementById('hero-subtitle').textContent = postData.subtitle;
    document.getElementById('hero-author').innerHTML = `<i class="fas fa-user"></i> ${postData.authorName}`;
    const date = new Date(postData.publishDate).toLocaleDateString('fa-IR');
    document.getElementById('hero-date').innerHTML = `<i class="fas fa-calendar-alt"></i> ${date}`;
    document.getElementById('hero-read-time').innerHTML = `<i class="fas fa-clock"></i> ${postData.readTime} دقیقه`;
}

function renderSlides(slides) {
    const contentContainer = document.getElementById('post-content');
    contentContainer.innerHTML = ''; // Clear loader
    slides.forEach((slide, index) => {
        const slideHtml = `
            <div class="slide-container" id="slide-${slide.slideId}">
                <div class="slide-header">
                    <div class="slide-author">
                        <img src="${slide.authorImageUrl}" alt="${slide.authorName}">
                        <span>${slide.authorName}</span>
                    </div>
                    <div class="slide-brand">
                        <img src="https://tandis.shahraavand.ir/images/new-TLogo_B.avif" alt="نظام تندیس">
                    </div>
                </div>
                <div class="slide-content">
                    <iframe src="${slide.contentUrl}" loading="lazy" title="محتوای اسلاید" seamless onload="this.style.height = this.contentWindow.document.body.scrollHeight + 'px';"></iframe>
                </div>
                <div class="slide-actions">
                    <div class="main-actions">
                        <i class="far fa-heart" data-action="like"></i>
                        <i class="far fa-comment" data-action="comment"></i>
                        <i class="far fa-paper-plane" data-action="share"></i>
                    </div>
                    <div class="save-action">
                        <i class="far fa-bookmark" data-action="save"></i>
                    </div>
                </div>
                <div class="slide-caption">
                    <div class="caption-text">${slide.description || ''}</div>
                    <button class="more-btn">بیشتر</button>
                    <div class="slide-date">${new Date(slide.publishDate).toLocaleDateString('fa-IR')}</div>
                </div>
            </div>`;
        contentContainer.innerHTML += slideHtml;

        // Add ad banner after every 3 slides
        if ((index + 1) % 3 === 0 && index < slides.length - 1) {
             contentContainer.innerHTML += `
                <div class="environmental-ad">
                    <img src="https://picsum.photos/seed/env${index}/800/200" alt="تبلیغ محیط زیستی">
                </div>`;
        }
    });

    // Add event listeners for "more" buttons
    document.querySelectorAll('.more-btn').forEach(button => {
        const caption = button.previousElementSibling;
        if (caption.scrollHeight <= caption.clientHeight) {
            button.style.display = 'none';
        } else {
            button.addEventListener('click', () => {
                caption.classList.toggle('expanded');
                button.textContent = caption.classList.contains('expanded') ? 'کمتر' : 'بیشتر';
            });
        }
    });
}

function setupSidebar(slides, postData) {
    const tocContainer = document.getElementById('toc-container');
    const tagsContainer = document.getElementById('post-tags');
    tocContainer.innerHTML = '';
    tagsContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        tocContainer.innerHTML += `
            <a href="#slide-${slide.slideId}" data-slide-id="slide-${slide.slideId}">
                <img src="${slide.imageUrl || postData.imageUrl}" alt="Slide ${index + 1}">
                <span>${slide.title || `اسلاید ${index + 1}`}</span>
            </a>`;
    });
    if (postData.tags) {
        postData.tags.split(',').forEach(tag => {
            tagsContainer.innerHTML += `<span class="tag">${tag.trim()}</span>`;
        });
    }
}

async function loadSuggestedPosts(currentCategory, currentPostId) {
    const container = document.getElementById('suggested-posts-container');
    const allPosts = await fetchData('getPosts');
    if (allPosts) {
        const suggested = allPosts.filter(p => p.category === currentCategory && p.postId !== currentPostId).slice(0, 3);
        container.innerHTML = '';
        if (suggested.length > 0) {
            suggested.forEach(post => {
                 container.innerHTML += `
                    <div class="post-card">
                       <a href="${POST_BASE_URL}${post.postId}.html">
                           <img src="${post.imageUrl}" alt="${post.title}" class="post-card-image">
                           <div class="post-card-content"><h3>${post.title}</h3></div>
                       </a>
                    </div>`;
            });
        } else {
            document.querySelector('.suggested-posts-section').style.display = 'none';
        }
    }
}

function setupInteractiveFeatures() {
    const progressBar = document.getElementById('progress-bar');
    const tocLinks = document.querySelectorAll('#toc-container a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                tocLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: "-40% 0px -60% 0px" });

    document.querySelectorAll('.slide-container').forEach(slide => observer.observe(slide));

    window.addEventListener('scroll', () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = `${(window.scrollY / scrollableHeight) * 100}%`;
    }, { passive: true });
}
