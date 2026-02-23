const SUPABASE_URL = 'https://hdubheficnczadkiggoa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWJoZWZpY25jemFka2lnZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzUxNjQsImV4cCI6MjA4MDAxMTE2NH0.0WvZeIdVpkU6YM2SofO1RIrvOks21PgwdJ_MsNp7Fuk';


const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Check if user is logged in
async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Pehle login karein!");
        window.location.href = "login.html";
    }
}
checkAuth();

// IDs matching with your HTML
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-zone');
const imagePreview = document.getElementById('preview-img');
const placeholder = document.getElementById('placeholder-content');
const shareBtn = document.getElementById('share-btn');
const captionInput = document.getElementById('caption');

// Image Selection & Preview Logic
if (dropArea && fileInput) {
    dropArea.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    };
}

// Main Share/Upload Function
if (shareBtn) {
    shareBtn.onclick = async () => {
        const file = fileInput.files[0];
        const caption = captionInput.value;

        if (!file) {
            alert("Pehle koi photo select karein!");
            return;
        }

        shareBtn.innerText = "Posting...";
        shareBtn.disabled = true;

        try {
            // 1. UNIQUE FILE NAME GENERATION
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            // 2. UPLOAD TO STORAGE
            const { data: upData, error: uploadError } = await supabaseClient
                .storage
                .from('post_images') // Confirm bucket name is 'post_images'
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 3. GET PUBLIC URL (Yeh sabse important step hai)
            const { data: publicURLData } = supabaseClient
                .storage
                .from('post_images')
                .getPublicUrl(fileName);
            
            const finalImageUrl = publicURLData.publicUrl;

            // 4. GET CURRENT USER
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error("Aap logged in nahi hain.");

            // 5. DATABASE INSERT (Save Public URL instead of just filename)
            const { error: dbError } = await supabaseClient
                .from('posts')
                .insert([{
                    img_url: finalImageUrl, // Yahan ab poora link jayega
                    description: caption,
                    user_id: user.id,
                    username: user.email.split('@')[0],
                    likes: 0
                }]);

            if (dbError) throw dbError;

            // Success Alert
            Swal.fire({
                title: 'Vibe Shared! ✨',
                text: 'Aapki post kamyabi se upload ho gayi hai.',
                icon: 'success',
                confirmButtonColor: '#f09819',
                confirmButtonText: 'Great!'
            }).then(() => {
                window.location.href = 'index.html';
            });

        } catch (err) {
            Swal.fire({
                title: 'Opps...',
                text: "Galti hui: " + err.message,
                icon: 'error',
                confirmButtonColor: '#a80077',
            });
            console.error(err);
            shareBtn.innerText = "Share Now";
            shareBtn.disabled = false;
        }
    };
}