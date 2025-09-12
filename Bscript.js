// =================================================================
// CONFIGURATION 
// =================================================================
// !!! این آدرس را با آدرس Web App خود جایگزین کنید
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQPkfaYzV6lIfOAQFtXjji6Xa1yqpQGVR_AWkg7JXwsTGzxe8q796IdhCs4X0rggwJ/exec';

// آدرس پایه برای لینک‌دهی به پست‌ها
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
 * @param {string} action - نام اکشن (مثلا getPosts)
 * @param {string} params - پارامترهای اضافی برای URL
 * @returns {Promise<Array|null>} - داده‌های دریافت شده یا null در صورت خطا
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
            // ساخت HTML برای تگ‌ها
            const tagsHtml = (post.tags || '')
                .split(',')
                .map(tag => `<span class="tag">${tag.trim()}</span>`)
                .join('');
            
            // لینک به پست با فرمت جدید
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
                        <p>${post.description}</p>
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
 * @param {string} postId - شناسه پست
 */
function handlePostClick(postId) {
    // افزایش شمارنده کلیک در بک‌اند (ارسال بدون انتظار پاسخ)
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'incrementClick', slideId: postId })
    });
    
    // هدایت کاربر به صفحه پست
    window.location.href = `${POST_BASE_URL}${postId}.html`;
}


// =================================================================
// POST PAGE LOGIC
// =================================================================
async function initPostPage() {
    // استخراج شناسه پست از URL صفحه
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
    slides.forEach((slide) => {
        const slideHtml = `
            <div class="slide-container" id="slide-${slide.slideId}">
                <div class="slide-header">
                    <div class="slide-author">
                        <img src="${slide.authorImageUrl}" alt="${slide.authorName}">
                        <span>${slide.authorName}</span>
                    </div>
                    <div class="slide-brand">
                        <img src="https://via.placeholder.com/120x40.png?text=NezamTandis" alt="نظام تندیس">
                    </div>
                </div>
                <div class="slide-content">
                    <iframe src="${slide.contentUrl}" loading="lazy" title="محتوای اسلاید" seamless></iframe>
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
                    <p>${slide.description || ''}</p>
                    <div class="slide-date">${new Date(slide.publishDate).toLocaleDateString('fa-IR')}</div>
                </div>
            </div>`;
        contentContainer.innerHTML += slideHtml;
    });
}

function setupSidebar(slides, postData) {
    const tocContainer = document.getElementById('toc-container');
    const tagsContainer = document.getElementById('post-tags');
    tocContainer.innerHTML = '';
    tagsContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        tocContainer.innerHTML += `
            <a href="#slide-${slide.slideId}">
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
    window.addEventListener('scroll', () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = `${(window.scrollY / scrollableHeight) * 100}%`;
    }, { passive: true });
}
