// =================================================================
// CONFIGURATION 
// =================================================================
// !!! این آدرس را با آدرس Web App خود جایگزین کنید
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyvo19MrduiMREEcxGVp9bSLFNPU5Ri1fnzhdmLyjv5mwk4Is1Fmgi_2B_8WdtwdQKS/exec';

// آدرس پایه برای لینک‌دهی به پست‌ها (اگر روی دامنه اصلی است، خالی بگذارید)
// مثال: 'https://shahraavand.ir/BlogP/' یا فقط '/BlogP/'
const POST_BASE_URL = 'https://shahraavand.ir/'; // خالی بگذارید تا در همان دامنه فعلی باقی بماند
// =================================================================


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
    
    // راه‌اندازی انیمیشن‌های AOS
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
// INDEX PAGE LOGIC
// =================================================================
async function initIndexPage() {
    const postsContainer = document.getElementById('posts-container');
    const categoriesContainer = document.getElementById('categories-container');
    const footerCategories = document.getElementById('footer-categories');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const sortSelect = document.getElementById('sort-select');
    
    let posts = await fetchData('getPosts');
    let displayedPosts = 6; // تعداد پست‌هایی که در ابتدا نمایش داده می‌شوند
    let currentSort = 'newest';

    if (posts && Array.isArray(posts)) {
        // مرتب‌سازی پست‌ها بر اساس گزینه انتخاب شده
        function sortPosts(posts, sortType) {
            const sortedPosts = [...posts];
            switch(sortType) {
                case 'popular':
                    return sortedPosts.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
                case 'liked':
                    return sortedPosts.sort((a, b) => {
                        const aLikes = JSON.parse(a.likes || '[]').length;
                        const bLikes = JSON.parse(b.likes || '[]').length;
                        return bLikes - aLikes;
                    });
                case 'newest':
                default:
                    return sortedPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            }
        }
        
        // نمایش پست‌ها
        function displayPosts(postsToDisplay, append = false) {
            if (!append) {
                postsContainer.innerHTML = ''; // پاک کردن محتوای قبلی
            }
            
            postsToDisplay.forEach(post => {
                const tagsHtml = (post.tags || '').split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('');
                const postLink = `Bpost.html?id=${post.postId}`; // تغییر لینک به صفحه محلی
                const likesCount = JSON.parse(post.likes || '[]').length;

                const postCard = `
                <article class="post-card" data-aos="fade-up">
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
                            <div class="stat"><i class="fas fa-heart"></i>${likesCount}</div>
                            <div class="stat"><i class="fas fa-eye"></i>${post.clicks || 0}</div>
                        </div>
                    </div>
                </article>`;
                
                if (append) {
                    postsContainer.innerHTML += postCard;
                } else {
                    postsContainer.innerHTML = postCard;
                }
            });
            
            // نمایش یا مخفی کردن دکمه "نمایش مطالب بیشتر"
            if (postsContainer.children.length >= posts.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
            
            // راه‌اندازی مجدد انیمیشن‌ها
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }
        
        // نمایش دسته‌بندی‌ها
        function displayCategories() {
            const categories = new Set();
            
            posts.forEach(post => {
                if (post.category) categories.add(post.category.trim());
            });

            categoriesContainer.innerHTML = '';
            footerCategories.innerHTML = '';
            
            categories.forEach(cat => {
                categoriesContainer.innerHTML += `<span class="category-chip">${cat}</span>`;
                footerCategories.innerHTML += `<li><a href="#">${cat}</a></li>`;
            });
        }
        
        // نمایش اولیه پست‌ها و دسته‌بندی‌ها
        displayCategories();
        displayPosts(sortPosts(posts, currentSort).slice(0, displayedPosts));
        
        // رویداد کلیک برای دکمه "نمایش مطالب بیشتر"
        loadMoreBtn.addEventListener('click', () => {
            displayedPosts += 6;
            displayPosts(sortPosts(posts, currentSort).slice(0, displayedPosts), true);
        });
        
        // رویداد تغییر برای مرتب‌سازی
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            displayedPosts = 6;
            displayPosts(sortPosts(posts, currentSort).slice(0, displayedPosts));
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
    // هدایت کاربر به صفحه محلی Bpost.html
    window.location.href = `Bpost.html?id=${postId}`;
}


// =================================================================
// POST PAGE LOGIC
// =================================================================
async function initPostPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const contentContainer = document.getElementById('post-content');

    if (!postId) {
        contentContainer.innerHTML = '<p>شناسه پست نامعتبر است.</p>';
        return;
    }

    const slides = await fetchData('getPostById', `&id=${postId}`);

    if (slides && Array.isArray(slides) && slides.length > 0) {
        const firstSlide = slides[0];
        setupHero(firstSlide);
        await renderSlides(slides);
        setupSidebar(slides, firstSlide);
        setupAuthorInfo(firstSlide);
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

async function renderSlides(slides) {
    const contentContainer = document.getElementById('post-content');
    contentContainer.innerHTML = ''; // Clear loader
    
    for (const slide of slides) {
        try {
            // تعیین نوع محتوا و بارگذاری آن
            let slideContent = '';
            
            if (slide.contentUrl.includes('youtube.com') || slide.contentUrl.includes('youtu.be')) {
                // محتوای ویدیو یوتیوب
                const videoId = slide.contentUrl.includes('youtu.be') 
                    ? slide.contentUrl.split('/').pop() 
                    : new URLSearchParams(slide.contentUrl.split('?')[1]).get('v');
                    
                slideContent = `
                    <div class="slide-content">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="https://www.youtube.com/embed/${videoId}" 
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>`;
            } else if (slide.contentUrl.includes('.jpg') || slide.contentUrl.includes('.jpeg') || slide.contentUrl.includes('.png') || slide.contentUrl.includes('.webp')) {
                // محتوای گالری تصاویر
                slideContent = `
                    <div class="slide-gallery">
                        <img src="${slide.contentUrl}" alt="${slide.title}" class="slide-image active">
                    </div>`;
            } else {
                // محتوای وب پیج - بارگذاری از لینک خارجی
                try {
                    const response = await fetch(slide.contentUrl);
                    if (!response.ok) throw new Error('Failed to load content');
                    
                    const htmlContent = await response.text();
                    
                    // ایجاد یک div برای نمایش محتوای HTML به جای iframe
                    slideContent = `
                        <div class="slide-content html-content">
                            ${htmlContent}
                        </div>`;
                } catch (error) {
                    console.error('Error loading slide content:', error);
                    slideContent = `
                        <div class="slide-content">
                            <div style="padding: 20px; text-align: center; color: red;">
                                خطا در بارگذاری محتوای اسلاید
                            </div>
                        </div>`;
                }
            }
            
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
                    ${slideContent}
                    <div class="slide-actions">
                        <div class="main-actions">
                            <i class="far fa-heart" data-action="like" data-slide-id="${slide.slideId}"></i>
                            <i class="far fa-comment" data-action="comment" data-slide-id="${slide.slideId}"></i>
                            <i class="far fa-paper-plane" data-action="share" data-slide-id="${slide.slideId}"></i>
                        </div>
                        <div class="save-action">
                            <i class="far fa-bookmark" data-action="save" data-slide-id="${slide.slideId}"></i>
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
            if ((slides.indexOf(slide) + 1) % 3 === 0 && slides.indexOf(slide) < slides.length - 1) {
                 contentContainer.innerHTML += `
                    <div class="environmental-ad">
                        <h3>محیط زیست ما، مسئولیت ما</h3>
                        <p>با استفاده از مصالح پایدار و روش‌های سازگار با محیط زیست، به آینده زمین احترام بگذاریم.</p>
                        <img src="https://picsum.photos/seed/env${slides.indexOf(slide)}/800/200" alt="تبلیغ محیط زیستی">
                    </div>`;
            }
        } catch (error) {
            console.error('Error rendering slide:', error);
            contentContainer.innerHTML += `
                <div class="slide-container">
                    <div class="slide-content">
                        <div style="padding: 20px; text-align: center; color: red;">
                            خطا در بارگذاری اسلاید
                        </div>
                    </div>
                </div>`;
        }
    }

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
    
    // Add event listeners for action buttons
    document.querySelectorAll('.slide-actions i').forEach(icon => {
        icon.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const slideId = this.getAttribute('data-slide-id');
            
            switch(action) {
                case 'like':
                    this.classList.toggle('fas');
                    this.classList.toggle('far');
                    this.classList.toggle('liked');
                    // ارسال درخواست به سرور برای ثبت لایک
                    sendActionToServer('toggleLike', { slideId });
                    break;
                case 'save':
                    this.classList.toggle('fas');
                    this.classList.toggle('far');
                    this.classList.toggle('saved');
                    // ارسال درخواست به سرور برای ثبت ذخیره
                    sendActionToServer('toggleSave', { slideId });
                    break;
                case 'share':
                    // اشتراک گذاری اسلاید
                    const url = window.location.href;
                    if (navigator.share) {
                        navigator.share({
                            title: document.title,
                            url: url
                        });
                    } else {
                        // کپی کردن لینک به کلیپ بورد
                        navigator.clipboard.writeText(url).then(() => {
                            alert('لینک با موفقیت کپی شد!');
                        });
                    }
                    break;
                case 'comment':
                    // نمایش بخش نظرات
                    showCommentSection(slideId);
                    break;
            }
        });
    });
    
    // تنظیم ارتفاع iframe‌ها پس از بارگذاری
    setTimeout(() => {
        adjustIframeHeights();
    }, 1000);
}

/**
 * تنظیم ارتفاع iframe‌ها بر اساس محتوای آنها
 */
function adjustIframeHeights() {
    document.querySelectorAll('.slide-content iframe').forEach(iframe => {
        try {
            // تلاش برای تنظیم ارتفاع iframe بر اساس محتوای آن
            iframe.onload = function() {
                try {
                    // اگر iframe به محتوای همان دامنه دسترسی دارد
                    const iframeHeight = iframe.contentWindow.document.body.scrollHeight;
                    iframe.style.height = iframeHeight + 'px';
                } catch (e) {
                    // اگر iframe به محتوای خارجی دسترسی ندارد، ارتفاع را بر اساس viewport تنظیم می‌کنیم
                    const viewportHeight = window.innerHeight * 0.7; // 70% ارتفاع viewport
                    iframe.style.height = Math.max(400, viewportHeight) + 'px';
                }
            };
            
            // اگر iframe از قبل بارگذاری شده است
            if (iframe.contentWindow && iframe.contentWindow.document.body) {
                const iframeHeight = iframe.contentWindow.document.body.scrollHeight;
                iframe.style.height = iframeHeight + 'px';
            }
        } catch (e) {
            console.error('Error adjusting iframe height:', e);
        }
    });
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
                    <article class="post-card" data-aos="fade-up">
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
        
        // راه‌اندازی مجدد انیمیشن‌ها
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
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
        const scrolled = window.scrollY;
        progressBar.style.width = `${(scrolled / scrollableHeight) * 100}%`;
    }, { passive: true });
}

/**
 * نمایش بخش نظرات
 */
function showCommentSection(slideId) {
    // ایجاد یک مدال برای نمایش نظرات
    const modal = document.createElement('div');
    modal.className = 'comment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>نظرات</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="comments-list" id="comments-${slideId}">
                    <!-- نظرات از سرور بارگذاری می شوند -->
                    <p>در حال بارگذاری نظرات...</p>
                </div>
                <div class="add-comment">
                    <h4>افزودن نظر</h4>
                    <textarea id="comment-text-${slideId}" placeholder="نظر خود را بنویسید..."></textarea>
                    <button onclick="submitComment('${slideId}')">ارسال نظر</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // بستن مدال
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // بارگذاری نظرات از سرور
    loadComments(slideId);
}

/**
 * بارگذاری نظرات از سرور
 */
async function loadComments(slideId) {
    const commentsContainer = document.getElementById(`comments-${slideId}`);
    
    try {
        const comments = await fetchData('getComments', `&slideId=${slideId}`);
        
        if (comments && comments.length > 0) {
            commentsContainer.innerHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-header">
                        <img src="${comment.userImage || 'https://via.placeholder.com/40'}" alt="${comment.userName}">
                        <div>
                            <span class="comment-author">${comment.userName}</span>
                            <span class="comment-date">${new Date(comment.date).toLocaleDateString('fa-IR')}</span>
                        </div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `).join('');
        } else {
            commentsContainer.innerHTML = '<p>هیچ نظری ثبت نشده است.</p>';
        }
    } catch (error) {
        commentsContainer.innerHTML = '<p>خطا در بارگذاری نظرات.</p>';
    }
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
            userImage: 'https://via.placeholder.com/40' // در نسخه واقعی، تصویر کاربر لاگین شده را ارسال کنید
        });
        
        if (result) {
            alert('نظر شما با موفقیت ثبت شد.');
            document.getElementById(`comment-text-${slideId}`).value = '';
            loadComments(slideId); // بارگذاری مجدد نظرات
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
            body: JSON.stringify({ action, ...data })
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
