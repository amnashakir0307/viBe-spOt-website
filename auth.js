const SUPABASE_URL = 'https://hdubheficnczadkiggoa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWJoZWZpY25jemFka2lnZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzUxNjQsImV4cCI6MjA4MDAxMTE2NH0.0WvZeIdVpkU6YM2SofO1RIrvOks21PgwdJ_MsNp7Fuk';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Switching Elements
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');

document.getElementById('goto-signup').onclick = () => {
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
    signupSection.classList.add('fade-in');
};

document.getElementById('goto-login').onclick = () => {
    signupSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginSection.classList.add('fade-in');
};

// --- Helper Function for Theme Alerts ---
function showVibeAlert(title, text, icon) {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        background: 'rgba(255, 255, 255, 0.95)',
        confirmButtonColor: '#fd1d1d', // Theme Red/Orange
        customClass: {
            popup: 'my-glass-alert'
        }
    });
}



// Sign up form dhoond kar is hissay ko update karein
document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data, error } = await _supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
    });

    if (error) {
        Swal.fire({ title: 'Opps!', text: error.message, icon: 'error', confirmButtonColor: '#fd1d1d' });
    } else {
        // Direct login ke liye hum foran index.html bhej denge
        Swal.fire({
            title: 'Welcome! ✨',
            text: 'Account created! Redirecting to feed...',
            icon: 'success',
            showConfirmButton: false, // Foran redirect karne ke liye button hide kar diya
            timer: 1500
        }).then(() => {
            window.location.href = 'index.html'; 
        });
    }
};// Login form dhoond kar is hissay ko update karein
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        Swal.fire({ title: 'Login Error', text: 'Email ya password ghalat hai!', icon: 'error', confirmButtonColor: '#fd1d1d' });
    } else {
        // Alert show hoga lakin design shift nahi hoga
        Swal.fire({
            title: 'Login Successful! 🔥',
            text: 'Wapsi par khush-amdeed!',
            icon: 'success',
            confirmButtonColor: '#fd1d1d'
        }).then(() => {
            window.location.href = 'index.html';
        });
    }
};