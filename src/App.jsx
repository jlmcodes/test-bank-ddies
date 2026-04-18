import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, BookOpen, Upload, Play, Settings, Moon, Sun, 
  CheckCircle, XCircle, RotateCcw, Trophy, ChevronRight, 
  Plus, Trash2, Edit3, ArrowLeft, BarChart2, Check, AlertCircle, 
  FileText, Code, Save, TrendingUp, TrendingDown, Minus, Image as ImageIcon, X, Clock, Timer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- PRODUCTION FIREBASE CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyCpWZ-gWDZQ4jATie2igPe51yK1aY37DEg",
      authDomain: "test-bank-ddies-2c991.firebaseapp.com",
      projectId: "test-bank-ddies-2c991",
      storageBucket: "test-bank-ddies-2c991.firebasestorage.app",
      messagingSenderId: "965037848214",
      appId: "1:965037848214:web:010652f7d1d614cbd534b7"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'test-bank-ddies-production';

// Color Palette
const palette = {
  coral: '#FF9A8B',
  peach: '#FFC3A0',
  yellow: '#FECF6A',
  blue: '#A1E3FF',
};

// CSS Styles Injection
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

  :root {
    --coral: ${palette.coral};
    --peach: ${palette.peach};
    --yellow: ${palette.yellow};
    --blue: ${palette.blue};

    --pd-deep: #5A1E26;
    --pd-ripe: #963542;
    --pd-old: #C65C6A;
    --pd-muted: #D78289;

    --bg-light: #FAFAFA;
    --text-light: var(--pd-deep); 
    --card-light: rgba(255, 255, 255, 0.85);

    --bg-dark: #121820;
    --text-dark: #F7FAFC; 
    --card-dark: rgba(30, 37, 48, 0.85);

    --blue-soft: rgba(161, 227, 255, 0.3);
    --coral-dark: #E86A58; 
  }

  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .theme-light {
    background: linear-gradient(135deg, #FFF5F2 0%, #EBF8FF 100%);
    color: var(--text-light);
    min-height: 100vh;
    background-attachment: fixed;
  }

  .theme-light .surface {
    background-color: var(--card-light);
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  }

  .theme-dark {
    background: linear-gradient(135deg, #1A1C23 0%, #2B2527 100%);
    color: var(--text-dark);
    min-height: 100vh;
    background-attachment: fixed;
  }

  .theme-dark .surface {
    background-color: var(--card-dark);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .btn-primary {
    background-color: var(--blue);
    color: var(--coral-dark);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(161, 227, 255, 0.4);
  }
  .btn-primary:hover { 
    background-color: var(--coral);
    color: white;
    transform: translateY(-2px); 
    box-shadow: 0 6px 20px rgba(255, 154, 139, 0.4); 
  }
  
  .btn-secondary {
    background-color: var(--blue-soft);
    color: var(--coral-dark);
    font-weight: 800;
    transition: all 0.2s;
  }
  .btn-secondary:hover { 
    background-color: var(--peach); 
    color: var(--pd-deep); 
  }

  .theme-dark .btn-secondary {
    background-color: rgba(161, 227, 255, 0.15);
    color: var(--blue);
  }
  .theme-dark .btn-secondary:hover { background-color: var(--coral); color: white; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--coral); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--peach); }
`;

const resizeImage = (file, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState('dashboard');
  
  const [folders, setFolders] = useState([]);
  const [decks, setDecks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [progress, setProgress] = useState({}); 
  const [history, setHistory] = useState([]);

  const [activeFolder, setActiveFolder] = useState(null);
  const [activeDeck, setActiveDeck] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [pendingDeck, setPendingDeck] = useState(null); 

  const [modal, setModal] = useState(null);

  const showAlert = (title, message) => {
    setModal({ type: 'alert', title, message, onConfirm: () => setModal(null) });
  };

  // --- TAB NAME AND FAVICON INJECTION ---
  useEffect(() => {
    document.title = "Test Bank-ddies";
    
    const svgIcon = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="25" r="22" fill="%23FF9A8B" />
      <circle cx="74" cy="42" r="22" fill="%23FFC3A0" />
      <circle cx="65" cy="70" r="22" fill="%23FECF6A" />
      <circle cx="35" cy="70" r="22" fill="%23A1E3FF" />
      <circle cx="26" cy="42" r="22" fill="%23FF9A8B" />
      <circle cx="50" cy="50" r="16" fill="%23FFFFFF" />
      <circle cx="50" cy="50" r="6" fill="%23A1E3FF" />
    </svg>`;
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,${svgIcon}`;
  }, []);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (auth.authStateReady) {
            await auth.authStateReady(); 
        }
        
        if (auth.currentUser) return;

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        if (err.code === 'auth/operation-not-allowed') {
           showAlert("Setup Required", "Anonymous sign-in is disabled. Please go to your Firebase Console > Authentication > Sign-in method, and enable 'Anonymous'.");
        } else {
           showAlert("Connection Error", err.message);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const collections = {
      folders: setFolders,
      decks: setDecks,
      history: setHistory,
    };

    const unsubscribes = [];

    ['folders', 'decks', 'history'].forEach(colName => {
      const colRef = collection(db, 'artifacts', appId, 'users', uid, colName);
      const unsub = onSnapshot(colRef, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        collections[colName](data);
      }, (err) => console.error(`Error loading ${colName}:`, err));
      unsubscribes.push(unsub);
    });

    const todosRef = collection(db, 'artifacts', appId, 'users', uid, 'todos');
    const unsubTodos = onSnapshot(todosRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt - a.createdAt);
      setTodos(data);
    }, err => console.error("Error loading todos:", err));
    unsubscribes.push(unsubTodos);

    const progRef = collection(db, 'artifacts', appId, 'users', uid, 'progress');
    const unsubProg = onSnapshot(progRef, (snap) => {
      const progData = {};
      snap.docs.forEach(doc => { progData[doc.id] = doc.data(); });
      setProgress(progData);
    }, err => console.error(err));
    unsubscribes.push(unsubProg);

    return () => unsubscribes.forEach(u => u());
  }, [user]);

  const setProgressData = () => {}; 

  // --- TODO LIST FUNCTIONS ---
  const handleAddTodo = async (text) => {
    if (!text.trim() || !user) return;
    try {
      const id = `todo_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'todos', id), { text, completed: false, createdAt: Date.now() });
    } catch (e) {
      console.error("Error adding todo", e);
    }
  };

  const toggleTodo = async (todo) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'todos', todo.id), { completed: !todo.completed }, { merge: true });
  };

  const handleDeleteTodo = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'todos', id));
  };


  const handleCreateFolder = () => {
    if (!user) {
      showAlert("Not Connected", "The app is not connected to the database.");
      return;
    }
    setModal({
      type: 'folder',
      title: 'New Folder',
      initialName: '',
      initialLabel: 'Minor',
      onConfirm: async (name, label) => {
        if (!name.trim()) return;
        const id = `fld_${Date.now()}`;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'folders', id), { name, label, createdAt: Date.now() });
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
  };

  const handleEditFolder = (folder) => {
    if (!user) return;
    setModal({
      type: 'folder',
      title: 'Edit Folder',
      initialName: folder.name,
      initialLabel: folder.label || 'Minor',
      onConfirm: async (name, label) => {
        if (!name.trim()) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'folders', folder.id), { name, label }, { merge: true });
        if (activeFolder?.id === folder.id) {
           setActiveFolder(prev => ({...prev, name, label}));
        }
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
  };

  const handleCreateDeck = async (folderId, deckData) => {
    if (!user) return;
    const id = `deck_${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'decks', id), {
      ...deckData,
      folderId,
      createdAt: Date.now()
    });
    return id;
  };

  const saveProgress = async (deckId, newProgressMap) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'progress', deckId), newProgressMap, { merge: true });
    } catch(err) {
      console.error(err);
    }
  };

  const saveHistory = async (historyEntry) => {
    if (!user) return;
    try {
      const id = `hist_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', id), {
        ...historyEntry,
        createdAt: Date.now()
      });
    } catch(err) {
      console.error(err);
    }
  };

  const deleteItem = (col, id) => {
    if (!user) return;
    setModal({
      type: 'confirm',
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete this? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
        if (col === 'folders') setView('dashboard');
        if (col === 'decks') setView('folder');
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      if (auth.currentUser && auth.currentUser.isAnonymous) {
         await linkWithPopup(auth.currentUser, provider);
      } else {
         await signInWithPopup(auth, provider);
      }
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
         const provider = new GoogleAuthProvider();
         await signInWithPopup(auth, provider);
      } else if (error.code === 'auth/unauthorized-domain') {
         showAlert("Domain Unauthorized", "Your domain is not authorized in Firebase. Please add this domain to the Authorized Domains list in your Firebase Console (Authentication > Settings).");
      } else {
         showAlert("Notice", "Google Sign-In might be restricted in this environment. Error: " + error.message);
         console.error(error);
      }
    }
  };

  // --- INTERNAL UI COMPONENTS ---

  const Modal = () => {
    if (!modal) return null;
    const [inputValue, setInputValue] = useState(modal.initialName || '');
    const [labelValue, setLabelValue] = useState(modal.initialLabel || 'Minor');
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="surface p-6 rounded-2xl max-w-sm w-full shadow-2xl">
          <h3 className="text-xl font-bold mb-2 text-[var(--pd-deep)] dark:text-white">{modal.title}</h3>
          
          {modal.message && <p className="opacity-80 mb-6 text-[var(--pd-old)] dark:text-slate-300 whitespace-pre-wrap">{modal.message}</p>}
          
          {modal.type === 'prompt' && (
            <input 
              autoFocus
              type="text" 
              className="w-full p-3 rounded-lg border border-[var(--blue)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--coral)] mb-6 text-[var(--pd-deep)] dark:text-white"
              placeholder={modal.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && modal.onConfirm(inputValue)}
            />
          )}

          {modal.type === 'folder' && (
             <div className="mb-6 flex flex-col gap-4">
                 <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[var(--pd-muted)]">Folder Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      className="w-full p-3 rounded-lg border border-[var(--blue)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--coral)] text-[var(--pd-deep)] dark:text-white"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[var(--pd-muted)]">Classification</label>
                    <select 
                      className="w-full p-3 rounded-lg border border-[var(--blue)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--coral)] text-[var(--pd-deep)] dark:text-white"
                      value={labelValue}
                      onChange={(e) => setLabelValue(e.target.value)}
                    >
                       <option value="Major" className="text-black">Major</option>
                       <option value="Minor" className="text-black">Minor</option>
                    </select>
                 </div>
             </div>
          )}

          <div className="flex justify-end gap-3">
            {(modal.type === 'confirm' || modal.type === 'prompt' || modal.type === 'folder') && (
              <button 
                onClick={modal.onCancel}
                className="px-4 py-2 rounded-lg font-semibold border border-[var(--blue)] hover:bg-[var(--blue-soft)] transition-colors text-[var(--pd-ripe)] dark:text-slate-300"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={() => {
                 if (modal.type === 'folder') modal.onConfirm(inputValue, labelValue);
                 else if (modal.type === 'prompt') modal.onConfirm(inputValue);
                 else modal.onConfirm();
              }}
              className="btn-primary px-4 py-2 rounded-lg font-semibold"
            >
              {modal.type === 'alert' ? 'OK' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FlowerIcon = ({ size = 36, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="50" cy="25" r="22" fill="var(--coral)" />
      <circle cx="74" cy="42" r="22" fill="var(--peach)" />
      <circle cx="65" cy="70" r="22" fill="var(--yellow)" />
      <circle cx="35" cy="70" r="22" fill="var(--blue)" />
      <circle cx="26" cy="42" r="22" fill="var(--coral)" />
      <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="6" fill="var(--blue)" />
    </svg>
  );

  const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
       <path fill="#4285F4" d="M47.53 24.52c0-1.65-.15-3.23-.42-4.75H24v9h13.2c-.57 2.91-2.27 5.38-4.8 7.08v5.88h7.75c4.54-4.18 7.38-10.36 7.38-17.21z"/>
       <path fill="#34A853" d="M24 48c6.64 0 12.2-2.2 16.27-5.96l-7.75-5.88c-2.2 1.48-5.03 2.35-8.52 2.35-6.55 0-12.09-4.42-14.07-10.36H1.93v6.07C5.97 42.27 14.33 48 24 48z"/>
       <path fill="#FBBC05" d="M9.93 28.15c-.5-1.48-.79-3.05-.79-4.65s.29-3.17.79-4.65V12.78H1.93A23.94 23.94 0 0 0 0 23.5c0 3.86 1.45 7.42 3.93 10.72l6-6.07z"/>
       <path fill="#EA4335" d="M24 9.49c3.6 0 6.85 1.24 9.4 3.6l7.05-7.05C36.19 2.2 30.63 0 24 0 14.33 0 5.97 5.73 1.93 13.78l8 6.07C11.91 13.91 17.45 9.49 24 9.49z"/>
    </svg>
  );

  const Navbar = () => (
    <nav className="flex items-center justify-between p-4 surface sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
        <FlowerIcon size={34} className="text-white dark:text-[#121820]" />
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase text-[var(--pd-deep)] dark:text-white">
            Test Bank-ddies
          </h1>
          <span className="text-[10px] font-bold tracking-wider opacity-80 mt-1 uppercase text-[var(--pd-old)] dark:text-slate-400">
            Powered by Jaynard L. Monleon
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Fixed UI Bug: Properly check if user exists before checking isAnonymous */}
        {!user ? (
           <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg hidden sm:block animate-pulse">Connecting...</span>
        ) : user.isAnonymous ? (
           <button onClick={googleSignIn} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--blue-soft)] bg-white dark:bg-slate-800 text-[var(--pd-deep)] dark:text-white hover:bg-[var(--blue-soft)] transition shadow-sm font-bold text-sm">
             <GoogleLogo /> <span className="hidden sm:inline">Sign in with Google</span>
           </button>
        ) : (
           <span className="text-xs font-black uppercase tracking-wider text-[var(--blue)] bg-[var(--blue-soft)] px-3 py-1.5 rounded-lg hidden sm:block shadow-sm">Synced</span>
        )}
        <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-[var(--blue-soft)] transition-colors text-[var(--pd-old)] dark:text-slate-300">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );

  const TodoList = () => {
    const [newTodo, setNewTodo] = useState('');

    return (
      <div className="flex flex-col p-6 surface rounded-3xl shadow-md h-full min-h-[300px]">
        <h2 className="text-xl font-black mb-4 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight flex items-center gap-2">
          <CheckCircle size={22} className="text-[var(--coral)]" /> Tasks
        </h2>
        
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (handleAddTodo(newTodo), setNewTodo(''))}
            className="flex-1 p-3 rounded-xl border-2 border-[var(--blue-soft)] bg-transparent text-sm focus:outline-none focus:border-[var(--coral)] font-semibold text-[var(--pd-ripe)] dark:text-slate-200"
            placeholder="Add a new task..."
          />
          <button 
            onClick={() => { handleAddTodo(newTodo); setNewTodo(''); }} 
            className="bg-[var(--coral)] text-white px-4 rounded-xl shadow-sm hover:bg-[#E86A58] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 flex-1 pr-2">
          {todos.length === 0 ? (
            <div className="text-center mt-6">
              <p className="text-sm font-bold opacity-50 text-[var(--pd-old)] dark:text-slate-400">No pending tasks.</p>
              <p className="text-xs font-semibold opacity-40 mt-1">Add something above to get started!</p>
            </div>
          ) : (
            todos.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3.5 bg-black/5 dark:bg-white/5 rounded-xl group transition-colors border border-transparent hover:border-[var(--blue-soft)]">
                <input 
                  type="checkbox" 
                  checked={t.completed} 
                  onChange={() => toggleTodo(t)} 
                  className="mt-1 w-4 h-4 accent-[var(--coral)] cursor-pointer shadow-sm" 
                />
                <span className={`flex-1 text-sm font-semibold transition-all ${t.completed ? 'line-through opacity-40 italic' : 'text-[var(--pd-ripe)] dark:text-slate-200'}`}>
                  {t.text}
                </span>
                <button 
                  onClick={() => handleDeleteTodo(t.id)} 
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(null);
    
    // Using a mounted state avoids Vercel/Next.js React Hydration errors
    useEffect(() => {
      setCurrentTime(new Date());
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const hrs = currentTime ? currentTime.getHours() : 12;
    let greeting = 'Good Evening';
    if (hrs < 12) greeting = 'Good Morning';
    else if (hrs < 18) greeting = 'Good Afternoon';

    const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Student';

    let masteredCount = 0;
    let totalQs = 0;
    decks.forEach(d => {
       totalQs += d.questions.length;
       const dProg = progress[d.id] || {};
       d.questions.forEach(q => {
          if (dProg[q.id] === 'mastered') masteredCount++;
       });
    });

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          <div className="xl:col-span-3 flex flex-col gap-8">
            <div className="surface p-8 rounded-3xl shadow-xl border-l-8 border-l-[var(--coral)] relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--pd-deep)] dark:text-white uppercase tracking-tight mb-2">
                       {greeting}, {firstName}!
                    </h2>
                    {currentTime && (
                       <p className="text-[var(--pd-ripe)] dark:text-slate-300 font-semibold flex items-center gap-2">
                         {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                         <span className="font-black text-lg ml-2 bg-[var(--blue-soft)] px-3 py-1 rounded-lg text-[var(--coral-dark)]">{currentTime.toLocaleTimeString()}</span>
                       </p>
                    )}
                  </div>

                  <div className="flex gap-4 self-start md:self-auto">
                     <div className="bg-[var(--blue-soft)]/40 p-4 rounded-2xl text-center min-w-[80px]">
                        <div className="text-2xl font-black text-[var(--coral)]">{masteredCount}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--pd-deep)] dark:text-slate-300 mt-1">Mastered</div>
                     </div>
                     <div className="bg-[var(--blue-soft)]/40 p-4 rounded-2xl text-center min-w-[80px]">
                        <div className="text-2xl font-black text-[var(--coral)]">{totalQs}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--pd-deep)] dark:text-slate-300 mt-1">Total Qs</div>
                     </div>
                     <div className="bg-[var(--blue-soft)]/40 p-4 rounded-2xl text-center min-w-[80px]">
                        <div className="text-2xl font-black text-[var(--coral)]">{decks.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--pd-deep)] dark:text-slate-300 mt-1">Decks</div>
                     </div>
                  </div>
               </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">My Folders</h2>
                <button onClick={handleCreateFolder} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
                  <Plus size={18} /> New Folder
                </button>
              </div>

              {folders.length === 0 ? (
                <div className="text-center p-12 surface rounded-3xl border-dashed border-2 border-[var(--blue)]">
                  <Folder className="mx-auto text-[var(--blue)] mb-4" size={48} />
                  <p className="text-lg font-bold mb-2 text-[var(--pd-ripe)] dark:text-slate-100">No folders yet.</p>
                  <p className="font-semibold opacity-80 text-[var(--pd-old)] dark:text-slate-400">Click "+ New Folder" to get started. Inside a folder, you can upload PDFs!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {folders.map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => { setActiveFolder(f); setView('folder'); }}
                      className="surface p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all group flex items-center justify-between border-l-8 border-l-[var(--coral)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-[var(--blue-soft)]">
                           <Folder className="text-[var(--coral)]" size={24} />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                           <h3 className="font-black text-lg text-[var(--pd-ripe)] dark:text-white group-hover:text-[var(--coral)] transition-colors leading-none">{f.name}</h3>
                           <span className="text-[9px] uppercase tracking-widest font-black bg-[var(--yellow)] text-[var(--pd-deep)] px-2 py-0.5 rounded leading-none">{f.label || 'Minor'}</span>
                        </div>
                      </div>
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--coral)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-8">
            <TodoList />
          </div>

        </div>
      </div>
    );
  };

  const FolderView = () => {
    const folderDecks = decks.filter(d => d.folderId === activeFolder.id);

    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider text-[var(--pd-muted)] hover:text-[var(--pd-deep)] dark:hover:text-white cursor-pointer w-fit transition" onClick={() => setView('dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-3xl font-black text-[var(--pd-deep)] dark:text-white uppercase tracking-tight flex items-center gap-3">
               {activeFolder.name}
               <span className="text-xs uppercase tracking-widest font-black bg-[var(--yellow)] text-[var(--pd-deep)] px-2.5 py-1 rounded-md align-middle">{activeFolder.label || 'Minor'}</span>
            </h2>
            <div className="flex items-center gap-2">
               <button onClick={() => handleEditFolder(activeFolder)} className="p-2 text-[var(--coral-dark)] bg-[var(--blue-soft)] hover:bg-[var(--peach)] rounded-full transition-colors shadow-sm">
                 <Edit3 size={18} />
               </button>
               <button onClick={() => deleteItem('folders', activeFolder.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
          <button onClick={() => { 
              if (!user) {
                showAlert("Not Connected", "You cannot add a deck without a database connection.");
                return;
              }
              setActiveDeck(null); setView('import'); 
            }} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
            <Plus size={18} /> Add Deck
          </button>
        </div>

        {folderDecks.length === 0 ? (
          <div className="text-center p-12 surface rounded-3xl border-dashed border-2 border-[var(--blue)]">
            <BookOpen className="mx-auto text-[var(--blue)] mb-4" size={48} />
            <p className="text-lg font-bold mb-2 text-[var(--pd-ripe)] dark:text-slate-100">Folder is empty!</p>
            <p className="font-semibold opacity-80 text-[var(--pd-old)] dark:text-slate-400">Click "+ Add Deck" to import your PDFs or JSON Codes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {folderDecks.map(d => {
              const dProg = progress[d.id] || {};
              const mastered = Object.values(dProg).filter(v => v === 'mastered').length;
              const total = d.questions.length;
              const percent = total === 0 ? 0 : Math.round((mastered / total) * 100);

              return (
                <div 
                  key={d.id} 
                  onClick={() => { setActiveDeck(d); setView('deck'); }}
                  className="surface p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all flex flex-col gap-4 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-xl leading-tight text-[var(--pd-ripe)] dark:text-white group-hover:text-[var(--coral)] transition-colors">{d.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest font-black bg-[var(--yellow)] text-[var(--pd-deep)] px-2.5 py-1 rounded-md">
                      {d.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold opacity-70 text-[var(--pd-old)] dark:text-slate-300">{total} Questions</p>
                  
                  <div className="mt-auto pt-2">
                    <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wider text-[var(--pd-muted)]">
                      <span>Mastery</span>
                      <span className="text-[var(--coral)]">{percent}%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: 'linear-gradient(90deg, var(--coral), var(--yellow))' }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const Importer = () => {
    const [tab, setTab] = useState('code'); 
    const [inputData, setInputData] = useState('');
    const [parsing, setParsing] = useState(false);

    const parseAndTransition = (dataStr, sourceType) => {
      let parsedQuestions = [];

      try {
        if (sourceType === 'code') {
          let jsonStr = dataStr.trim();
          
          const startIdx = jsonStr.indexOf('[');
          const endIdx = jsonStr.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
          }

          parsedQuestions = JSON.parse(jsonStr);
          if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0 || (!parsedQuestions[0].q && !parsedQuestions[0].question)) {
             throw new Error("Invalid format");
          }
        } else {
           let formattedStr = dataStr.replace(/\s+([A-Ea-e][\.\)])\s+/g, '\n$1 ');
           const lines = formattedStr.split('\n').map(l => l.trim()).filter(l => l.length > 0);
           
           let currentQ = null;
           let pendingScenario = ""; 
           
           for (let line of lines) {
             if (line.match(/^(PROBLEM|MODULE|CHAPTER)\s*(NO\.|#)?\s*\d+/i) || line.match(/^-{3,}/)) {
                 if (currentQ && currentQ.options.length >= 2) {
                     parsedQuestions.push(currentQ);
                 }
                 currentQ = null;
                 pendingScenario += line + "\n";
                 continue;
             }

             const qMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
             const optMatch = line.match(/^([a-eA-E])[\.\)]\s*(.+)/); 

             if (qMatch) {
               if (currentQ && currentQ.options.length >= 2) {
                 parsedQuestions.push(currentQ);
               }
               currentQ = { 
                 id: `q_${Date.now()}_${Math.random()}`, 
                 q: qMatch[2], 
                 options: [], 
                 a: 0,
                 scenarioText: pendingScenario.trim(), 
                 scenarioImage: null,
                 linkedToPrevious: false
               }; 
               pendingScenario = ""; 
             } else if (optMatch && currentQ) {
               currentQ.options.push(optMatch[2]);
               if (line.includes('*')) {
                 currentQ.a = currentQ.options.length - 1;
                 currentQ.options[currentQ.options.length - 1] = optMatch[2].replace('*', '').trim();
               }
             } else {
               if (currentQ && currentQ.options.length === 0) {
                 currentQ.q += " " + line;
               } else {
                 pendingScenario += line + "\n"; 
               }
             }
           }
           
           if (currentQ && currentQ.options.length >= 2) {
             parsedQuestions.push(currentQ);
           }
           
           if(parsedQuestions.length === 0) {
             showAlert("Parsing Error", "Could not detect legitimate multiple choice questions. Make sure format is '1. Question' followed by A., B. choices.");
             setParsing(false);
             return; 
           }
        }

        const finalQs = parsedQuestions.map((q, idx) => ({
          id: q.id || `q_${Date.now()}_${idx}`,
          q: q.q || q.question,
          options: q.options || q.o || [],
          a: q.a !== undefined ? q.a : (q.answerIndex || 0),
          scenarioText: q.scenarioText || '',
          scenarioImage: q.scenarioImage || null,
          linkedToPrevious: q.linkedToPrevious || false
        }));

        setPendingDeck({ name: "Untitled Deck", label: "Quiz", questions: finalQs });
        setView('edit_deck');
        
      } catch (err) {
        showAlert("Error", "Error parsing data. Please check the format and try again.");
        console.error(err);
      }
      setParsing(false);
    };

    const handleImport = async () => {
      if (!inputData.trim()) return showAlert("Wait", "Please paste some text or code first.");
      setParsing(true);
      parseAndTransition(inputData, tab);
    };

    const handleFile = async (e) => {
       const file = e.target.files[0];
       if(!file) return;
       setParsing(true);
       try {
         const fileReader = new FileReader();
         fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            if(window.pdfjsLib) {
              const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
              let fullText = '';
              for(let i=1; i<=pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                let lastY = -1;
                textContent.items.forEach(item => {
                   if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 2) {
                       fullText += '\n'; 
                   }
                   fullText += item.str;
                   lastY = item.transform[5];
                });
                fullText += '\n';
              }
              
              parseAndTransition(fullText, 'pdf');
              
            } else {
               showAlert("Wait", "PDF parser not loaded yet. Try again in a few seconds.");
               setParsing(false);
            }
         };
         fileReader.readAsArrayBuffer(file);
       } catch (err) {
         console.error(err);
         showAlert("Error", "Failed to parse the PDF file.");
         setParsing(false);
       }
    };

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider text-[var(--pd-muted)] hover:text-[var(--pd-deep)] dark:hover:text-white cursor-pointer w-fit transition" onClick={() => setView('folder')}>
          <ArrowLeft size={16} /> Back to Folder
        </div>

        <div className="surface p-8 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-black mb-8 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">Import New Deck</h2>
          
          <div className="flex gap-4 mb-6 border-b-2 border-[var(--blue-soft)]">
            <button className={`pb-3 px-4 font-black uppercase tracking-wider transition-colors ${tab === 'code' ? 'border-b-4 border-[var(--coral)] text-[var(--coral)]' : 'opacity-60 hover:opacity-100 text-[var(--pd-ripe)] dark:text-white'}`} onClick={() => setTab('code')}>
              <Code size={18} className="inline mr-2" /> Code Portal
            </button>
            <button className={`pb-3 px-4 font-black uppercase tracking-wider transition-colors ${tab === 'pdf' ? 'border-b-4 border-[var(--coral)] text-[var(--coral)]' : 'opacity-60 hover:opacity-100 text-[var(--pd-ripe)] dark:text-white'}`} onClick={() => setTab('pdf')}>
              <FileText size={18} className="inline mr-2" /> Raw Text / PDF
            </button>
          </div>

          {tab === 'code' ? (
            <div className="mb-8">
              <p className="text-sm font-semibold mb-3 text-[var(--pd-old)] dark:text-slate-400">Paste the JSON code generated by an AI assistant here. You can add problem scenarios in the next step.</p>
              <textarea 
                className="w-full h-56 p-5 rounded-2xl border-2 border-[var(--blue-soft)] bg-black/5 dark:bg-white/5 focus:outline-none focus:border-[var(--coral)] font-mono text-sm shadow-inner text-[var(--pd-ripe)] dark:text-slate-200 transition-colors"
                value={inputData} onChange={e => setInputData(e.target.value)}
                placeholder='[{"q": "What is 2+2?", "o": ["3", "4", "5"], "a": 1}]'
              ></textarea>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-sm font-semibold mb-4 text-[var(--pd-old)] dark:text-slate-400">Upload a PDF. The app will extract all questions (1.) and choices (A.) and automatically bring you to the editor!</p>
              
              <div className="flex items-center gap-4 mt-4 bg-[var(--blue-soft)] p-4 rounded-2xl">
                <label className="cursor-pointer bg-[var(--blue)] text-[var(--coral-dark)] hover:bg-[var(--coral)] hover:text-white transition-all px-6 py-3.5 rounded-xl font-black uppercase tracking-wider shadow-md flex items-center gap-3 hover:-translate-y-1">
                  <Upload size={20} />
                  Choose PDF File
                  <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
                </label>
                {parsing && <RotateCcw className="animate-spin text-[var(--coral)]" size={24} />}
              </div>
              
              <div className="flex items-center gap-4 my-8">
                <div className="h-0.5 bg-[var(--blue-soft)] flex-1"></div>
                <span className="text-xs font-black opacity-60 uppercase tracking-widest text-[var(--pd-deep)] dark:text-white">OR PASTE RAW TEXT</span>
                <div className="h-0.5 bg-[var(--blue-soft)] flex-1"></div>
              </div>

              <textarea 
                className="w-full h-48 p-5 rounded-2xl border-2 border-[var(--blue-soft)] bg-transparent focus:outline-none focus:border-[var(--coral)] text-sm shadow-inner text-[var(--pd-ripe)] dark:text-white transition-colors"
                value={inputData} onChange={e => setInputData(e.target.value)}
                placeholder="1. First Question&#10;A. Option 1&#10;B. Option 2*&#10;C. Option 3"
              ></textarea>
            </div>
          )}

          <button onClick={handleImport} disabled={parsing || (tab === 'pdf' && !inputData.trim())} className={`btn-primary w-full py-4 rounded-xl text-lg flex justify-center items-center gap-2 ${(tab === 'pdf' && !inputData.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {parsing ? <RotateCcw className="animate-spin" size={24} /> : 'Preview & Edit Deck'} <ChevronRight size={22}/>
          </button>
        </div>
      </div>
    );
  };

  const DeckEditor = () => {
    const [deckInfo, setDeckInfo] = useState({ name: pendingDeck.name, label: pendingDeck.label });
    const [qs, setQs] = useState([...pendingDeck.questions]);
    const isEdit = !!pendingDeck.id; 

    const handleSave = async () => {
      if (!deckInfo.name) return showAlert("Hold up!", "Please provide a name for the deck.");
      if (qs.length === 0) return showAlert("Empty Deck", "You need at least one question to save a deck.");
      
      const sanitizedQs = qs.map(q => {
        let safeA = q.a;
        if (typeof safeA !== 'number' || safeA < 0 || safeA >= q.options.length) {
           safeA = 0; 
        }
        return { 
          ...q, 
          a: safeA,
          scenarioText: q.scenarioText || '',
          scenarioImage: q.scenarioImage || null,
          linkedToPrevious: q.linkedToPrevious || false
        };
      });

      if (isEdit) {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'decks', pendingDeck.id), { 
          ...deckInfo, 
          questions: sanitizedQs,
          folderId: pendingDeck.folderId,
          createdAt: pendingDeck.createdAt
        }, { merge: true });
        
        setActiveDeck({ ...pendingDeck, ...deckInfo, questions: sanitizedQs });
      } else {
        await handleCreateDeck(activeFolder.id, { ...deckInfo, questions: sanitizedQs });
      }
      
      setPendingDeck(null);
      setView(isEdit ? 'deck' : 'folder');
    };

    const updateQText = (idx, value) => {
      const updated = [...qs];
      updated[idx].q = value;
      setQs(updated);
    };

    const updateScenarioText = (idx, value) => {
      const updated = [...qs];
      updated[idx].scenarioText = value;
      setQs(updated);
    };

    const handleScenarioImage = async (idx, e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const base64 = await resizeImage(file, 800);
        const updated = [...qs];
        updated[idx].scenarioImage = base64;
        setQs(updated);
      } catch (err) {
        showAlert("Image Error", "Could not process this image.");
      }
    };

    const removeScenarioImage = (idx) => {
      const updated = [...qs];
      updated[idx].scenarioImage = null;
      setQs(updated);
    };

    const updateOptText = (qIdx, oIdx, value) => {
      const updated = [...qs];
      updated[qIdx].options[oIdx] = value;
      setQs(updated);
    };

    const setCorrectOpt = (qIdx, oIdx) => {
      const updated = [...qs];
      updated[qIdx].a = oIdx;
      setQs(updated);
    };

    const addOpt = (qIdx) => {
      const updated = [...qs];
      updated[qIdx].options.push(`Option ${updated[qIdx].options.length + 1}`);
      setQs(updated);
    };

    const removeOpt = (qIdx, oIdx) => {
      const updated = [...qs];
      if (updated[qIdx].options.length <= 1) return showAlert("Whoops!", "A question must have at least one option.");
      updated[qIdx].options.splice(oIdx, 1);
      if (updated[qIdx].a === oIdx) updated[qIdx].a = 0;
      else if (updated[qIdx].a > oIdx) updated[qIdx].a -= 1;
      setQs(updated);
    };

    const addQuestion = () => {
      setQs([...qs, { id: `q_${Date.now()}_new`, q: "New Question", options: ["Option 1", "Option 2"], a: 0, scenarioText: '', scenarioImage: null, linkedToPrevious: false }]);
    };

    const removeQuestion = (idx) => {
      const updated = [...qs];
      updated.splice(idx, 1);
      if (updated.length > 0) {
          updated[0].linkedToPrevious = false;
      }
      setQs(updated);
    };

    return (
      <div className="max-w-4xl mx-auto animate-fade-in pb-20">
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-80 hover:opacity-100 cursor-pointer w-fit transition text-[var(--pd-ripe)] dark:text-white" onClick={() => { setPendingDeck(null); setView(isEdit ? 'deck' : 'import'); }}>
              <ArrowLeft size={16} /> Back to {isEdit ? 'Deck' : 'Import'}
            </div>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-md">
              <Save size={18} /> Save Deck
            </button>
         </div>

         <div className="surface p-8 rounded-3xl shadow-md mb-8 border-2 border-[var(--blue-soft)]">
            <h2 className="text-2xl font-black mb-6 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">Deck Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[var(--pd-muted)]">Deck Name</label>
                <input type="text" className="w-full p-4 rounded-xl border-2 border-[var(--blue-soft)] bg-transparent focus:outline-none focus:border-[var(--coral)] font-bold text-[var(--pd-ripe)] dark:text-white transition-colors" value={deckInfo.name} onChange={e => setDeckInfo({...deckInfo, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[var(--pd-muted)]">Label</label>
                <select className="w-full p-4 rounded-xl border-2 border-[var(--blue-soft)] bg-transparent focus:outline-none focus:border-[var(--coral)] font-bold text-[var(--pd-ripe)] dark:text-white transition-colors" value={deckInfo.label} onChange={e => setDeckInfo({...deckInfo, label: e.target.value})}>
                  <option value="Quiz" className="text-black">Quiz</option>
                  <option value="Midterms" className="text-black">Midterms</option>
                  <option value="Finals" className="text-black">Finals</option>
                </select>
              </div>
            </div>
         </div>

         <h3 className="text-2xl font-black mb-6 px-2 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">Questions ({qs.length})</h3>
         
         <div className="space-y-6">
           {qs.map((q, qIdx) => (
             <div key={q.id || qIdx} className={`surface p-8 rounded-3xl shadow-sm relative transition-all ${q.linkedToPrevious ? 'border-l-8 border-l-[var(--blue-soft)] opacity-95 ml-6' : 'border-l-8 border-l-[var(--coral)]'}`}>
               <div className="flex justify-between items-center mb-6">
                 <h4 className="font-black text-xl text-[var(--pd-ripe)] dark:text-white">Question {qIdx + 1}</h4>
                 <button onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:text-red-700 p-2 bg-red-100 dark:bg-red-900/30 rounded-full transition-colors">
                   <Trash2 size={18} />
                 </button>
               </div>
               
               {/* Scenario Grouping Feature */}
               {qIdx > 0 && (
                 <label className="flex items-center gap-3 text-sm font-bold opacity-80 mb-5 cursor-pointer w-fit hover:opacity-100 transition p-2 rounded-lg hover:bg-[var(--blue-soft)]">
                   <input 
                     type="checkbox" 
                     className="accent-[var(--coral)] w-5 h-5 cursor-pointer"
                     checked={q.linkedToPrevious || false}
                     onChange={(e) => {
                       const updated = [...qs];
                       updated[qIdx].linkedToPrevious = e.target.checked;
                       if (e.target.checked) {
                          updated[qIdx].scenarioText = '';
                          updated[qIdx].scenarioImage = null;
                       }
                       setQs(updated);
                     }}
                   />
                   <span className="text-[var(--coral)] uppercase tracking-wide">Link to previous question's scenario</span>
                 </label>
               )}

               {/* Scenario Section */}
               {!q.linkedToPrevious && (
                 <div className="mb-6 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-[var(--blue-soft)] shadow-inner">
                   <label className="block text-xs font-black uppercase tracking-wider mb-3 text-[var(--pd-muted)] flex items-center gap-2">
                      <FileText size={16}/> Problem Scenario / Context (Optional)
                   </label>
                   <textarea 
                     className="w-full p-4 rounded-xl bg-white dark:bg-[#1A1C23] border-2 border-transparent focus:outline-none focus:border-[var(--coral)] text-sm mb-4 min-h-[80px] transition-colors shadow-sm font-medium text-[var(--pd-ripe)] dark:text-slate-200"
                     value={q.scenarioText || ''}
                     onChange={(e) => updateScenarioText(qIdx, e.target.value)}
                     placeholder="Paste the problem text, trial balance, or scenario here..."
                   />
                   
                   {q.scenarioImage ? (
                     <div className="relative inline-block mt-2">
                       <img src={q.scenarioImage} alt="Scenario" className="max-h-48 rounded-xl border-2 border-[var(--blue-soft)]" />
                       <button 
                         onClick={() => removeScenarioImage(qIdx)} 
                         className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   ) : (
                     <div className="flex items-center">
                       <label className="cursor-pointer flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--coral)] bg-[var(--blue-soft)] px-4 py-2.5 rounded-lg hover:opacity-80 transition shadow-sm">
                         <ImageIcon size={16}/> Upload Scenario Photo
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleScenarioImage(qIdx, e)} />
                       </label>
                     </div>
                   )}
                 </div>
               )}

               <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[var(--pd-muted)]">Question Text</label>
               <textarea 
                 className="w-full p-4 rounded-xl border-2 border-[var(--blue-soft)] bg-transparent focus:outline-none focus:border-[var(--coral)] mb-6 font-semibold text-[var(--pd-ripe)] dark:text-white min-h-[80px] transition-colors"
                 value={q.q}
                 onChange={(e) => updateQText(qIdx, e.target.value)}
                 placeholder="Enter question text here..."
               />

               <div className="space-y-4">
                 {q.options.map((opt, oIdx) => (
                   <div key={oIdx} className="flex items-center gap-4">
                     <div 
                       title="Mark as correct answer"
                       className={`p-2.5 rounded-full cursor-pointer transition-all ${q.a === oIdx ? 'bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-400 shadow-sm scale-110' : 'bg-[#F9DAD8] text-[var(--pd-muted)] dark:bg-slate-800 dark:text-slate-600 hover:bg-[var(--blue-soft)] hover:text-[var(--coral)]'}`}
                       onClick={() => setCorrectOpt(qIdx, oIdx)}
                     >
                       <CheckCircle size={22} className={q.a === oIdx ? 'opacity-100' : 'opacity-50'} />
                     </div>
                     
                     <input 
                       type="text" 
                       value={opt}
                       onChange={(e) => updateOptText(qIdx, oIdx, e.target.value)}
                       className={`flex-1 p-3 rounded-xl border-2 transition-colors bg-transparent font-medium text-[var(--pd-ripe)] dark:text-white focus:outline-none ${q.a === oIdx ? 'border-green-400 focus:border-green-500 bg-green-50/30 dark:bg-green-900/10' : 'border-[var(--blue-soft)] focus:border-[var(--coral)]'}`}
                     />
                     
                     <button onClick={() => removeOpt(qIdx, oIdx)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                       <XCircle size={20} />
                     </button>
                   </div>
                 ))}
               </div>

               <button onClick={() => addOpt(qIdx)} className="mt-6 text-sm font-black uppercase tracking-wider text-[var(--coral)] hover:text-[var(--peach)] flex items-center gap-1.5 transition-colors">
                 <Plus size={18}/> Add Choice
               </button>
             </div>
           ))}
         </div>

         <div className="mt-10 flex justify-center">
            <button onClick={addQuestion} className="border-4 border-dashed border-[var(--blue)] text-[var(--coral-dark)] font-black uppercase tracking-wider py-5 px-10 rounded-2xl flex items-center gap-3 hover:bg-[var(--blue)] hover:text-[var(--coral)] transition-all shadow-sm">
              <Plus size={24} /> Add New Question
            </button>
         </div>
      </div>
    );
  };

  const DeckDetail = () => {
    const [config, setConfig] = useState({
      mode: 'all', 
      shuffle: false,
      timeMode: 'none', 
      timeLimit: 10, 
      timeScope: 'quiz' 
    });

    const dProg = progress[activeDeck.id] || {};
    const stats = { learning: 0, mastering: 0, mastered: 0 };
    
    activeDeck.questions.forEach(q => {
      const s = dProg[q.id] || 'learning';
      stats[s]++;
    });

    const deckHistory = history.filter(h => h.deckId === activeDeck.id).sort((a,b) => b.createdAt - a.createdAt);

    const startQuiz = () => {
      let qs = [...activeDeck.questions];
      if (config.mode !== 'all') {
        qs = qs.filter(q => (dProg[q.id] || 'learning') === config.mode);
      }
      if (qs.length === 0) return showAlert("Empty Mode", `No questions currently in ${config.mode} mode!`);
      
      if (config.shuffle) {
        qs = qs.sort(() => Math.random() - 0.5);
      }
      
      setActiveQuiz({
        questions: qs,
        currentIndex: 0,
        score: 0,
        wrongAnswers: [],
        completed: false,
        selectedOpt: null,
        isAnswered: false,
        timeMode: config.timeMode,
        timeLimit: config.timeLimit,
        timeScope: config.timeScope
      });
      setView('quiz');
    };

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-80 hover:opacity-100 cursor-pointer w-fit transition text-[var(--pd-ripe)] dark:text-white" onClick={() => setView('folder')}>
              <ArrowLeft size={16} /> Back
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setPendingDeck(activeDeck); setView('edit_deck'); }} className="p-2.5 text-[var(--coral-dark)] bg-[var(--blue-soft)] hover:bg-[var(--peach)] rounded-full transition-colors shadow-sm">
                <Edit3 size={18} />
              </button>
              <button onClick={() => deleteItem('decks', activeDeck.id)} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-full transition-colors shadow-sm">
                <Trash2 size={18} />
              </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col gap-6">
               <div className="surface p-8 rounded-3xl text-center shadow-md">
                  <h2 className="text-3xl font-black mb-2 leading-tight text-[var(--pd-deep)] dark:text-white tracking-tight">{activeDeck.name}</h2>
                  <span className="inline-block bg-[var(--yellow)] text-[var(--pd-deep)] text-xs font-black px-3 py-1.5 rounded-lg mb-6 uppercase tracking-widest">{activeDeck.label}</span>
                  <div className="text-5xl font-black text-[var(--coral)] mb-2">{activeDeck.questions.length}</div>
                  <div className="text-xs opacity-70 uppercase tracking-widest font-black text-[var(--pd-old)] dark:text-slate-300">Total Questions</div>
               </div>

               <div className="surface p-8 rounded-3xl shadow-md">
                  <h3 className="font-black mb-6 flex items-center gap-2 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight"><BarChart2 size={20}/> Mastery</h3>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-xs mb-2 font-black uppercase tracking-wider text-red-500"><span>Learning</span><span>{stats.learning}</span></div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 shadow-inner"><div className="bg-red-400 h-2.5 rounded-full transition-all" style={{width: `${(stats.learning/activeDeck.questions.length)*100}%`}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2 font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400"><span>Mastering</span><span>{stats.mastering}</span></div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 shadow-inner"><div className="bg-yellow-400 h-2.5 rounded-full transition-all" style={{width: `${(stats.mastering/activeDeck.questions.length)*100}%`}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2 font-black uppercase tracking-wider text-green-600 dark:text-green-400"><span>Mastered</span><span>{stats.mastered}</span></div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 shadow-inner"><div className="bg-green-500 h-2.5 rounded-full transition-all" style={{width: `${(stats.mastered/activeDeck.questions.length)*100}%`}}></div></div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-6">
               <div className="surface p-8 rounded-3xl shadow-md border-t-4 border-t-[var(--coral)]">
                 <h3 className="text-2xl font-black mb-6 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">Quiz Setup</h3>
                 
                 <div className="mb-8">
                   <label className="block text-xs font-black uppercase tracking-wider mb-3 opacity-80 text-[var(--pd-old)] dark:text-slate-300">Select Target Questions</label>
                   <div className="grid grid-cols-2 gap-3">
                     {['all', 'learning', 'mastering', 'mastered'].map(m => (
                       <button 
                         key={m}
                         onClick={() => setConfig({...config, mode: m})}
                         className={`p-4 border-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${config.mode === m ? 'border-[var(--coral)] bg-[var(--coral)] text-white shadow-lg scale-105' : 'border-[var(--blue-soft)] hover:border-[var(--coral)] text-[var(--pd-ripe)] dark:text-slate-200'}`}
                       >
                         {m} ({m === 'all' ? activeDeck.questions.length : stats[m]})
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Advanced Time Tracking Options */}
                 <div className="mb-6">
                   <label className="block text-xs font-black uppercase tracking-wider mb-3 opacity-80 text-[var(--pd-old)] dark:text-slate-300 flex items-center gap-2">
                     <Timer size={16} /> Time Tracking
                   </label>
                   <div className="flex flex-col xl:flex-row gap-3">
                     <div className="flex flex-1 gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl border-2 border-[var(--blue-soft)]">
                        <button onClick={() => setConfig({...config, timeMode: 'none'})} className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${config.timeMode === 'none' ? 'bg-[var(--coral)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'}`}>None</button>
                        <button onClick={() => setConfig({...config, timeMode: 'stopwatch'})} className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${config.timeMode === 'stopwatch' ? 'bg-[var(--coral)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'}`}>Stopwatch</button>
                        <button onClick={() => setConfig({...config, timeMode: 'timer'})} className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${config.timeMode === 'timer' ? 'bg-[var(--coral)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'}`}>Timer</button>
                     </div>
                     {config.timeMode !== 'none' && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                           <div className="flex flex-1 gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl border-2 border-[var(--blue-soft)] w-full sm:w-auto">
                             <button onClick={() => setConfig({...config, timeScope: 'quiz'})} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${config.timeScope === 'quiz' ? 'bg-[var(--coral)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'}`}>Whole Set</button>
                             <button onClick={() => setConfig({...config, timeScope: 'question'})} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${config.timeScope === 'question' ? 'bg-[var(--coral)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5'}`}>Per Q.</button>
                           </div>
                           {config.timeMode === 'timer' && (
                             <div className="flex items-center justify-between gap-3 bg-[var(--blue-soft)] px-4 py-1.5 rounded-xl w-full sm:w-auto">
                               <span className="text-sm font-black uppercase tracking-wider text-[var(--pd-deep)] dark:text-white">Mins:</span>
                               <input type="number" min="1" max="180" className="w-16 p-2 rounded-lg border-2 border-[var(--coral)] bg-white dark:bg-[#1A1C23] font-black text-center focus:outline-none focus:ring-2 focus:ring-[var(--coral)] dark:text-white" value={config.timeLimit} onChange={e => setConfig({...config, timeLimit: parseInt(e.target.value) || 1})} />
                             </div>
                           )}
                        </div>
                     )}
                   </div>
                 </div>

                 <div className="mb-10">
                   <label className="flex items-center gap-3 cursor-pointer select-none hover:opacity-80 transition p-2 rounded-lg">
                     <input type="checkbox" checked={config.shuffle} onChange={e => setConfig({...config, shuffle: e.target.checked})} className="w-5 h-5 accent-[var(--coral)] cursor-pointer" />
                     <span className="font-bold text-[var(--pd-ripe)] dark:text-slate-200">Shuffle Questions</span>
                   </label>
                 </div>

                 <button onClick={startQuiz} className="btn-primary w-full py-5 rounded-2xl text-xl flex justify-center items-center gap-3">
                   <Play fill="currentColor" size={24} /> START QUIZZER
                 </button>
               </div>

               <div className="surface p-8 rounded-3xl shadow-md flex-1">
                  <h3 className="text-xl font-black mb-6 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">Past Attempts Log</h3>
                  {deckHistory.length === 0 ? (
                    <p className="text-sm font-medium opacity-60 italic text-[var(--pd-old)] dark:text-slate-400">No attempts logged yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {deckHistory.map((h, i) => {
                        const currPercent = Math.round((h.score / h.total) * 100);
                        let remarkIcon = <Minus size={18} className="text-slate-400" />;
                        
                        if (i < deckHistory.length - 1) {
                          const prev = deckHistory[i + 1];
                          const prevPercent = Math.round((prev.score / prev.total) * 100);
                          if (currPercent > prevPercent) remarkIcon = <TrendingUp size={18} className="text-green-500" />;
                          else if (currPercent < prevPercent) remarkIcon = <TrendingDown size={18} className="text-red-500" />;
                        }

                        return (
                          <div key={h.id} className="flex justify-between items-center p-4 rounded-2xl bg-[var(--blue-soft)]/20 border-2 border-transparent hover:border-[var(--blue-soft)] transition-colors">
                            <div>
                              <div className="font-bold text-sm text-[var(--pd-ripe)] dark:text-slate-200">{new Date(h.createdAt).toLocaleDateString()} - {new Date(h.createdAt).toLocaleTimeString()}</div>
                              <div className="text-xs font-black opacity-60 uppercase tracking-widest mt-1 text-[var(--pd-old)] dark:text-slate-400">{h.type} Mode</div>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="text-right">
                                <div className="font-black text-xl text-[var(--coral)] leading-none">{h.score} / {h.total}</div>
                                <div className="text-xs font-black opacity-70 mt-1">{currPercent}%</div>
                              </div>
                              <div title="Performance vs Previous Attempt" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                {remarkIcon}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    );
  };

  const QuizRunner = () => {
    const { questions, currentIndex, score, wrongAnswers, selectedOpt, isAnswered, timeMode, timeLimit, timeScope } = activeQuiz;
    const q = questions[currentIndex];
    
    const [quizElapsed, setQuizElapsed] = useState(0);
    const [quizRemaining, setQuizRemaining] = useState(timeMode === 'timer' ? timeLimit * 60 : 0);
    const [qElapsed, setQElapsed] = useState(0);
    const [qRemaining, setQRemaining] = useState(timeMode === 'timer' ? timeLimit * 60 : 0);

    const submitQuizRef = useRef(null);

    useEffect(() => {
       setQElapsed(0);
       setQRemaining(timeMode === 'timer' ? timeLimit * 60 : 0);
    }, [currentIndex, timeMode, timeLimit]);

    useEffect(() => {
      if (timeMode === 'none' || activeQuiz.completed) return;
      const timerId = setInterval(() => {
         setQuizElapsed(prev => prev + 1);
         setQuizRemaining(prev => Math.max(0, prev - 1));
         setQElapsed(prev => prev + 1);
         setQRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timerId);
    }, [timeMode, activeQuiz.completed]);

    const handleTimeout = () => {
       if (isAnswered) return;
       const currentDeckProg = { ...(progress[activeDeck.id] || {}) };
       currentDeckProg[q.id] = 'learning';
       saveProgress(activeDeck.id, currentDeckProg);
       setActiveQuiz(prev => ({
         ...prev,
         wrongAnswers: [...prev.wrongAnswers, q],
         selectedOpt: -1, 
         isAnswered: true
       }));
    };

    useEffect(() => {
       if (timeMode === 'timer' && !activeQuiz.completed && !isAnswered) {
          if (timeScope === 'quiz' && quizRemaining === 0) {
             submitQuizRef.current();
          } else if (timeScope === 'question' && qRemaining === 0) {
             handleTimeout();
          }
       }
    }, [quizRemaining, qRemaining, timeMode, timeScope, activeQuiz.completed, isAnswered]);

    submitQuizRef.current = () => {
      const historyEntry = {
        deckId: activeDeck.id,
        score: activeQuiz.score,
        total: questions.length,
        type: 'Standard'
      };
      saveHistory(historyEntry);
      setQuizResults({
         score: activeQuiz.score,
         total: questions.length,
         wrongAnswers: activeQuiz.wrongAnswers,
         timeTaken: timeMode === 'none' ? null : quizElapsed,
         timeMode
      });
      setView('results');
    };

    let activeScenarioText = q.scenarioText;
    let activeScenarioImage = q.scenarioImage;
    
    if (q.linkedToPrevious) {
       for (let i = currentIndex - 1; i >= 0; i--) {
          if (!questions[i].linkedToPrevious) {
             activeScenarioText = questions[i].scenarioText;
             activeScenarioImage = questions[i].scenarioImage;
             break;
          }
       }
    }

    const handleSelect = (idx) => {
      if (isAnswered) return;

      const isCorrect = Number(idx) === Number(q.a);
      
      const currentDeckProg = { ...(progress[activeDeck.id] || {}) };
      const oldStatus = currentDeckProg[q.id] || 'learning';
      let newStatus = 'learning';

      if (isCorrect) {
        if (oldStatus === 'learning') newStatus = 'mastering';
        else if (oldStatus === 'mastering') newStatus = 'mastered';
        else newStatus = 'mastered';
      } else {
        newStatus = 'learning';
      }
      
      currentDeckProg[q.id] = newStatus;
      saveProgress(activeDeck.id, currentDeckProg);

      setActiveQuiz(prev => ({
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        wrongAnswers: isCorrect ? prev.wrongAnswers : [...prev.wrongAnswers, q],
        selectedOpt: idx,
        isAnswered: true
      }));
    };

    const handleNext = () => {
      if (currentIndex + 1 < questions.length) {
        setActiveQuiz(prev => ({ 
          ...prev, 
          currentIndex: prev.currentIndex + 1,
          selectedOpt: null,
          isAnswered: false
        }));
      } else {
        submitQuizRef.current();
      }
    };

    const progressPercent = ((currentIndex + 1) / questions.length) * 100;
    
    const masteryStatus = progress[activeDeck.id]?.[q.id] || 'learning';
    let masteryColor = 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400 border-2 border-red-200 dark:border-red-800';
    if (masteryStatus === 'mastering') masteryColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-400 border-2 border-yellow-200 dark:border-yellow-800';
    if (masteryStatus === 'mastered') masteryColor = 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400 border-2 border-green-200 dark:border-green-800';

    let displayTimeStr = '';
    let isPulsing = false;
    if (timeMode !== 'none') {
       if (timeScope === 'quiz') {
          displayTimeStr = formatTime(timeMode === 'timer' ? quizRemaining : quizElapsed);
          isPulsing = timeMode === 'timer' && quizRemaining <= 60;
       } else {
          displayTimeStr = formatTime(timeMode === 'timer' ? qRemaining : qElapsed);
          isPulsing = timeMode === 'timer' && qRemaining <= 10;
       }
    }

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pb-20">
         <div className="mb-8">
           <div className="flex justify-between items-end mb-4">
             <div className="flex flex-col gap-1.5">
                <span className="text-sm font-black uppercase tracking-widest opacity-70 text-[var(--pd-ripe)] dark:text-slate-200">Question {currentIndex + 1} of {questions.length}</span>
                <div className="flex items-center gap-5 text-sm font-black uppercase tracking-wider">
                   <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><CheckCircle size={16}/> {score}</span>
                   <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400"><XCircle size={16}/> {wrongAnswers.length}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               {timeMode !== 'none' && (
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm border-2 ${isPulsing ? 'bg-red-100 border-red-400 text-red-700 animate-pulse' : 'bg-[var(--blue-soft)] border-transparent text-[var(--pd-deep)] dark:text-white'}`}>
                    <Clock size={16} className={isPulsing ? 'text-red-600' : 'text-[var(--pd-old)] dark:text-[var(--blue)]'}/>
                    <span className="font-black tracking-widest">{displayTimeStr}</span>
                 </div>
               )}
               <span className="text-sm font-black opacity-70 text-[var(--pd-ripe)] dark:text-slate-200 min-w-[3rem] text-right">{Math.round(progressPercent)}%</span>
             </div>
           </div>
           <div className="w-full bg-[var(--blue-soft)] rounded-full h-3.5 shadow-inner">
             <div className="h-3.5 rounded-full transition-all duration-500 shadow-md" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--coral), var(--yellow))' }}></div>
           </div>
         </div>

         <div className="surface p-8 rounded-3xl shadow-xl mb-8 text-center min-h-[200px] flex flex-col relative pt-14 border-t-8 border-t-[var(--coral)]">
            <span className={`absolute top-5 left-5 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg shadow-sm ${masteryColor}`}>
              {masteryStatus}
            </span>
            
            {activeScenarioText && (
               <div className="w-full mb-8 p-5 rounded-2xl bg-[var(--blue-soft)]/20 border-l-4 border-[var(--blue)] text-left text-sm whitespace-pre-wrap font-medium leading-relaxed overflow-x-auto text-[var(--pd-ripe)] dark:text-slate-200 shadow-sm">
                 {activeScenarioText}
               </div>
            )}
            
            {activeScenarioImage && (
               <div className="w-full mb-8 flex justify-center">
                 <img src={activeScenarioImage} alt="Problem Scenario" className="max-w-full max-h-96 rounded-2xl shadow-md border-4 border-white dark:border-slate-800" />
               </div>
            )}

            <h2 className="text-3xl font-bold leading-relaxed mt-2 text-[var(--pd-deep)] dark:text-white tracking-tight">{q.q}</h2>
         </div>

         {isAnswered && selectedOpt === -1 && (
            <div className="text-red-500 font-black uppercase tracking-wider text-xl mb-4 animate-pulse text-center">
               Time's Up!
            </div>
         )}

         <div className="grid grid-cols-1 gap-4">
            {q.options.map((opt, idx) => {
              let btnClass = "p-5 rounded-2xl text-left font-bold transition-all border-2 text-lg flex justify-between items-center shadow-sm ";
              let icon = null;

              if (!isAnswered) {
                btnClass += "surface border-transparent hover:border-[var(--coral)] hover:shadow-md cursor-pointer text-[var(--pd-ripe)] dark:text-slate-200";
              } else {
                if (idx === q.a) {
                  btnClass += "border-green-500 bg-green-100 text-green-900 dark:bg-green-900/80 dark:text-green-100 dark:border-green-400 font-black";
                  icon = <CheckCircle className="text-green-600 dark:text-green-400" size={24} />;
                } else if (idx === selectedOpt) {
                  btnClass += "border-red-500 bg-red-100 text-red-900 dark:bg-red-900/80 dark:text-red-100 dark:border-red-400 font-black";
                  icon = <XCircle className="text-red-600 dark:text-red-400" size={24} />;
                } else {
                  btnClass += "surface opacity-50 border-transparent text-[var(--pd-ripe)] dark:text-slate-200";
                }
              }

              return (
                <button 
                  key={idx} 
                  disabled={isAnswered}
                  onClick={() => handleSelect(idx)}
                  className={btnClass}
                >
                  <span>{opt}</span>
                  {icon}
                </button>
              );
            })}
         </div>

         <div className="mt-10 h-20">
            {isAnswered && (
              <button 
                onClick={handleNext}
                className="btn-primary w-full py-5 rounded-2xl text-xl flex justify-center items-center gap-3 animate-fade-in"
              >
                {currentIndex + 1 < questions.length ? 'NEXT QUESTION' : 'VIEW RESULTS'} <ChevronRight size={24} />
              </button>
            )}
         </div>
      </div>
    );
  };

  const ResultsView = () => {
    const { score, total, wrongAnswers, timeTaken, timeMode } = quizResults;
    const percent = Math.round((score / total) * 100);
    
    let message = "Keep learning!";
    if (percent === 100) message = "Perfect Score!";
    else if (percent >= 80) message = "Great Job!";

    const handleRetakeWrong = () => {
       setActiveQuiz({
        questions: wrongAnswers,
        currentIndex: 0,
        score: 0,
        wrongAnswers: [],
        completed: false,
        selectedOpt: null,
        isAnswered: false,
        timeMode: 'none', 
        timeLimit: null,
        timeScope: 'quiz'
      });
      setView('quiz');
    };

    return (
      <div className="max-w-3xl mx-auto animate-fade-in text-center py-10">
         <div className="surface p-12 rounded-[2rem] shadow-2xl mb-10 relative overflow-hidden border-t-8 border-[var(--coral)]">
            <h2 className="text-4xl font-black mb-3 text-[var(--pd-deep)] dark:text-white uppercase tracking-tight">{message}</h2>
            <p className="opacity-70 mb-10 font-black uppercase tracking-widest text-[var(--pd-old)] dark:text-slate-300">Quiz Summary</p>
            
            <div className="relative inline-flex items-center justify-center mb-10">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-[var(--blue-soft)]" />
                <circle cx="112" cy="112" r="100" stroke="url(#sunriseGradient)" strokeWidth="16" fill="transparent" strokeDasharray={`${percent * 6.28} 628`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="sunriseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--coral)" />
                    <stop offset="100%" stopColor="var(--yellow)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-6xl font-black text-[var(--coral)]">{percent}%</div>
            </div>

            <div className="flex justify-center gap-8 md:gap-16 text-lg font-black uppercase tracking-wider flex-wrap">
              {timeMode !== 'none' && timeTaken !== null && (
                 <div className="flex flex-col"><span className="text-4xl text-[var(--blue)] mb-1">{formatTime(timeTaken)}</span> <span className="text-sm opacity-70 text-[var(--pd-old)] dark:text-slate-300">Time Spent</span></div>
              )}
              <div className="flex flex-col"><span className="text-4xl text-green-500 mb-1">{score}</span> <span className="text-sm opacity-70 text-[var(--pd-old)] dark:text-slate-300">Correct</span></div>
              <div className="flex flex-col"><span className="text-4xl text-red-500 mb-1">{total - score}</span> <span className="text-sm opacity-70 text-[var(--pd-old)] dark:text-slate-300">Incorrect</span></div>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <button onClick={() => setView('deck')} className="btn-secondary py-4 rounded-2xl text-sm flex justify-center items-center gap-2 shadow-md">
              <BookOpen size={20} /> Back to Deck
            </button>
            <button onClick={() => { setView('deck'); }} className="btn-primary py-4 rounded-2xl text-sm flex justify-center items-center gap-2 shadow-md">
              <RotateCcw size={20} /> Retake All
            </button>
            {wrongAnswers.length > 0 ? (
               <button onClick={handleRetakeWrong} className="bg-red-500 text-white hover:bg-red-600 transition-all py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex justify-center items-center gap-2 shadow-md hover:-translate-y-1">
                 <AlertCircle size={20} /> Review Wrong
               </button>
            ) : (
               <div className="py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex justify-center items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 shadow-md">
                 <Check size={20} /> All Mastered!
               </div>
            )}
         </div>
      </div>
    );
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div className={`min-h-screen flex flex-col transition-colors duration-500 font-sans ${isDark ? 'theme-dark dark' : 'theme-light'}`}>
        <Navbar />
        
        <main className="p-4 md:p-8 relative flex-1 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <Dashboard />}
          {view === 'folder' && activeFolder && <FolderView />}
          {view === 'import' && activeFolder && <Importer />}
          {view === 'edit_deck' && pendingDeck && <DeckEditor />}
          {view === 'deck' && activeDeck && <DeckDetail />}
          {view === 'quiz' && activeQuiz && <QuizRunner />}
          {view === 'results' && quizResults && <ResultsView />}
        </main>
        
        <footer className="mt-auto py-10 px-4 text-center border-t-2 border-[var(--blue-soft)] opacity-80">
          <div className="max-w-4xl mx-auto text-xs space-y-4">
            <p className="font-black uppercase tracking-widest text-[var(--coral)]">
              Legal Disclaimer
            </p>
            <p className="leading-relaxed font-medium text-[var(--pd-old)] dark:text-slate-400">
              Any unauthorized distribution, reproduction, or dissemination of this link or its contents without the explicit notice and consent of the owner is considered illegal and strictly prohibited. Violators will be subject to appropriate legal action under the Intellectual Property Code of the Philippines (Republic Act No. 8293, Sec. 177).
            </p>
            <p className="font-bold pt-2 text-[var(--pd-muted)] dark:text-slate-500 uppercase tracking-widest">
              Created on April 18, 2026
            </p>
          </div>
        </footer>
        
        <Modal />
      </div>
    </>
  );
}