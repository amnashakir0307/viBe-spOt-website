const SUPABASE_URL = 'https://hdubheficnczadkiggoa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWJoZWZpY25jemFka2lnZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzUxNjQsImV4cCI6MjA4MDAxMTE2NH0.0WvZeIdVpkU6YM2SofO1RIrvOks21PgwdJ_MsNp7Fuk';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const postsGrid = document.getElementById('user-posts-grid');
let loggedInUser = null;

async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }
    loggedInUser = session.user;
    loadProfileData();
    loadPosts();
}

// 1. Profile Data (Username & DP Fix)
async function loadProfileData() {
    try {
        // Schema ke mutabiq space wala column handle kiya
        let { data: profile } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .not('"vibe spot dp"', 'is', null) 
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const defaultName = loggedInUser.email.split('@')[0];
        document.getElementById('profile-username').innerText = profile?.username || profile?.user_name || defaultName;
        document.getElementById('profile-bio').innerText = profile?.description || "Welcome to my vibe! ✨";

        const dpElement = document.getElementById('display-profile-pic');
        
        if (profile && profile['vibe spot dp']) {
            let fileName = profile['vibe spot dp'].trim();
            // Path cleanup
            if (fileName.includes('/')) fileName = fileName.split('/').pop();
            
            // DP Bucket: 'vibe spot dp'
            const fullDpUrl = `${SUPABASE_URL}/storage/v1/object/public/vibe%20spot%20dp/${encodeURIComponent(fileName)}`;
            dpElement.src = fullDpUrl + '?t=' + new Date().getTime();
        } else {
            dpElement.src = `https://ui-avatars.com/api/?name=${defaultName}&background=a80077&color=fff`;
        }
    } catch (err) { console.error("DP Error:", err); }
}

// 2. Posts Grid Fix
async function loadPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('user_id', loggedInUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        postsGrid.innerHTML = '';
        let count = 0;

        posts.forEach(post => {
            if (post.img_url) {
                let cleanFileName = post.img_url.trim();
                if (cleanFileName.includes('/')) cleanFileName = cleanFileName.split('/').pop();

                // Post Bucket: 'post_images'
                const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/post_images/${encodeURIComponent(cleanFileName)}`;
                
                count++;
                const div = document.createElement('div');
                div.className = 'grid-item';
                div.innerHTML = `
                    <img src="${imageUrl}" 
                         style="width:100%; height:100%; object-fit:cover;"
                         onerror="this.src='https://placehold.co/300x300/white/a80077?text=Object+Not+Found'">
                    <div class="grid-overlay">
                        <button class="overlay-btn delete-btn" onclick="deletePost('${post.id}', '${cleanFileName}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                postsGrid.appendChild(div);
            }
        });
        document.getElementById('post-count').innerText = count;
    } catch (err) { console.error("Posts Error:", err); }
}

// 3. Delete Post
window.deletePost = async function(postId, filePath) {
    const result = await Swal.fire({ title: 'Delete Vibe?', showCancelButton: true, confirmButtonText: 'Delete' });
    if (result.isConfirmed) {
        await supabaseClient.from('posts').delete().eq('id', postId);
        await supabaseClient.storage.from('post_images').remove([filePath]);
        loadPosts();
    }
}

// 4. DP Update
document.getElementById('dp-input').onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Updating DP...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const fileName = `avatar_${loggedInUser.id}_${Date.now()}`;
    
    // Upload to 'vibe spot dp' bucket
    const { error: uploadError } = await supabaseClient.storage
        .from('vibe spot dp')
        .upload(fileName, file);

    if (uploadError) {
        Swal.fire('Error', uploadError.message, 'error');
        return;
    }

    // Database update (Space handle karne ke liye quotes)
    const { error: updateError } = await supabaseClient
        .from('posts')
        .update({ "vibe spot dp": fileName })
        .eq('user_id', loggedInUser.id);

    if (updateError) {
        Swal.fire('Error', "Table update failed", 'error');
    } else {
        Swal.fire('Success!', 'DP Updated ✨', 'success');
        loadProfileData();
    }
};

init();