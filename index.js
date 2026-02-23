const SUPABASE_URL = 'https://hdubheficnczadkiggoa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWJoZWZpY25jemFka2lnZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzUxNjQsImV4cCI6MjA4MDAxMTE2NH0.0WvZeIdVpkU6YM2SofO1RIrvOks21PgwdJ_MsNp7Fuk';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const postsContainer = document.getElementById('posts-container');

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'app.html';
    } else {
        loadPosts(session.user.id);
    }
}

async function loadPosts(currentUserId) {
    // Select posts and include user's like status
    let { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*, likes_table:likes(user_id)')
        .order('created_at', { ascending: false });

    if (error) {
        postsContainer.innerHTML = "<p style='color:white;'>Error loading vibes.</p>";
    } else {
        displayPosts(posts, currentUserId);
    }
}

function displayPosts(postsData, currentUserId) {
    postsContainer.innerHTML = '';

    postsData.forEach(post => {
        // 1. Post Image Logic
        let finalImageUrl = "";
        const rawPath = post.img_url || post.image_url;
        if (rawPath) {
            const cleanFileName = rawPath.trim().includes('/') ? rawPath.split('/').pop() : rawPath.trim();
            finalImageUrl = `${SUPABASE_URL}/storage/v1/object/public/post_images/${encodeURIComponent(cleanFileName)}`;
        } else {
            finalImageUrl = 'https://placehold.co/400x400?text=No+Image';
        }

        // 2. Profile DP Logic (vibe spot dp column)
        let userDpUrl = "";
        if (post['vibe spot dp']) {
            let dpFileName = post['vibe spot dp'].trim();
            if (dpFileName.includes('/')) dpFileName = dpFileName.split('/').pop();
            userDpUrl = `${SUPABASE_URL}/storage/v1/object/public/vibe%20spot%20dp/${encodeURIComponent(dpFileName)}`;
        } else {
            userDpUrl = `https://ui-avatars.com/api/?name=${post.username || 'V'}&background=a80077&color=fff`;
        }

        // 3. Like State Logic
        const isAlreadyLiked = post.likes_table?.some(l => l.user_id === currentUserId);
        const heartClass = isAlreadyLiked ? 'fas' : 'far';
        const heartColor = isAlreadyLiked ? '#ff3040' : '#262626';

        const div = document.createElement('div');
        div.className = 'post-card';
        div.style.maxWidth = "400px";
        div.style.margin = "0 auto 20px auto";
        div.style.background = "white";
        div.style.borderRadius = "8px";
        div.style.overflow = "hidden";
        div.style.border = "1px solid #dbdbdb";

        div.innerHTML = `
            <div class="post-header" style="padding: 8px 12px; display: flex; align-items: center; border-bottom: 1px solid #efefef;">
                <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; overflow:hidden; border: 1px solid #eee;">
                    <img src="${userDpUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=V&background=ddd'">
                </div>
                <strong style="font-size: 14px; color:#262626">${post.username || post.user_name || 'viber'}</strong>
            </div>
            
            <div class="post-img-container" style="width: 100%; aspect-ratio: 1/1; background: #fafafa;">
                <img src="${finalImageUrl}" 
                     style="width: 100%; height: 100%; object-fit: cover; display: block;"
                     onerror="this.src='https://placehold.co/400x400?text=File+Not+Found'">
            </div>

            <div class="post-footer" style="padding: 10px 12px; background: #fff;">
                <div class="post-actions" style="margin-bottom: 6px; display: flex; gap: 12px;">
                    <i class="${heartClass} fa-heart like-btn" data-id="${post.id}" 
                       style="cursor:pointer; font-size: 22px; color: ${heartColor}; transition: 0.2s;"></i>
                    <i class="far fa-comment" style="font-size: 22px; cursor: pointer; color: #262626;"></i>
                </div>
                <div id="likes-count-${post.id}" style="font-weight: bold; font-size: 13px; color: #262626;">
                    ${post.likes || 0} likes
                </div>
                <div class="caption" style="font-size: 13px; margin-top: 4px; color: #262626;">
                    <strong style="margin-right: 4px;">${post.username || post.user_name || 'user'}</strong> 
                    <span>${post.description || ''}</span>
                </div>
            </div>
        `;
        postsContainer.append(div);

        const likeBtn = div.querySelector('.like-btn');
        likeBtn.onclick = () => handleLike(post.id, likeBtn);
    });
}

async function handleLike(postId, btnElement) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Please login to like!");

    const isLiked = btnElement.classList.contains('fas');
    const likesCountElem = document.getElementById(`likes-count-${postId}`);
    let currentUIStoreLikes = parseInt(likesCountElem.innerText);

    if (!isLiked) {
        // LIKE Logic
        btnElement.classList.replace('far', 'fas');
        btnElement.style.color = '#ff3040';
        likesCountElem.innerText = `${currentUIStoreLikes + 1} likes`;

        await supabaseClient.from('likes').insert({ user_id: user.id, post_id: postId });
        const { data: pData } = await supabaseClient.from('posts').select('likes').eq('id', postId).single();
        await supabaseClient.from('posts').update({ likes: (pData.likes || 0) + 1 }).eq('id', postId);
    } else {
        // UNLIKE Logic
        btnElement.classList.replace('fas', 'far');
        btnElement.style.color = '#262626';
        likesCountElem.innerText = `${Math.max(0, currentUIStoreLikes - 1)} likes`;

        await supabaseClient.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
        const { data: pData } = await supabaseClient.from('posts').select('likes').eq('id', postId).single();
        await supabaseClient.from('posts').update({ likes: Math.max(0, (pData.likes || 0) - 1) }).eq('id', postId);
    }
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'app.html';
    };
}

checkSession();