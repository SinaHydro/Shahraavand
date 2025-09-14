// =================================================================
// CONFIGURATION 
// =================================================================
// !!! این آدرس را با آدرس Web App خود جایگزین کنید
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvo19MrduiMREEcxGVp9bSLFNPU5Ri1fnzhdmLyjv5mwk4Is1Fmgi_2B_8WdtwdQKS/exec';
// آدرس پایه برای لینک‌دهی به پست‌ها (اگر روی دامنه اصلی است، خالی بگذارید)
// مثال: 'https://shahraavand.ir/BlogP/' یا فقط '/BlogP/'
const POST_BASE_URL = 'https://shahraavand.ir/'; // خالی بگذارید تا در همان دامنه فعلی باقی بماند
// =================================================================

function formatReadTime(totalSeconds) {
    if (!totalSeconds || totalSeconds < 1) return 'نامشخص';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    let timeString = '';
    if (minutes > 0) {
        timeString += `${minutes} دقیقه`;
    }
    if (seconds > 0) {
        if (timeString.length > 0) {
            timeString += ' و ';
        }
        timeString += `${seconds} ثانیه`;
    }
    return timeString;
}

document.addEventListener('DOMContentLoaded', () => {
    // تشخیص اینکه در کدام صفحه هستیم و اجرای تابع مربوطه
    if (document.getElementById('posts-container')) {
        initIndexPage();
    }
    if (document.getElementById('post-content')) {
        initPostPage();
    }

    // راه‌اندازی آیکون‌های فدر
    if (typeof feather !== 'undefined') {
        feather.replace();
    }


    // راه‌اندازی انیمیشن‌های AOS [cite: 339]
    if (typeof AOS !== 'undefined') {
        AOS.init();
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
// DATA FETCHING
// =================================================================
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
    const footerCategories = document.getElementById('footer-categories');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const sortSelect = document.getElementById('sort-select');

    const allPosts = await fetchData('getPosts');
    if (!allPosts || !Array.isArray(allPosts)) {
        postsContainer.innerHTML = `<p>متاسفانه مشکلی در بارگذاری مطالب پیش آمده است.</p>`;
        return;
    }

    let displayedPostsCount = 6;
    let currentSort = 'newest';
    let currentCategory = 'all';

    function sortPosts(posts) {
        const sorted = [...posts];
        switch (currentSort) {
            case 'popular': return sorted.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
            case 'liked': return sorted.sort((a, b) => (JSON.parse(b.likes || '[]').length) - (JSON.parse(a.likes || '[]').length));
            default: return sorted.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        }
    }

    function renderPosts() {
        let postsToFilter = currentCategory === 'all' ? allPosts : allPosts.filter(p => p.category === currentCategory);
        const sortedPosts = sortPosts(postsToFilter);
        const postsToDisplay = sortedPosts.slice(0, displayedPostsCount);

        postsContainer.innerHTML = postsToDisplay.map(post => {
            const tagsHtml = (post.tags || '').split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('');
            const postLink = `Bpost.html?id=${post.postId}`;
            const likesCount = JSON.parse(post.likes || '[]').length;
            return `
                <article class="post-card">
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
                            <div class="action-item"><i class="far fa-clock"></i><span>${formatReadTime(post.readTime)}</span></div>
                            <div class="action-item"><i class="far fa-heart"></i><span>${likesCount}</span></div>
                            <div class="action-item"><i class="far fa-eye"></i><span>${post.clicks || 0}</span></div>
                        </div>
                    </div>
                </article>`;
        }).join('');

        loadMoreBtn.style.display = displayedPostsCount >= sortedPosts.length ? 'none' : 'block';
    }

    function setupCategories() {
        const categories = ['همه', ...new Set(allPosts.map(p => p.category).filter(Boolean))];
        categoriesContainer.innerHTML = categories.map(cat => `<span class="category-chip ${cat === 'همه' ? 'active' : ''}">${cat}</span>`).join('');
        footerCategories.innerHTML = categories.slice(1).map(cat => `<li><a href="#">${cat}</a></li>`).join('');

        categoriesContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                categoriesContainer.querySelector('.active')?.classList.remove('active');
                chip.classList.add('active');
                currentCategory = chip.textContent === 'همه' ? 'all' : chip.textContent;
                displayedPostsCount = 6;
                renderPosts();
            });
        });
    }

    loadMoreBtn.addEventListener('click', () => {
        displayedPostsCount += 6;
        renderPosts();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderPosts();
    });

    setupCategories();
    renderPosts();
}


/**
 * مدیریت کلیک روی پست و هدایت به صفحه مربوطه
 */
function handlePostClick(postId) {
    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(SCRIPT_URL, JSON.stringify({ action: 'incrementClick', slideId: postId }));
        } else {
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'incrementClick', slideId: postId }), keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        }
    } catch (e) { console.error("Could not send beacon", e); }
    window.location.href = `Bpost.html?id=${postId}`;
}


// =================================================================
// POST PAGE LOGIC
// =================================================================
async function initPostPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const contentContainer = document.getElementById('post-content');
    if (!postId) { contentContainer.innerHTML = '<p>شناسه پست نامعتبر است.</p>'; return; }

    const slides = await fetchData('getPostById', `&id=${postId}`);
    if (slides && slides.length > 0) {
        const firstSlide = slides[0];
        setupHero(firstSlide);
        renderSlides(slides);
        setupSidebar(slides, firstSlide);
        setupAuthorInfo(firstSlide);
        loadSuggestedPosts(firstSlide.category, postId);
        setupInteractiveFeatures();
    } else {
        contentContainer.innerHTML = `<p>خطا در بارگذاری پست.</p>`;
    }
}

function renderSlides(slides) {
    const contentContainer = document.getElementById('post-content');
    contentContainer.innerHTML = slides.map((slide, index) => {
        // این بخش برای تبلیغات است
        const adHtml = (index + 1) % 3 === 0 && index < slides.length - 1
            ? `
                <div class="in-post-ad-container">
                    <div class="in-post-ad">
                        <img src="https://tandis.shahraavand.ir/images/new-TLogo_B.avif" alt="لوگو نظام تندیس">
                        <div>
                            <h4>نظام تندیس</h4>
                            <p>پلتفرم ارتباط هوشمند مهندسان و کارفرمایان خصوصی</p>
                        </div>
                    </div>
                    <div class="in-post-ad">
                        <img src="https://tandis.shahraavand.ir/images/new-TLogo_B.avif" alt="لوگو نظام تندیس">
                        <div>
                            <h4>نظام تندیس</h4>
                            <p>تدارک نیازمندی دقیق و یکپارچه ساختمان</p>
                        </div>
                    </div>
                </div>
            `
            : '';

        return `
            <div class="slide-container" id="slide-${slide.slideId}">
                <div class="slide-header">
                    <div class="slide-author"><img src="${slide.authorImageUrl}" alt="${slide.authorName}"><span>${slide.authorName}</span></div>
                    <div class="slide-brand"><img src="https://shahraavand.ir/images/logoT.png" alt="لوگو شركت مهندسين مشاور شهرآوند"><span>وبلاگ شركت شهرآوند</span></div>
                </div>
                <div class="slide-content-wrapper">
                    <iframe src="${slide.contentUrl}" scrolling="no" loading="lazy" title="${slide.title || 'Slide Content'}" onload="adjustSlideScaling(this)"></iframe>
                </div>
                <div class="slide-actions">
                    <div class="main-actions">
                        <div class="action-item">
                            <i class="far fa-heart" data-action="like" data-slide-id="${slide.slideId}"></i>
                            <span>${slide.clicks || 0}</span>
                        </div>
                        <div class="action-item">
                            <i class="far fa-comment" data-action="comment" data-slide-id="${slide.slideId}"></i>
                            <span id="comment-count-${slide.slideId}">${slide.comments || 0}</span>
                        </div>
                        <div class="action-item">
                            <i class="far fa-paper-plane" data-action="share" data-slide-id="${slide.slideId}"></i>
                            <span>${slide.shares || 0}</span>
                        </div>
                    </div>
                    <div><i class="far fa-bookmark" data-action="save" data-slide-id="${slide.slideId}"></i></div>
                </div>
                <div class="slide-caption">
                    <div class="caption-text">${slide.description || ''}</div>
                    <button class="more-btn">بیشتر</button>
                    <div class="slide-date">${new Date(slide.publishDate).toLocaleDateString('fa-IR')}</div>
                </div>
                <div class="inline-comment-section" id="comment-section-${slide.slideId}" style="display: none;">
                   <div class="comments-list" id="comments-list-${slide.slideId}"></div>
                   <div class="add-comment">
                       <h4>نظر خود را بنویسید:</h4>
                       <textarea id="comment-text-${slide.slideId}" placeholder="..."></textarea>
                       <button onclick="submitComment('${slide.slideId}')">ارسال نظر</button>
                   </div>
                </div>
            </div>
            ${adHtml}
        `;
    }).join('');
    setupSlideInteractions();
}

function adjustSlideScaling(iframe) {
    const originalWidth = 1280;
    const wrapper = iframe.parentElement;
    if (!wrapper) return;
    try {
        const contentHeight = iframe.contentWindow.document.body.scrollHeight;
        iframe.style.height = `${contentHeight}px`;

        const containerWidth = wrapper.offsetWidth;
        const scale = containerWidth / originalWidth;

        iframe.style.transform = `scale(${scale})`;
        wrapper.style.height = `${contentHeight * scale}px`;
    } catch (e) {
        console.warn("Could not access iframe content for scaling.", e);
        wrapper.style.height = `${(wrapper.offsetWidth / 16) * 9}px`;
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => document.querySelectorAll('.slide-content-wrapper iframe').forEach(adjustSlideScaling), 150);
});

function setupSlideInteractions() {
    document.querySelectorAll('.slide-actions i[data-action]').forEach(icon => {
        icon.addEventListener('click', function() {
            const action = this.dataset.action;
            const slideId = this.dataset.slideId;

            if (action === 'like' || action === 'save') {
                this.classList.toggle('fas'); // Toggle solid icon
                this.classList.toggle('far'); // Toggle regular icon
                // اینجا می‌توانید کد مربوط به ارسال لایک/ذخیره به سرور را اضافه کنید
            } else if (action === 'comment') {
                toggleCommentSection(slideId);
            }
        });
    });

    // این بخش برای دکمه "بیشتر" در کپشن است و باید باقی بماند
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

function toggleCommentSection(slideId) {
    const commentSection = document.getElementById(`comment-section-${slideId}`);
    const commentsList = document.getElementById(`comments-list-${slideId}`);
    const isVisible = commentSection.style.display === 'block';

    if (isVisible) {
        commentSection.style.display = 'none';
    } else {
        commentSection.style.display = 'block';
        // فقط در صورتی که نظرات قبلاً بارگذاری نشده‌اند، آن‌ها را از سرور بگیر
        if (!commentsList.hasAttribute('data-loaded')) {
            loadComments(slideId);
            commentsList.setAttribute('data-loaded', 'true');
        }
    }
}
async function loadComments(slideId) {
    const commentsContainer = document.getElementById(`comments-list-${slideId}`);
    commentsContainer.innerHTML = '<p>در حال بارگذاری نظرات...</p>'; // نمایش پیام لودینگ
    try {
        const comments = await fetchData('getComments', `&slideId=${slideId}`);
        if (comments && comments.length > 0) {
            // نمایش حداکثر ۳ نظر اول
            commentsContainer.innerHTML = comments.slice(0, 3).map(comment => `
                <div class="comment">
                    <div class="comment-header">
                        <img src="${comment.userImage || 'https://shahraavand.ir/images/imgProfileR.avif'}" alt="${comment.userName}">
                        <div>
                            <span class="comment-author">${comment.userName}</span>
                            <span class="comment-date">${new Date(comment.date).toLocaleDateString('fa-IR')}</span>
                        </div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `).join('');
            if (comments.length > 3) {
                commentsContainer.innerHTML += `<a href="#" class="more-comments-link">مشاهده همه ${comments.length} نظر</a>`;
            }
        } else {
            commentsContainer.innerHTML = '<p>هنوز نظری ثبت نشده است. شما اولین نفر باشید!</p>';
        }
    } catch (error) {
        commentsContainer.innerHTML = '<p>خطا در بارگذاری نظرات.</p>';
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
    document.getElementById('hero-read-time').innerHTML = `<i class="fas fa-clock"></i> ${formatReadTime(postData.readTime)}`;
}

function setupSidebar(slides, postData) {
    const tocContainer = document.getElementById('toc-container');
    const tagsContainer = document.getElementById('post-tags');
    tocContainer.innerHTML = '';
    tagsContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        const thumbnail = slide.imageUrl || postData.imageUrl;
        tocContainer.innerHTML += `
            <a href="#slide-${slide.slideId}" data-slide-id="slide-${slide.slideId}">
                <img src="${thumbnail}" alt="Slide ${index + 1}">
                <span>${slide.title || `اسلاید ${index + 1}`}</span>
            </a>`;
    });
    
    if (postData.tags) {
        postData.tags.split(',').forEach(tag => {
            tagsContainer.innerHTML += `<span class="tag">${tag.trim()}</span>`;
        });
    }
}

function setupAuthorInfo(postData) {
    const authorInfo = document.getElementById('author-info');
    authorInfo.innerHTML = `
        <img src="${postData.authorImageUrl}" alt="${postData.authorName}">
        <div>
            <h4>${postData.authorName}</h4>
            <p>نویسنده تخصصی در حوزه ساختمان</p>
        </div>
    `;
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
                    <article class="post-card">
                       <a href="Bpost.html?id=${post.postId}" onclick="handlePostClick('${post.postId}'); return false;">
                            <img src="${post.imageUrl}" alt="${post.title}" class="post-card-image">
                           <div class="post-card-content">
                               <h3>${post.title}</h3>
                               <div class="post-card-footer">
                                   <div class="stat"><i class="fas fa-clock"></i>${post.readTime} دقیقه</div>
                                   <div class="stat"><i class="fas fa-heart"></i>${JSON.parse(post.likes || '[]').length}</div>
                               </div>
                           </div>
                       </a>
                    </article>`;
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
/**
 * ارسال نظر به سرور
 */
async function submitComment(slideId) {
    const commentText = document.getElementById(`comment-text-${slideId}`).value.trim();
    if (!commentText) {
        alert('لطفاً متن نظر خود را وارد کنید.');
        return;
    }

    try {
        const result = await sendActionToServer('addComment', {
            slideId,
            text: commentText,
            userId: 'anonymous', // در نسخه واقعی، شناسه کاربر لاگین شده را ارسال کنید
            userName: 'کاربر مهمان', // در نسخه واقعی، نام کاربر لاگین شده را ارسال کنید
            userImage: 'https://shahraavand.ir/images/imgProfileR.avif' // در نسخه واقعی، تصویر کاربر لاگین شده را ارسال کنید
        });
        if (result) {
            alert('نظر شما با موفقیت ثبت شد.');
            document.getElementById(`comment-text-${slideId}`).value = '';
            loadComments(slideId); // بارگذاری مجدد نظرات
            const countSpan = document.getElementById(`comment-count-${slideId}`);
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        } else {
            alert('خطا در ثبت نظر.');
        }
    } catch (error) {
        alert('خطا در ثبت نظر.');
    }
}

/**
 * ارسال اکشن به سرور
 */
async function sendActionToServer(action, data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action,
                ...data
            })
        });
        if (!response.ok) throw new Error('Network response error');

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Action failed');
        }

        return result.data;
    } catch (error) {
        console.error('Action Error:', error);
        return null;
    }
}
