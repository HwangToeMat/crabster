/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
    Lightbulb,
    TrendingUp,
    DollarSign,
    Code,
    Rocket,
    ArrowRight,
    Loader2,
    Sparkles,
    Target,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Info,
    Users,
    LogIn,
    Search,
    Trophy,
    Plus,
    Layout,
    Eye,
    Heart,
    LogOut,
    Wallet,
    History,
    ExternalLink,
    X,
    AlertCircle,
    Settings,
    Edit3,
    RefreshCw,
    Save,
    Trash2,
    AlertTriangle,
    MessageSquare,
    Send,
    Camera,
    Share2,
    ShieldAlert,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import Markdown from 'react-markdown';
import html2canvas from 'html2canvas';
import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    Timestamp,
    FirebaseUser,
    OperationType,
    handleFirestoreError
} from './firebase';

// Initialize Gemini
const apiKey = (window as any).__ENV__?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey as string });

const ADMIN_EMAIL = "gpffhwjdtn874@gmail.com";

const getFriendlyErrorMessage = (error: any, defaultMsg: string) => {
    const errStr = String(error?.message || error);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota') || errStr.includes('quota')) {
        return 'AI 엔진의 일일 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    }
    return defaultMsg;
};

const CrabLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Claws */}
        <path d="M17 9a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2V4" />
        <path d="M7 9a2 2 0 0 0-2-2H4a2 2 0 0 1-2-2V4" />
        {/* Body */}
        <rect x="5" y="9" width="14" height="10" rx="4" />
        {/* Legs */}
        <path d="M5 13H2" />
        <path d="M5 16H2" />
        <path d="M19 13h3" />
        <path d="M19 16h3" />
        {/* Hacker Glasses */}
        <path d="M7 12h10" strokeWidth="3" />
        <path d="M8 12v2h2v-2" strokeWidth="2" fill="currentColor" />
        <path d="M14 12v2h2v-2" strokeWidth="2" fill="currentColor" />
    </svg>
);

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    tokenBalance: number;
    createdAt: any;
}

interface WebService {
    id: string;
    authorUid: string;
    authorName: string;
    title: string;
    description: string;
    code: string;
    thumbnailUrl?: string;
    views: number;
    likes: number;
    tags: string[];
    isFeatured?: boolean;
    isPublished?: boolean;
    createdAt: any;
}

type ModalConfig = {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
};

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
    const [hasError, setHasError] = useState(false);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            setHasError(true);
            setErrorInfo(event.message);
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">문제가 발생했습니다</h2>
                    <p className="text-gray-400 mb-6">{errorInfo || "알 수 없는 오류가 발생했습니다."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-all"
                    >
                        새로고침
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

const AdBanner = ({ slotId }: { slotId: string }) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error", e);
        }
    }, []);

    return (
        <div className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-center overflow-hidden my-4 min-h-[100px] flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-bold tracking-widest uppercase -z-10">
                Advertisement
            </div>
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-1192182296807526"
                 data-ad-slot={slotId}
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>
    );
};

const CRB_PLANS = [
    { id: 'starter', name: '스타터', crb: 100, price: 990, bonus: 0 },
    { id: 'standard', name: '스탠다드', crb: 500, price: 4900, bonus: 50, isRecommended: true },
    { id: 'pro', name: '프로', crb: 1000, price: 9900, bonus: 150 },
];

export default function App() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [interest, setInterest] = useState('');
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<WebService[]>([]);
    const [selectedService, setSelectedService] = useState<WebService | null>(null);
    const [viewMode, setViewMode] = useState<'playground' | 'builder' | 'profile' | 'editor' | 'hall_of_fame' | 'terms' | 'privacy' | 'admin'>('playground');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'popular'>('popular');
    const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: '', message: '', type: 'alert' });
    const [adminStats, setAdminStats] = useState({ users: 0, revenue: 0 });

    const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600, quality = 0.8): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(base64Str);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = base64Str;
        });
    };
    const [editingService, setEditingService] = useState<WebService | null>(null);
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [aiMode, setAiMode] = useState<'chat' | 'direct'>('chat');
    const [isChatting, setIsChatting] = useState(false);
    const [isEditingCode, setIsEditingCode] = useState(false);
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(CRB_PLANS[1]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
    const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // ESC key to clear search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSearchQuery('');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Toss Payments Widget Initialization
    useEffect(() => {
        if (isChargeModalOpen && user) {
            (async () => {
                try {
                    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
                    if (!clientKey) {
                        console.error("Toss client key is missing");
                        return;
                    }
                    const paymentWidget = await loadPaymentWidget(clientKey, user.uid);

                    const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
                        "#payment-widget",
                        { value: selectedPlan.price },
                        { variantKey: "DEFAULT" }
                    );

                    paymentWidget.renderAgreement(
                        '#agreement',
                        { variantKey: "AGREEMENT" }
                    );

                    paymentWidgetRef.current = paymentWidget;
                    paymentMethodsWidgetRef.current = paymentMethodsWidget;
                } catch (error) {
                    console.error("Error loading payment widget:", error);
                }
            })();
        }
    }, [isChargeModalOpen, user]);

    useEffect(() => {
        if (paymentMethodsWidgetRef.current) {
            paymentMethodsWidgetRef.current.updateAmount(selectedPlan.price);
        }
    }, [selectedPlan]);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const userRef = doc(db, 'users', firebaseUser.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setProfile(userSnap.data() as UserProfile);
                    } else {
                        // New User
                        const newProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            displayName: firebaseUser.displayName || '익명 사용자',
                            tokenBalance: 1000, // Welcome tokens
                            createdAt: serverTimestamp(),
                        };
                        await setDoc(userRef, newProfile);
                        setProfile(newProfile);
                    }
                } catch (error) {
                    handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
                }
            } else {
                setProfile(null);
                setViewMode('playground');
                setEditingService(null);
                setChatMessages([]);
            }
            setIsAuthReady(true);
            setIsInitialLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Real-time Services Listener (Playground)
    useEffect(() => {
        // Fetch more services to allow better ranking/filtering
        const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WebService));
            console.log(`Fetched ${docs.length} services.`);
            setServices(docs);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'services');
        });
        return () => unsubscribe();
    }, []);

    // Transactions Listener
    useEffect(() => {
        if (user && viewMode === 'profile') {
            const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setTransactions(docs);
            }, (error) => {
                console.error("Error fetching transactions:", error);
            });
            return () => unsubscribe();
        }
    }, [user, viewMode]);

    // Handle Payment Success/Fail
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');

        if (paymentStatus === 'success') {
            const crbAmount = urlParams.get('crbAmount');
            const orderId = urlParams.get('orderId');
            const paymentKey = urlParams.get('paymentKey');
            const amount = urlParams.get('amount');
            const planId = urlParams.get('planId');

            if (orderId && paymentKey && amount && user) {
                // Confirm payment with backend
                fetch('/api/toss/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount,
                        userId: user.uid,
                        planId,
                        crbAmount: Number(crbAmount)
                    })
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        setModal({
                            isOpen: true,
                            title: '결제 성공! 🎉',
                            message: `${crbAmount} CRB가 성공적으로 충전되었습니다.`,
                            type: 'alert'
                        });
                    }
                }).catch(err => console.error(err));
            }

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (paymentStatus === 'fail') {
            setModal({
                isOpen: true,
                title: '결제 실패',
                message: '결제 과정에서 오류가 발생했거나 취소되었습니다.',
                type: 'alert'
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);

    const handlePayment = async () => {
        if (!user) return;

        // 모의 결제 진행
        setModal({
            isOpen: true,
            title: '결제 진행 중',
            message: '테스트 결제를 진행하고 있습니다...',
            type: 'alert'
        });

        setTimeout(async () => {
            try {
                // 프론트엔드에서 직접 모의 결제 처리 (테스트용)
                const crbAmount = selectedPlan.crb + selectedPlan.bonus;
                const userRef = doc(db, 'users', user.uid);
                const txRef = doc(collection(db, 'transactions'));

                const userSnap = await getDoc(userRef);
                const currentBalance = userSnap.exists() ? userSnap.data().tokenBalance || 0 : 0;

                await setDoc(userRef, { tokenBalance: currentBalance + crbAmount }, { merge: true });
                await setDoc(txRef, {
                    userId: user.uid,
                    type: "purchase",
                    crbAmount: crbAmount,
                    krwAmount: selectedPlan.price,
                    description: `CRB 충전 (${selectedPlan.name} - 모의 결제)`,
                    tossOrderId: `mock_order_${Date.now()}`,
                    tossPaymentKey: `mock_payment_${Date.now()}`,
                    status: "completed",
                    createdAt: serverTimestamp()
                });

                // 로컬 상태 즉시 업데이트
                setProfile(prev => prev ? { ...prev, tokenBalance: prev.tokenBalance + crbAmount } : prev);

                setIsChargeModalOpen(false);
                setModal({
                    isOpen: true,
                    title: '결제 성공! 🎉',
                    message: `${crbAmount} CRB가 성공적으로 충전되었습니다. (모의 결제)`,
                    type: 'alert'
                });
            } catch (error) {
                console.error('Mock payment failed:', error);
                setModal({
                    isOpen: true,
                    title: '결제 실패',
                    message: '모의 결제 처리 중 오류가 발생했습니다.',
                    type: 'alert'
                });
            }
        }, 1500);
    };

    // Deep Linking for Shared Services
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const rawServiceId = urlParams.get('serviceId');

        if (rawServiceId) {
            // OS 공유 기능으로 복사 시 텍스트가 함께 붙여넣어지는 경우를 대비해 ID만 추출
            const serviceId = rawServiceId.split(/[\s\n]/)[0].replace(/[^a-zA-Z0-9_-]/g, '');

            const fetchSharedService = async () => {
                try {
                    const docRef = doc(db, 'services', serviceId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const service = { id: docSnap.id, ...docSnap.data() } as WebService;
                        setSelectedService(service);
                        incrementView(service);
                    } else {
                        setModal({
                            isOpen: true,
                            title: '서비스를 찾을 수 없습니다',
                            message: '삭제되었거나 존재하지 않는 서비스입니다.',
                            type: 'alert'
                        });
                    }
                } catch (error) {
                    console.error("Error fetching shared service:", error);
                } finally {
                    // Clean up URL after opening or failing
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            };

            fetchSharedService();
        }
    }, []);

    // Fetch Admin Stats
    useEffect(() => {
        if (viewMode === 'admin' && user?.email === ADMIN_EMAIL) {
            const fetchStats = async () => {
                try {
                    const usersSnap = await getDocs(collection(db, 'users'));
                    const txSnap = await getDocs(collection(db, 'transactions'));

                    let totalRevenue = 0;
                    txSnap.forEach(doc => {
                        if (doc.data().type === 'purchase') {
                            totalRevenue += doc.data().crbAmount || 0;
                        }
                    });

                    setAdminStats({
                        users: usersSnap.size,
                        revenue: totalRevenue
                    });
                } catch (error) {
                    console.error("Failed to fetch admin stats:", error);
                }
            };
            fetchStats();
        }
    }, [viewMode, user]);

    const handleShare = async (service: WebService) => {
        if (isSharing) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}?serviceId=${service.id}`;

        if (navigator.share) {
            try {
                setIsSharing(true);
                await navigator.share({
                    title: `${service.title} - CrabSter`,
                    text: service.description,
                    url: shareUrl,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError' && !err.message?.includes('canceled')) {
                    console.error('Share failed:', err);
                }
            } finally {
                setIsSharing(false);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setModal({
                    isOpen: true,
                    title: '링크 복사 완료',
                    message: '서비스 링크가 클립보드에 복사되었습니다. 친구들에게 공유해보세요!',
                    type: 'alert'
                });
            } catch (err) {
                console.error('Clipboard copy failed:', err);
            }
        }
    };

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = () => {
        setModal({
            isOpen: true,
            title: '로그아웃',
            message: '정말로 로그아웃 하시겠습니까?',
            type: 'confirm',
            onConfirm: () => {
                auth.signOut();
                setViewMode('playground');
                setEditingService(null);
                setChatMessages([]);
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const deleteService = (serviceId: string) => {
        setModal({
            isOpen: true,
            title: '서비스 삭제',
            message: '정말로 이 서비스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const q = query(collection(db, 'services'), where('id', '==', serviceId));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        await deleteDoc(doc(db, 'services', snap.docs[0].id));
                    }
                } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `services/${serviceId}`);
                }
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const toggleFeature = async (service: WebService) => {
        if (user?.email !== ADMIN_EMAIL) return;
        try {
            const q = query(collection(db, 'services'), where('id', '==', service.id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docRef = doc(db, 'services', snap.docs[0].id);
                await updateDoc(docRef, { isFeatured: !service.isFeatured });
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
        }
    };

    const generateService = async () => {
        if (!interest.trim() || !user || !profile) return;

        // Token Check (Minimum required to start)
        const MIN_REQUIRED = 200;
        if (user.email !== ADMIN_EMAIL && profile.tokenBalance < MIN_REQUIRED) {
            setModal({
                isOpen: true,
                title: 'CRB 부족 🦀',
                message: `서비스를 생성하려면 ${MIN_REQUIRED} CRB가 필요합니다.\n현재 잔액: ${profile.tokenBalance} CRB`,
                type: 'confirm',
                onConfirm: () => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setIsChargeModalOpen(true);
                }
            });
            return;
        }

        setLoading(true);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: `당신은 세계 최고의 웹 개발자입니다. 다음 아이디어를 바탕으로 완벽하게 작동하는 단일 파일 웹 서비스를 만들어주세요: "${interest}".
        
        요구사항:
        1. HTML, CSS, JavaScript가 모두 포함된 단일 파일이어야 합니다.
        2. 디자인은 현대적이고 세련되어야 합니다 (Tailwind CSS CDN 사용 가능).
        3. 실제 기능이 동작해야 합니다.
        4. 한국어로 작성해주세요.
        5. 코드의 <body> 태그 바로 아래에 반드시 다음 구글 애드센스 코드를 삽입하세요: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1192182296807526" crossorigin="anonymous"></script><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-1192182296807526" data-ad-slot="AUTO_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        
        응답은 반드시 JSON 형식이어야 하며, 다음 필드를 포함해야 합니다:
        - title: 서비스 이름
        - description: 서비스 설명
        - code: 전체 HTML/JS/CSS 코드
        - tags: 관련 태그 리스트`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            code: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["title", "description", "code", "tags"]
                    }
                }
            });

            const result = JSON.parse(response.text || '{}');

            // Calculate dynamic cost based on actual token usage
            const totalTokens = response.usageMetadata?.totalTokenCount || 100; // Fallback if metadata is missing
            let cost = user.email === ADMIN_EMAIL ? 0 : Math.max(100, Math.ceil(totalTokens * 0.01)); // 1000 tokens = 10 CRB, min 100

            // Extract colors from code for better thumbnail
            const colorMatches = result.code.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g);
            const extractedColors = colorMatches ? [...new Set(colorMatches)].slice(0, 4).join(', ') : 'modern, vibrant colors';

            // Deduct Tokens
            const finalBalance = Math.max(0, profile.tokenBalance - cost);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                tokenBalance: finalBalance
            });

            // Save Service
            const serviceId = Math.random().toString(36).substring(2, 15);
            const serviceRef = doc(db, 'services', serviceId);
            const newService = {
                id: serviceId,
                authorUid: user.uid,
                authorName: profile.displayName,
                title: result.title,
                description: result.description,
                code: result.code,
                thumbnailUrl: '', // Will be captured automatically
                views: 0,
                likes: 0,
                tags: result.tags,
                isPublished: false,
                createdAt: serverTimestamp(),
            };
            await setDoc(serviceRef, newService);

            // Add Transaction
            const transId = Math.random().toString(36).substring(2, 15);
            const transRef = doc(db, 'transactions', transId);
            await setDoc(transRef, {
                userId: user.uid,
                crbAmount: -cost,
                type: 'spend',
                description: `'${result.title}' 서비스 생성`,
                createdAt: serverTimestamp()
            });

            setEditingService({ ...newService, createdAt: new Date() } as WebService);
            setViewMode('editor');
            setInterest('');

            // Attempt to auto-capture thumbnail after a short delay to allow iframe to render
            setTimeout(() => {
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    try {
                        const iframeDoc = iframeRef.current.contentWindow.document;
                        html2canvas(iframeDoc.body, {
                            useCORS: true,
                            backgroundColor: iframeDoc.body.style.backgroundColor || '#ffffff',
                            scale: 1,
                            width: 800,
                            height: 600,
                            windowWidth: 800,
                            windowHeight: 600,
                            logging: false,
                            imageTimeout: 5000,
                        }).then(async canvas => {
                            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                            setEditingService(prev => prev ? { ...prev, thumbnailUrl } : prev);
                            // Also update the DB with the captured thumbnail
                            await updateDoc(serviceRef, { thumbnailUrl });
                        }).catch(e => console.error("Auto-capture failed:", e));
                    } catch (e) {
                        console.error("Auto-capture failed:", e);
                    }
                }
            }, 2000);

            setModal({
                isOpen: true,
                title: '초안 생성 완료!',
                message: `실제 사용량에 비례하여 ${cost.toLocaleString()} CRB가 차감되었습니다. 이제 코드를 수정하거나 설정을 변경할 수 있습니다.`,
                type: 'alert'
            });
        } catch (error: any) {
            console.error("Generation failed:", error);
            setModal({
                isOpen: true,
                title: '오류 발생',
                message: getFriendlyErrorMessage(error, '서비스 생성 중 오류가 발생했습니다.'),
                type: 'alert'
            });
        } finally {
            setLoading(false);
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !user || !profile || !editingService) return;

        const MIN_REQUIRED = 5;
        if (user.email !== ADMIN_EMAIL && profile.tokenBalance < MIN_REQUIRED) {
            setModal({
                isOpen: true,
                title: 'CRB 부족 🦀',
                message: `채팅을 위해 최소 ${MIN_REQUIRED} CRB가 필요합니다.\n현재 잔액: ${profile.tokenBalance} CRB`,
                type: 'confirm',
                onConfirm: () => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setIsChargeModalOpen(true);
                }
            });
            return;
        }

        const newMessage = { role: 'user' as const, text: chatInput };
        const updatedMessages = [...chatMessages, newMessage];
        setChatMessages(updatedMessages);
        setChatInput('');
        setIsChatting(true);

        try {
            const historyText = updatedMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: `당신은 세계 최고의 시니어 웹 개발자이자 아키텍트입니다. 사용자는 현재 단일 파일 HTML/JS/CSS 웹 서비스를 편집 중입니다.
        
현재 코드:
\`\`\`html
${editingService.code}
\`\`\`

대화 기록:
${historyText}

위 대화 기록의 마지막 사용자의 말에 답변하세요. 코드를 직접 수정해서 전체 코드를 반환하지 말고, 현재 코드를 정확히 분석하여 사용자와 설계나 수정 방향에 대해 논의하고 구체적이고 실질적인 조언을 제공하세요. 친절하고 전문적인 어조로 답변하세요.`
            });

            const totalTokens = response.usageMetadata?.totalTokenCount || 50;
            const cost = user.email === ADMIN_EMAIL ? 0 : Math.ceil(totalTokens * 0.002);

            const assistantMessage = { role: 'model' as const, text: response.text || '' };
            setChatMessages([...updatedMessages, assistantMessage]);

            const finalBalance = Math.max(0, profile.tokenBalance - cost);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { tokenBalance: finalBalance });

            const transId = Math.random().toString(36).substring(2, 15);
            await setDoc(doc(db, 'transactions', transId), {
                userId: user.uid, crbAmount: -cost, type: 'spend',
                description: `'${editingService.title}' 채팅`, createdAt: serverTimestamp()
            });

        } catch (error: any) {
            console.error(error);
            setModal({
                isOpen: true,
                title: '오류 발생',
                message: getFriendlyErrorMessage(error, '채팅 중 오류가 발생했습니다.'),
                type: 'alert'
            });
        } finally {
            setIsChatting(false);
        }
    };

    const applyChatToCode = async () => {
        if (!user || !profile || !editingService || chatMessages.length === 0) return;

        const MIN_REQUIRED = 5;
        if (user.email !== ADMIN_EMAIL && profile.tokenBalance < MIN_REQUIRED) {
            setModal({
                isOpen: true,
                title: 'CRB 부족 🦀',
                message: `코드를 반영하기 위해 최소 ${MIN_REQUIRED} CRB가 필요합니다.\n현재 잔액: ${profile.tokenBalance} CRB`,
                type: 'confirm',
                onConfirm: () => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setIsChargeModalOpen(true);
                }
            });
            return;
        }

        setIsEditingCode(true);
        try {
            const historyText = chatMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: `당신은 세계 최고의 웹 개발자입니다. 다음은 현재 작성된 단일 파일 웹 서비스의 전체 HTML 코드입니다:
        \`\`\`html
        ${editingService.code}
        \`\`\`
        
        지금까지 사용자와 나눈 대화 기록입니다:
        ${historyText}
        
        위 대화 기록을 바탕으로 최종적으로 합의된 내용을 코드에 반영해주세요. 
        응답은 반드시 수정된 전체 HTML 코드만 포함해야 하며, 마크다운 백틱(\`\`\`)이나 다른 설명은 절대 포함하지 마세요. 오직 유효한 HTML 문자열만 반환하세요.`
            });

            const totalTokens = response.usageMetadata?.totalTokenCount || 50;
            const cost = user.email === ADMIN_EMAIL ? 0 : Math.ceil(totalTokens * 0.002);

            let newCode = response.text || '';
            newCode = newCode.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

            setEditingService({ ...editingService, code: newCode });

            const finalBalance = Math.max(0, profile.tokenBalance - cost);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { tokenBalance: finalBalance });

            const transId = Math.random().toString(36).substring(2, 15);
            await setDoc(doc(db, 'transactions', transId), {
                userId: user.uid, crbAmount: -cost, type: 'spend',
                description: `'${editingService.title}' 코드 반영`, createdAt: serverTimestamp()
            });

            setModal({
                isOpen: true,
                title: '코드 반영 완료!',
                message: `실제 사용량에 비례하여 ${cost.toLocaleString()} CRB가 차감되었습니다. (아직 DB에 저장되지 않았으니 '저장 및 나가기'를 눌러주세요)`,
                type: 'alert'
            });
        } catch (error: any) {
            console.error(error);
            setModal({
                isOpen: true,
                title: '오류 발생',
                message: getFriendlyErrorMessage(error, '코드 반영 중 오류가 발생했습니다.'),
                type: 'alert'
            });
        } finally {
            setIsEditingCode(false);
        }
    };

    const directEditCode = async () => {
        if (!editPrompt.trim() || !user || !profile || !editingService) return;

        const MIN_REQUIRED = 5;
        if (user.email !== ADMIN_EMAIL && profile.tokenBalance < MIN_REQUIRED) {
            setModal({
                isOpen: true,
                title: 'CRB 부족 🦀',
                message: `코드를 수정하기 위해 최소 ${MIN_REQUIRED} CRB가 필요합니다.\n현재 잔액: ${profile.tokenBalance} CRB`,
                type: 'confirm',
                onConfirm: () => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setIsChargeModalOpen(true);
                }
            });
            return;
        }

        setIsEditingCode(true);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: `당신은 세계 최고의 시니어 웹 개발자입니다. 다음은 현재 작동 중인 단일 파일 웹 서비스의 전체 HTML/JS/CSS 코드입니다:
        \`\`\`html
        ${editingService.code}
        \`\`\`
        
        사용자의 추가 수정 요청: "${editPrompt}"
        
        위 요청을 완벽하게 반영하여 코드를 수정해주세요. 기존에 잘 작동하던 기능이나 디자인이 망가지지 않도록 주의하세요.
        응답은 반드시 수정된 전체 HTML 코드만 포함해야 하며, 마크다운 백틱(\`\`\`)이나 다른 설명은 절대 포함하지 마세요. 오직 유효한 HTML 문자열만 반환하세요.`
            });

            const totalTokens = response.usageMetadata?.totalTokenCount || 50;
            const cost = user.email === ADMIN_EMAIL ? 0 : Math.ceil(totalTokens * 0.002);

            let newCode = response.text || '';
            newCode = newCode.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

            setEditingService({ ...editingService, code: newCode });

            const finalBalance = Math.max(0, profile.tokenBalance - cost);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { tokenBalance: finalBalance });

            const transId = Math.random().toString(36).substring(2, 15);
            await setDoc(doc(db, 'transactions', transId), {
                userId: user.uid, crbAmount: -cost, type: 'spend',
                description: `'${editingService.title}' 직접 코드 수정`, createdAt: serverTimestamp()
            });

            setEditPrompt('');

            setModal({
                isOpen: true,
                title: '코드 수정 완료!',
                message: `실제 사용량에 비례하여 ${cost.toLocaleString()} CRB가 차감되었습니다. (아직 DB에 저장되지 않았으니 '저장 및 나가기'를 눌러주세요)`,
                type: 'alert'
            });
        } catch (error: any) {
            console.error(error);
            setModal({
                isOpen: true,
                title: '오류 발생',
                message: getFriendlyErrorMessage(error, '코드 수정 중 오류가 발생했습니다.'),
                type: 'alert'
            });
        } finally {
            setIsEditingCode(false);
        }
    };

    const generateThumbnail = async () => {
        if (!user || !profile || !editingService) return;

        const MIN_REQUIRED = 15;
        if (user.email !== ADMIN_EMAIL && profile.tokenBalance < MIN_REQUIRED) {
            setModal({
                isOpen: true,
                title: 'CRB 부족 🦀',
                message: `썸네일을 생성하기 위해 최소 ${MIN_REQUIRED.toLocaleString()} CRB가 필요합니다.\n현재 잔액: ${profile.tokenBalance} CRB`,
                type: 'confirm',
                onConfirm: () => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setIsChargeModalOpen(true);
                }
            });
            return;
        }

        setIsGeneratingThumbnail(true);
        try {
            // Extract colors from code for better thumbnail
            const colorMatches = editingService.code.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g);
            const extractedColors = colorMatches ? [...new Set(colorMatches)].slice(0, 4).join(', ') : 'modern, vibrant colors';

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        {
                            text: `A clean, flat UI/UX web design mockup for a service named "${editingService.title}". Description: "${editingService.description}". The design MUST use this specific color palette: ${extractedColors}. Style: Dribbble shot, modern website interface, minimalist, vector, high resolution, abstract layout. Do not include any literal text or words.`,
                        },
                    ],
                },
            });

            let imageUrl = '';
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    const rawBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    imageUrl = await compressImage(rawBase64);
                    break;
                }
            }

            if (!imageUrl) throw new Error("Failed to generate image");

            const cost = user.email === ADMIN_EMAIL ? 0 : 15;
            const finalBalance = Math.max(0, profile.tokenBalance - cost);

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { tokenBalance: finalBalance });

            const transId = Math.random().toString(36).substring(2, 15);
            await setDoc(doc(db, 'transactions', transId), {
                userId: user.uid, crbAmount: -cost, type: 'spend',
                description: `'${editingService.title}' 썸네일 자동 생성`, createdAt: serverTimestamp()
            });

            setEditingService({ ...editingService, thumbnailUrl: imageUrl });

            setModal({
                isOpen: true,
                title: '썸네일 생성 완료!',
                message: `실제 사용량에 비례하여 ${cost.toLocaleString()} CRB가 차감되었습니다. (아직 DB에 저장되지 않았으니 '저장'을 눌러주세요)`,
                type: 'alert'
            });
        } catch (error) {
            console.error(error);
            setModal({
                isOpen: true,
                title: '오류 발생',
                message: '썸네일 생성 중 오류가 발생했습니다.',
                type: 'alert'
            });
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const captureThumbnail = async () => {
        if (!iframeRef.current || !iframeRef.current.contentWindow || !user || !profile || !editingService) return;

        setIsGeneratingThumbnail(true);
        try {
            const iframeDoc = iframeRef.current.contentWindow.document;
            const canvas = await html2canvas(iframeDoc.body, {
                useCORS: true,
                backgroundColor: iframeDoc.body.style.backgroundColor || '#ffffff',
                scale: 1, // Keep it light
                width: 800,
                height: 600,
                windowWidth: 800,
                windowHeight: 600,
                logging: false,
                imageTimeout: 5000,
            });

            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            setEditingService({ ...editingService, thumbnailUrl });

            setModal({
                isOpen: true,
                title: '화면 캡쳐 완료!',
                message: `현재 미리보기 화면이 썸네일로 캡쳐되었습니다. (무료)`,
                type: 'alert'
            });
        } catch (error) {
            console.error("Capture failed", error);
            setModal({
                isOpen: true,
                title: '캡쳐 실패',
                message: '화면 캡쳐 중 오류가 발생했습니다. AI 자동 생성을 이용해주세요.',
                type: 'alert'
            });
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setModal({
                isOpen: true,
                title: '용량 초과',
                message: '이미지 크기는 2MB를 초과할 수 없습니다.',
                type: 'alert'
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setEditingService({ ...editingService, thumbnailUrl: dataUrl });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const saveServiceMetadata = async () => {
        if (!editingService) return;

        if (!editingService.title.trim()) {
            setModal({ isOpen: true, title: '입력 오류', message: '서비스 이름을 입력해주세요.', type: 'alert' });
            return;
        }
        if (!editingService.code.trim()) {
            setModal({ isOpen: true, title: '입력 오류', message: '코드가 비어있습니다.', type: 'alert' });
            return;
        }

        try {
            const serviceRef = doc(db, 'services', editingService.id);
            await updateDoc(serviceRef, {
                title: editingService.title,
                description: editingService.description || "",
                tags: (editingService.tags || []).slice(0, 10),
                code: editingService.code,
                thumbnailUrl: editingService.thumbnailUrl || "",
                isPublished: editingService.isPublished ?? true,
            });
            setModal({
                isOpen: true,
                title: '저장 완료',
                message: '서비스가 성공적으로 저장되었습니다!',
                type: 'alert'
            });
            setViewMode('profile');
            setEditingService(null);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `services/${editingService.id}`);
        }
    };

    const incrementView = async (service: WebService) => {
        try {
            const serviceRef = doc(db, 'services', service.id);
            await updateDoc(serviceRef, {
                views: service.views + 1
            });
            if (selectedService?.id === service.id) {
                setSelectedService(prev => prev ? { ...prev, views: prev.views + 1 } : null);
            }
        } catch (error) {
            console.error("Failed to increment view:", error);
        }
    };

    const handleLike = async (service: WebService) => {
        if (!user) {
            setModal({
                isOpen: true,
                title: '로그인 필요',
                message: '좋아요를 누르려면 로그인이 필요합니다.',
                type: 'alert'
            });
            return;
        }
        try {
            const serviceRef = doc(db, 'services', service.id);
            await updateDoc(serviceRef, {
                likes: service.likes + 1
            });
            if (selectedService?.id === service.id) {
                setSelectedService(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
            }

            // Update local services array immediately for better UX
            setServices(prev => prev.map(s => s.id === service.id ? { ...s, likes: s.likes + 1 } : s));
        } catch (error) {
            console.error("Failed to like:", error);
        }
    };

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <CrabLogo className="w-20 h-20 text-red-500 animate-bounce" />
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black tracking-tighter text-white">CrabSter</h1>
                    <p className="text-gray-500 text-sm animate-pulse">코드 갱스터들의 아지트 접속 중...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
                {/* Background Glow */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-500/5 blur-[150px] rounded-full" />
                    <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[150px] rounded-full" />
                </div>

                {/* Navigation */}
                <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setViewMode('playground')}
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform group-hover:rotate-12">
                                <CrabLogo className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                CrabSter
                            </h1>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
                            <button
                                onClick={() => setViewMode('playground')}
                                className={`hover:text-white transition-colors ${viewMode === 'playground' ? 'text-orange-500' : ''}`}
                            >
                                놀이터 광장
                            </button>
                            <button
                                onClick={() => setViewMode('builder')}
                                className={`hover:text-white transition-colors ${viewMode === 'builder' ? 'text-orange-500' : ''}`}
                            >
                                서비스 제작소
                            </button>
                            <button
                                onClick={() => setViewMode('hall_of_fame')}
                                className={`hover:text-white transition-colors ${viewMode === 'hall_of_fame' ? 'text-orange-500' : ''}`}
                            >
                                명예의 전당
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <div
                                        className="hidden sm:flex flex-col items-end cursor-pointer group"
                                        onClick={() => setIsChargeModalOpen(true)}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-orange-500 transition-colors">내 CRB</span>
                                        <span className={`font-black flex items-center gap-1 transition-colors ${profile && profile.tokenBalance <= 10 ? 'text-red-500' : 'text-orange-500'}`}>
                      <Wallet className="w-3 h-3" /> {profile?.tokenBalance?.toLocaleString()}
                    </span>
                                    </div>
                                    <button
                                        onClick={() => setViewMode('profile')}
                                        className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden hover:border-orange-500 transition-colors"
                                    >
                                        <img src={user.photoURL || ''} alt="Profile" referrerPolicy="no-referrer" />
                                    </button>
                                    <button onClick={logout} className="p-2 text-gray-500 hover:text-white transition-colors">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={login}
                                    className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" /> 시작하기
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="relative max-w-7xl mx-auto px-6 py-12">
                    {viewMode === 'playground' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            {/* Hero / Search */}
                            <div className="text-center space-y-6">
                                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight sm:leading-none break-keep">
                                    상상력을 코드로 <span className="text-red-500">낚아채라</span> <br className="hidden sm:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                    개발 갱스터들의 아지트
                  </span>
                                </h2>
                                <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto break-keep">
                                    자연어로 뚝딱 만들고, 전 세계 사람들과 쿨하게 공유하세요. <br className="hidden sm:block" />
                                    누구나 개발자가 될 수 있는 마법 같은 공간, CrabSter입니다.
                                </p>
                                <div className="max-w-2xl mx-auto relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                    <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-2">
                                        <Search className="w-5 h-5 text-gray-500 ml-4" />
                                        <input
                                            type="text"
                                            placeholder="제목, 설명, 태그로 검색해보세요"
                                            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-white outline-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <div className="hidden sm:flex items-center gap-2 px-4 text-[10px] font-bold text-gray-600 border-l border-white/5">
                                            <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</span>
                                            <span>지우기</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_MAIN || ''} />

                            {/* Featured Section */}
                            {services.some(s => s.isFeatured) && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-yellow-500" /> 관리자 추천 서비스
                                        </h3>
                                    </div>
                                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {services.filter(s => s.isFeatured && s.isPublished !== false).map((service) => (
                                            <motion.div
                                                key={service.id}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    incrementView(service);
                                                }}
                                                className="relative group h-64 w-[300px] md:w-[400px] shrink-0 snap-center rounded-3xl overflow-hidden cursor-pointer border border-white/10"
                                            >
                                                <img
                                                    src={service.thumbnailUrl || `https://picsum.photos/seed/${service.id}/800/450`}
                                                    alt={service.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
                                                    <div className="flex gap-2">
                                                        {service.tags.slice(0, 2).map((tag, i) => (
                                                            <span key={i} className="px-2 py-1 bg-orange-500 text-white rounded text-[10px] font-bold uppercase whitespace-nowrap truncate max-w-[80px]">
                                {tag}
                              </span>
                                                        ))}
                                                    </div>
                                                    <h4 className="text-3xl font-black">{service.title}</h4>
                                                    <p className="text-gray-300 text-sm line-clamp-1">{service.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Service Grid with Ranking Logic */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-6 h-6 text-orange-500" /> 인기 급상승 서비스
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSortBy('latest')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'latest' ? 'bg-orange-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            최신순
                                        </button>
                                        <button
                                            onClick={() => setSortBy('popular')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'popular' ? 'bg-orange-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            인기순
                                        </button>
                                    </div>
                                </div>

                                {services.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {services
                                            .filter(s => s.isPublished !== false)
                                            .filter(s =>
                                                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                                            )
                                            .sort((a, b) => {
                                                if (sortBy === 'popular') {
                                                    return (b.views + b.likes * 2) - (a.views + a.likes * 2);
                                                } else {
                                                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                                                }
                                            })
                                            .map((service, index) => (
                                                <motion.div
                                                    key={service.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ y: -8 }}
                                                    className="group bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all shadow-2xl"
                                                >
                                                    <div className="aspect-video relative overflow-hidden">
                                                        <img
                                                            src={service.thumbnailUrl || `https://picsum.photos/seed/${service.id}/800/450`}
                                                            alt={service.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                                        <div className="absolute top-4 left-4 flex gap-2">
                                                            {service.tags.slice(0, 2).map((tag, i) => (
                                                                <span key={i} className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-orange-400 uppercase whitespace-nowrap truncate max-w-[80px]">
                                {tag}
                              </span>
                                                            ))}
                                                        </div>
                                                        {index < 3 && (
                                                            <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-xs shadow-lg">
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                                    {service.authorName[0]}
                                                                </div>
                                                                <span className="text-xs text-gray-400 font-medium">{service.authorName}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase">
                              {new Date(service.createdAt?.seconds * 1000).toLocaleDateString()}
                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">{service.title}</h3>
                                                        <p className="text-gray-500 text-sm line-clamp-2">{service.description}</p>
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                                                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {service.views}</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleLike(service); }}
                                                                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Heart className="w-4 h-4" /> {service.likes}
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleShare(service); }}
                                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                                                    title="공유하기"
                                                                >
                                                                    <Share2 className="w-4 h-4" />
                                                                </button>
                                                                {user?.email === ADMIN_EMAIL && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleFeature(service);
                                                                            }}
                                                                            className={`p-2 rounded-lg transition-all ${service.isFeatured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-gray-500 hover:text-yellow-500'}`}
                                                                            title={service.isFeatured ? "추천 해제" : "추천하기"}
                                                                        >
                                                                            <Trophy className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteService(service.id);
                                                                            }}
                                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                                                                            title="삭제"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedService(service);
                                                                        incrementView(service);
                                                                    }}
                                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                                                                >
                                                                    실행하기 <ExternalLink className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                            <Layout className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-gray-500 font-bold">아직 등록된 서비스가 없습니다.</p>
                                        <button
                                            onClick={() => setViewMode('builder')}
                                            className="text-orange-500 text-sm font-bold hover:underline"
                                        >
                                            첫 번째 서비스의 주인공이 되어보세요!
                                        </button>
                                    </div>
                                )}
                            </div>

                            <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_MAIN || ''} />
                        </motion.div>
                    )}

                    {viewMode === 'builder' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-4xl mx-auto space-y-12"
                        >
                            <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_MAIN || ''} />

                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Plus className="w-10 h-10 text-orange-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter">무엇을 만들고 싶으신가요?</h2>
                                <p className="text-gray-400">자연어로 설명하면 AI가 즉시 웹 서비스를 구축합니다.</p>
                            </div>

                            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">서비스 설명</label>
                                    <textarea
                                        value={interest}
                                        onChange={(e) => setInterest(e.target.value)}
                                        placeholder="예: 실시간 환율 계산기, 고양이 사진 갤러리, 간단한 할 일 목록 앱..."
                                        className="w-full h-40 bg-black/50 border border-white/5 rounded-2xl p-6 text-white placeholder:text-gray-700 focus:border-orange-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">예상 소모 CRB</div>
                                            <div className="text-xs text-gray-500">AI 연산량에 따라 동적 차감</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-orange-500">사용량 비례</div>
                                        <div className="text-[10px] text-gray-500 mt-1">최소 200 CRB 필요</div>
                                    </div>
                                </div>

                                <button
                                    onClick={generateService}
                                    disabled={loading || !interest.trim() || !user}
                                    className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-600/20"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {user ? '지금 바로 서비스 생성하기' : '로그인이 필요합니다'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    <h4 className="font-bold">즉시 배포</h4>
                                    <p className="text-xs text-gray-500">생성 즉시 놀이터 광장에 공개됩니다.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                    <Code className="w-6 h-6 text-orange-500" />
                                    <h4 className="font-bold">자유로운 수정</h4>
                                    <p className="text-xs text-gray-500">생성된 코드를 직접 수정하거나 AI에게 맡기세요.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <h4 className="font-bold">랭킹 시스템</h4>
                                    <p className="text-xs text-gray-500">인기 서비스가 되어 명예의 전당에 오르세요.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'profile' && profile && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto space-y-12"
                        >
                            <div className="flex items-center gap-8 p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl">
                                <img src={user?.photoURL || ''} alt="Avatar" className="w-24 h-24 rounded-3xl border-4 border-orange-500/20" referrerPolicy="no-referrer" />
                                <div className="flex-1">
                                    <h2 className="text-3xl font-black tracking-tighter">{profile.displayName}</h2>
                                    <p className="text-gray-500">{profile.email}</p>
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <div className="px-4 py-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                            <span className="text-xs font-bold text-gray-500 uppercase block">보유 CRB</span>
                                            <span className="text-xl font-black text-orange-500">{profile.tokenBalance.toLocaleString()} CRB</span>
                                        </div>
                                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                            <span className="text-xs font-bold text-gray-500 uppercase block">제작 서비스</span>
                                            <span className="text-xl font-black text-white">{services.filter(s => s.authorUid === user?.uid).length}개</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setIsChargeModalOpen(true)}
                                        className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all"
                                    >
                                        CRB 충전하기
                                    </button>
                                    {user?.email === ADMIN_EMAIL && (
                                        <button
                                            onClick={async () => {
                                                const userRef = doc(db, 'users', user.uid);
                                                await updateDoc(userRef, { tokenBalance: profile.tokenBalance + 100000 });
                                                setModal({ isOpen: true, title: '충전 완료', message: '관리자 권한으로 100,000 CRB가 충전되었습니다.', type: 'alert' });
                                            }}
                                            className="px-6 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                                        >
                                            관리자: 100,000 CRB 충전
                                        </button>
                                    )}
                                    {user?.email === ADMIN_EMAIL && (
                                        <div className="px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                                            <span className="text-[10px] font-black text-red-500 uppercase">관리자 계정 활성화됨</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-orange-500" /> 내가 만든 서비스
                                    </h3>
                                    <div className="space-y-4">
                                        {services.filter(s => s.authorUid === user?.uid).length > 0 ? (
                                            services.filter(s => s.authorUid === user?.uid).map(service => (
                                                <div key={service.id} className="p-4 bg-[#111] border border-white/10 rounded-2xl flex items-center gap-4 group">
                                                    <img src={service.thumbnailUrl} alt="" className="w-20 h-12 rounded-lg object-cover" />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-sm flex items-center gap-2">
                                                            {service.title}
                                                            {service.isPublished === false && (
                                                                <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-[8px] rounded uppercase">초안</span>
                                                            )}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-bold uppercase">
                                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {service.views}</span>
                                                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {service.likes}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleShare(service)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                                            title="공유하기"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingService(service);
                                                                setViewMode('editor');
                                                            }}
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                                            title="수정하기"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedService(service)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                                            title="실행하기"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteService(service.id)}
                                                            className="p-2 bg-red-500/5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                                                            title="삭제하기"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                                <p className="text-gray-500 text-sm">아직 제작한 서비스가 없습니다.</p>
                                                <button
                                                    onClick={() => setViewMode('builder')}
                                                    className="mt-4 text-orange-500 text-xs font-bold hover:underline"
                                                >
                                                    첫 서비스 만들러 가기
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <History className="w-5 h-5 text-orange-500" /> 결제 및 사용 내역
                                    </h3>
                                    <div className="bg-[#111] border border-white/10 rounded-3xl divide-y divide-white/5 overflow-hidden">
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-300">{tx.description}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">
                                                            {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className={`font-black ${tx.type === 'purchase' ? 'text-green-500' : 'text-orange-500'}`}>
                                                        {tx.type === 'purchase' ? '+' : ''}{tx.crbAmount || tx.amount} CRB
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center text-gray-600 italic">
                                                최근 내역이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {viewMode === 'editor' && editingService && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6"
                        >
                            {/* Left: Live Preview */}
                            <div className="lg:col-span-7 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[800px] lg:sticky lg:top-6 order-2 lg:order-1">
                                <div className="p-4 bg-black/50 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">미리보기</span>
                                    <div className="w-16" />
                                </div>
                                <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_DETAIL || ''} />
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={editingService.code}
                                    className="w-full flex-1 bg-white"
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    title="Preview"
                                />
                            </div>

                            {/* Right: Settings & AI Assistant */}
                            <div className="lg:col-span-5 space-y-6 flex flex-col order-1 lg:order-2">
                                <div className="flex items-center justify-between shrink-0">
                                    <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                                        <Settings className="w-6 h-6 text-orange-500" /> 서비스 관리
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingService({ ...editingService, isPublished: !editingService.isPublished })}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editingService.isPublished ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'}`}
                                        >
                                            {editingService.isPublished ? '게시됨' : '미노출'}
                                        </button>
                                        <button
                                            onClick={saveServiceMetadata}
                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> 저장
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl shrink-0">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">서비스 이름</label>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            value={editingService.title}
                                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                                            className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">서비스 설명</label>
                                        <textarea
                                            maxLength={500}
                                            value={editingService.description}
                                            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                            className="w-full h-16 bg-black/50 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">태그 (쉼표로 구분)</label>
                                        <input
                                            type="text"
                                            value={editingService.tags.join(', ')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val.endsWith(',')) {
                                                    setEditingService({ ...editingService, tags: [...val.slice(0, -1).split(',').map(t => t.trim()).filter(t => t), ''] });
                                                } else {
                                                    setEditingService({ ...editingService, tags: val.split(',').map(t => t.trim()) });
                                                }
                                            }}
                                            onBlur={() => {
                                                setEditingService({ ...editingService, tags: editingService.tags.filter(t => t.trim() !== '') });
                                            }}
                                            className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between">
                                            <span>썸네일 이미지 URL</span>
                                            <div className="flex items-center gap-2">
                                                <label className="cursor-pointer text-green-400 hover:text-green-300 flex items-center gap-1">
                                                    <Plus className="w-3 h-3" />
                                                    직접 업로드
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleThumbnailUpload}
                                                    />
                                                </label>
                                                <button
                                                    onClick={captureThumbnail}
                                                    disabled={isGeneratingThumbnail}
                                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <Camera className="w-3 h-3" />
                                                    화면 캡쳐 (무료)
                                                </button>
                                                <button
                                                    onClick={generateThumbnail}
                                                    disabled={isGeneratingThumbnail}
                                                    className="text-orange-500 hover:text-orange-400 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {isGeneratingThumbnail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    AI 생성 (15 CRB)
                                                </button>
                                            </div>
                                        </label>
                                        <input
                                            type="text"
                                            value={editingService.thumbnailUrl || ''}
                                            onChange={(e) => setEditingService({ ...editingService, thumbnailUrl: e.target.value })}
                                            placeholder="이미지 URL을 입력하거나 AI로 생성하세요"
                                            className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none transition-all"
                                        />
                                        {editingService.thumbnailUrl && (
                                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 relative pt-[56.25%]">
                                                <img
                                                    src={editingService.thumbnailUrl}
                                                    alt="Thumbnail Preview"
                                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#111] border border-orange-500/20 rounded-3xl p-6 shadow-2xl relative flex flex-col min-h-[500px]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500" />

                                    <div className="flex items-center gap-4 mb-4 shrink-0 border-b border-white/10 pb-4">
                                        <button
                                            onClick={() => setAiMode('chat')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${aiMode === 'chat' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                        >
                                            💬 채팅하며 수정
                                        </button>
                                        <button
                                            onClick={() => setAiMode('direct')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${aiMode === 'direct' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                        >
                                            ⚡ 직접 명령 수정
                                        </button>
                                    </div>

                                    {aiMode === 'chat' ? (
                                        <>
                                            <div className="flex-1 space-y-4 pr-2">
                                                {chatMessages.length === 0 ? (
                                                    <div className="text-center text-gray-500 text-sm mt-10">
                                                        어떤 기능을 추가하거나 수정하고 싶으신가요?<br/>편하게 말씀해주세요!
                                                    </div>
                                                ) : (
                                                    chatMessages.map((msg, idx) => (
                                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none whitespace-pre-wrap' : 'bg-white/10 text-gray-200 rounded-tl-none whitespace-pre-wrap'}`}>
                                                                {msg.text}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                {isChatting && (
                                                    <div className="flex justify-start">
                                                        <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-white/10 text-gray-200 rounded-tl-none flex items-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> 입력 중...
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 space-y-3 mt-4 pt-4 border-t border-white/10">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                                sendChatMessage();
                                                            }
                                                        }}
                                                        placeholder="메시지를 입력하세요..."
                                                        className="flex-1 bg-black/50 border border-white/5 rounded-xl p-3 text-white focus:border-orange-500 outline-none transition-all text-sm"
                                                    />
                                                    <button
                                                        onClick={sendChatMessage}
                                                        disabled={isChatting || !chatInput.trim()}
                                                        className="px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={applyChatToCode}
                                                    disabled={isEditingCode || chatMessages.length === 0}
                                                    className="w-full py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
                                                >
                                                    {isEditingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
                                                    {isEditingCode ? '코드 반영 중...' : '논의된 내용 코드로 반영하기'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="space-y-2 mb-4 shrink-0">
                                                <p className="text-xs text-gray-400">원하는 변경사항을 직접 입력하면 AI가 즉시 코드를 수정합니다. (실제 사용량 비례 차감)</p>
                                            </div>
                                            <textarea
                                                value={editPrompt}
                                                onChange={(e) => setEditPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                                        e.preventDefault();
                                                        directEditCode();
                                                    }
                                                }}
                                                placeholder="예: 배경색을 검은색으로 바꿔줘, 버튼 크기를 키워줘..."
                                                className="w-full flex-1 bg-black/50 border border-white/5 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all resize-none mb-4"
                                            />
                                            <button
                                                onClick={directEditCode}
                                                disabled={isEditingCode || !editPrompt.trim()}
                                                className="w-full py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shrink-0"
                                            >
                                                {isEditingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                {isEditingCode ? '수정 중...' : '명령으로 즉시 수정하기'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'hall_of_fame' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-6">
                                <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-500/20">
                                    <Trophy className="w-12 h-12 text-yellow-500" />
                                </div>
                                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                    명예의 전당
                                </h2>
                                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                                    가장 많은 사랑을 받은 최고의 서비스들을 만나보세요.
                                </p>
                            </div>

                            <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_MAIN || ''} />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {services
                                    .filter(s => s.isPublished !== false)
                                    .sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2))
                                    .slice(0, 3)
                                    .map((service, index) => (
                                        <motion.div
                                            key={service.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`relative rounded-3xl p-1 ${index === 0 ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 md:-translate-y-8' : index === 1 ? 'bg-gradient-to-b from-gray-300 to-gray-500' : 'bg-gradient-to-b from-orange-400 to-orange-600'}`}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-black rounded-full border-4 border-black flex items-center justify-center font-black text-xl z-10">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                            <div className="bg-[#111] rounded-[22px] h-full overflow-hidden flex flex-col">
                                                <div className="aspect-video relative">
                                                    <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <h3 className="text-2xl font-black mb-2">{service.title}</h3>
                                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{service.description}</p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                                {service.authorName[0]}
                                                            </div>
                                                            <span className="text-xs text-gray-400">{service.authorName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                                            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {service.views}</span>
                                                            <span className="flex items-center gap-1 text-red-500"><Heart className="w-4 h-4" /> {service.likes}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedService(service)}
                                                        className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                                                    >
                                                        실행해보기
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'terms' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10">
                            <h2 className="text-3xl font-black mb-8">이용약관</h2>
                            <div className="prose prose-invert max-w-none text-gray-400 space-y-4 text-sm">
                                <p><strong>제1조 (목적)</strong><br/>본 약관은 CrabSter(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>
                                <p><strong>제2조 (서비스의 제공)</strong><br/>회사는 AI를 활용한 웹 서비스 생성 및 호스팅 기능을 제공합니다. 결제된 CRB(CrabSter 코인)는 환불이 불가하며, 서비스 내에서만 사용 가능합니다.</p>
                                <p><strong>제3조 (회원의 의무)</strong><br/>회원은 불법적이거나 타인의 권리를 침해하는 서비스를 생성해서는 안 되며, 적발 시 통보 없이 삭제 및 계정 정지 조치될 수 있습니다.</p>
                                <p><strong>제4조 (결제 및 환불)</strong><br/>결제는 토스페이먼츠를 통해 이루어지며, 디지털 재화 특성상 충전 후 사용된 CRB는 환불이 불가능합니다.</p>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'privacy' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10">
                            <h2 className="text-3xl font-black mb-8">개인정보 처리방침</h2>
                            <div className="prose prose-invert max-w-none text-gray-400 space-y-4 text-sm">
                                <p><strong>1. 수집하는 개인정보 항목</strong><br/>이메일 주소, 이름, 프로필 사진, 결제 기록(토스페이먼츠 연동)</p>
                                <p><strong>2. 개인정보의 수집 및 이용 목적</strong><br/>서비스 제공, 결제 처리, 고객 지원, 서비스 개선 및 마케팅</p>
                                <p><strong>3. 개인정보의 보유 및 이용 기간</strong><br/>회원 탈퇴 시까지 보관하며, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
                                <p><strong>4. 개인정보 제3자 제공</strong><br/>결제 처리를 위해 토스페이먼츠에 결제 정보가 제공될 수 있습니다.</p>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'admin' && user?.email === ADMIN_EMAIL && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="flex items-center gap-4 mb-8">
                                <ShieldCheck className="w-10 h-10 text-red-500" />
                                <h2 className="text-4xl font-black">관리자 대시보드</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
                                    <div className="text-gray-500 font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> 총 가입자</div>
                                    <div className="text-4xl font-black text-white">{adminStats.users.toLocaleString()} 명</div>
                                </div>
                                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
                                    <div className="text-gray-500 font-bold mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> 총 생성된 서비스</div>
                                    <div className="text-4xl font-black text-white">{services.length.toLocaleString()} 개</div>
                                </div>
                                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
                                    <div className="text-gray-500 font-bold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4"/> 총 결제 매출 (CRB)</div>
                                    <div className="text-4xl font-black text-green-500">{adminStats.revenue.toLocaleString()} CRB</div>
                                </div>
                            </div>

                            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="text-xl font-bold">전체 서비스 관리</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {services.map(service => (
                                        <div key={service.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                                            <div>
                                                <div className="font-bold text-white">{service.title}</div>
                                                <div className="text-xs text-gray-500">작성자: {service.authorName} | 조회: {service.views} | 좋아요: {service.likes}</div>
                                            </div>
                                            <button
                                                onClick={() => deleteService(service.id)}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </main>

                {/* Service Runner Modal */}
                <AnimatePresence>
                    {selectedService && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
                        >
                            <div className="relative w-full h-full max-w-6xl bg-[#111] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                            <Layout className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">{selectedService.title}</h3>
                                            <p className="text-[10px] text-gray-500">제작자: {selectedService.authorName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleShare(selectedService)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                            title="공유하기"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleLike(selectedService)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                        >
                                            <Heart className="w-5 h-5" />
                                            <span className="text-xs font-bold">{selectedService.likes}</span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedService(null)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                                <AdBanner slotId={import.meta.env.VITE_ADSENSE_SLOT_DETAIL || ''} />
                                <div className="flex-1 bg-white">
                                    <iframe
                                        srcDoc={selectedService.code}
                                        title={selectedService.title}
                                        className="w-full h-full border-none"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                                    />
                                </div>
                                <div className="p-4 bg-black/50 border-t border-white/5 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                    CrabSter - AI GENERATED SERVICE
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal Component */}
                <AnimatePresence>
                    {isChargeModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-black flex items-center gap-2">
                                        🦀 CRB 충전하기
                                    </h3>
                                    <button onClick={() => setIsChargeModalOpen(false)} className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {CRB_PLANS.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan.id === plan.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                        >
                                            {plan.isRecommended && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap shadow-lg">
                                                    ⭐ 추천
                                                </div>
                                            )}
                                            <div className="text-center space-y-2">
                                                <h4 className="font-bold text-gray-300">{plan.name}</h4>
                                                <div className="text-2xl font-black text-white">
                                                    {plan.crb.toLocaleString()} <span className="text-sm font-bold text-orange-500">CRB</span>
                                                </div>
                                                {plan.bonus > 0 && (
                                                    <div className="text-xs font-bold text-green-400">
                                                        + {plan.bonus} 보너스
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-white/10 text-sm font-bold text-gray-400">
                                                    ₩{plan.price.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    (1 CRB당 ₩{Math.round(plan.price / (plan.crb + plan.bonus))})
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white/5 rounded-xl p-6 mb-6 text-center border border-white/10">
                                    <div className="text-orange-500 mb-2">
                                        <CheckCircle2 className="w-12 h-12 mx-auto" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">테스트 결제 모드</h4>
                                    <p className="text-sm text-gray-400">
                                        현재 실제 결제가 이루어지지 않는 모의 결제 모드입니다.<br/>
                                        결제하기 버튼을 누르면 즉시 코인이 충전됩니다.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-orange-500/20"
                                >
                                    ₩{selectedPlan.price.toLocaleString()} 모의 결제하기
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {modal.isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                            >
                                <h3 className="text-2xl font-black mb-4">{modal.title}</h3>
                                <p className="text-gray-400 mb-8">{modal.message}</p>
                                <div className="flex gap-4">
                                    {modal.type === 'confirm' && (
                                        <button
                                            onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                                        >
                                            취소
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (modal.onConfirm) modal.onConfirm();
                                            else setModal(prev => ({ ...prev, isOpen: false }));
                                        }}
                                        className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                                    >
                                        확인
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-2 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                    <CrabLogo className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter">CrabSter</h3>
                            </div>
                            <p className="text-gray-500 max-w-sm break-keep">
                                우리는 룰에 얽매이지 않는 창조의 자유를 즐깁니다. <br className="hidden sm:block" />
                                미친 아이디어를 CrabSter의 집게발로 현실로 끄집어내세요.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">놀이터 메뉴</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><button onClick={() => setViewMode('playground')} className="hover:text-white">광장 구경하기</button></li>
                                <li><button onClick={() => setViewMode('builder')} className="hover:text-white">서비스 만들기</button></li>
                                <li><button className="hover:text-white">랭킹 확인하기</button></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">고객 지원</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><button onClick={() => setViewMode('terms')} className="hover:text-white">이용 약관</button></li>
                                <li><button onClick={() => setViewMode('privacy')} className="hover:text-white">개인정보 처리방침</button></li>
                                {user?.email === ADMIN_EMAIL && (
                                    <li><button onClick={() => setViewMode('admin')} className="hover:text-red-500 font-bold">관리자 대시보드</button></li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600 font-bold uppercase pb-24 md:pb-0">
                        <p>© 2026 CRABSTER. ALL RIGHTS RESERVED.</p>
                    </div>
                </footer>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around p-3 pb-safe">
                    <button
                        onClick={() => setViewMode('playground')}
                        className={`flex flex-col items-center gap-1 ${viewMode === 'playground' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Layout className="w-5 h-5" />
                        <span className="text-[10px] font-bold">광장</span>
                    </button>
                    <button
                        onClick={() => setViewMode('builder')}
                        className={`flex flex-col items-center gap-1 ${viewMode === 'builder' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Code className="w-5 h-5" />
                        <span className="text-[10px] font-bold">제작소</span>
                    </button>
                    <button
                        onClick={() => setViewMode('hall_of_fame')}
                        className={`flex flex-col items-center gap-1 ${viewMode === 'hall_of_fame' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Trophy className="w-5 h-5" />
                        <span className="text-[10px] font-bold">명예의 전당</span>
                    </button>
                </div>
            </div>
        </ErrorBoundary>
    );
}
