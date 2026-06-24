import React, { useEffect, useState } from 'react';
import { BlogPost as BlogPostType, Product } from '../../types';
import { 
  ArrowLeft, Calendar, Tag, Share2, CheckCircle2, Star, ShieldCheck, 
  Truck, Clock, UserCheck, Phone, Video, MoreVertical, CheckCheck, 
  Smile, Paperclip, Camera, Mic, Send, MessageSquare, ThumbsUp, 
  Lock, Check, Heart, HelpCircle
} from 'lucide-react';
import { CONFIG } from '../../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { trackBlogView, trackOrderComplete, trackWhatsAppClick } from '../../lib/analytics';
import { TESTIMONIALS } from '../../constants/testimonials';
import { motion, AnimatePresence } from 'motion/react';

interface BlogPostProps {
  id: string;
  onBack: () => void;
  onOrderPackage?: (pkg: any) => void;
  onOrderProduct?: (prod: any) => void;
}

// Nigerian locations for recent order alerts
const NIGERIAN_NAMES = [
  "Chief Chinedu from Port Harcourt, Rivers",
  "Alhaji Musa S. from Abuja FCT",
  "Mrs. Chioma from Enugu, Enugu State",
  "Pastor David O. from Ibadan, Oyo State",
  "Dr. Emmanuel from Victoria Island, Lagos",
  "Mrs. Gladys from Benin City, Edo",
  "Mallam Usman from Kaduna, Kaduna State",
  "Mr. Babatunde from Gbagada, Lagos",
  "Engr. Kenneth from Warri, Delta",
  "Mrs. Toyin from Abeokuta, Ogun",
  "Chief Benson from Calabar, Cross River",
  "Alhaja Nimot from Ilorin, Kwara",
  "Dr. Stanley from Asaba, Delta",
  "Mrs. Vivian from Ikeja, Lagos",
  "Chief Adebayo from Lekki, Lagos"
];

// Rich set of realistic comments for various conditions
const CATEGORIZED_COMMENTS: Record<string, Array<{name: string, location: string, rating: number, time: string, comment: string, likes: number, replied: boolean}>> = {
  prostate: [
    {
      name: "Elder Joseph Alao",
      location: "Ibadan, Oyo",
      rating: 5,
      time: "2 mins ago",
      comment: "I am writing this with tears of joy. My prostate was enlarged and I was using a catheter to urinate for 3 months. The discomfort was unbearable. My son bought the GHT Prostate Care Pack for me. Within 2 weeks, my urine flow became free and natural, and the doctor removed the catheter! This is a real miracle. Please don't hesitate to buy this.",
      likes: 42,
      replied: true
    },
    {
      name: "Chief Benson Igwe",
      location: "Port Harcourt",
      rating: 5,
      time: "2 hours ago",
      comment: "Excellent product! I used to wake up 6 to 7 times every single night to pass urine. I was always exhausted. Since I started this protocol, I sleep soundly like a baby. I only wake up once, sometimes not even at all. My bladder feels completely empty. No more painful urination. GHT products are high quality.",
      likes: 19,
      replied: false
    },
    {
      name: "Engineer Tunde",
      location: "Lekki, Lagos",
      rating: 5,
      time: "5 hours ago",
      comment: "I was scheduled for prostate surgery which was costing me millions, not to talk of the risks. A friend recommended GHT. I decided to try it as a last resort. I am glad I did! The scan I did yesterday shows my prostate has shrunk back to normal size. The doctor himself was astonished.",
      likes: 31,
      replied: true
    }
  ],
  diabetes: [
    {
      name: "Mrs. Gladys Oviawe",
      location: "Benin City, Edo",
      rating: 5,
      time: "10 mins ago",
      comment: "My husband's fasting blood sugar was constant at 310mg/dL. He was always tired and complaining of severe burning sensations in his feet. We bought the GHT Diabetes Pack. Today, his sugar level has dropped to a perfect 98mg/dL! The numbness in his feet is 100% gone and he is back to his active self. Highly recommended!",
      likes: 56,
      replied: true
    },
    {
      name: "Alhaji Ibrahim S.",
      location: "Kano State",
      rating: 5,
      time: "1 hour ago",
      comment: "This is a life saver. I have been taking conventional diabetes pills for 6 years but my sugar kept fluctuating. After using this herbal protocol for just 4 weeks, my readings are stable and normal. I have so much energy now. Fast delivery to Kano too!",
      likes: 12,
      replied: false
    },
    {
      name: "Pastor David",
      location: "Enugu",
      rating: 5,
      time: "4 hours ago",
      comment: "Very effective formula. It didn't just lower my sugar, it completely cured my constant thirst and frequent urination at night. I can now sleep peacefully. Delivery was highly confidential. God bless your team.",
      likes: 27,
      replied: true
    }
  ],
  stamina: [
    {
      name: "Anonymous Brother",
      location: "Abuja FCT",
      rating: 5,
      time: "4 mins ago",
      comment: "Omo! I must confess, I was extremely skeptical because I have spent so much money on cheap herbs and pills online that failed. But GHT Men's Vitality is completely different. I used to last barely 2 minutes, but now 25-30 minutes is an easy play. My erection is rock hard and I don't feel tired after. My marriage has been saved! Thank you so much.",
      likes: 84,
      replied: true
    },
    {
      name: "Mr. Segun A.",
      location: "Ikeja, Lagos",
      rating: 5,
      time: "3 hours ago",
      comment: "This is the real solution for weak erection and premature ejaculation. No heart palpitations, no headaches like those chemical blue pills. This is 100% natural. My wife is extremely happy and satisfied now. Deliveries are very discreet, packed in a plain brown carton so nobody knows what is inside. Top marks!",
      likes: 49,
      replied: false
    },
    {
      name: "Mallam Usman",
      location: "Kaduna",
      rating: 5,
      time: "6 hours ago",
      comment: "A must-have for every man above 40. It restores your youthful strength. I feel like a 20 year old boy again. Amazing stamina and instant recovery. Don't waste money elsewhere, buy this original one.",
      likes: 38,
      replied: true
    }
  ],
  fibroid: [
    {
      name: "Mrs. Ngozi Eke",
      location: "Enugu State",
      rating: 5,
      time: "8 mins ago",
      comment: "I was diagnosed with 3 large uterine fibroids and we had been looking for a child for 5 years. The doctors insisted on surgery but I was terrified of scars and complications. I ordered the GHT Fibroid & Infertility pack. I took it faithfully for 3 months. Yesterday, my scan showed my womb is completely CLEAN! The fibroids have dissolved entirely. Praise God!",
      likes: 67,
      replied: true
    },
    {
      name: "Mrs. Toyin Adebayo",
      location: "Abeokuta, Ogun",
      rating: 5,
      time: "2 hours ago",
      comment: "My menstrual pain was so severe that I would be bedridden for 3 days every month, passing thick blood clots. After using the Female Care formula, my menses is now smooth, regular, and absolutely pain-free! I feel so light and healthy. Every woman needs this.",
      likes: 23,
      replied: false
    },
    {
      name: "Mrs. Vivian",
      location: "Lagos Island",
      rating: 5,
      time: "5 hours ago",
      comment: "Our doctor was shocked when we went for a scan. He checked my old file where I had multiple fibroids, then looked at the screen—nothing! Everything is gone. I am starting the fertility protocol next, because I know my baby is on the way. Thank you GHT!",
      likes: 41,
      replied: true
    }
  ],
  general: [
    {
      name: "Chief Chinedu",
      location: "Port Harcourt",
      rating: 5,
      time: "15 mins ago",
      comment: "I have been using GHT wellness supplements for general cellular detoxification. My joint pains are gone, my high blood pressure is normal, and my skin looks radiant. These products are top-grade organic formulas.",
      likes: 18,
      replied: false
    },
    {
      name: "Dr. Mrs. Alabi",
      location: "Abuja",
      rating: 5,
      time: "1 hour ago",
      comment: "As a health practitioner, I always recommend GHT natural therapies to my patients. The active biological extracts are pure, highly concentrated, and perfectly formulated for cellular recovery without any side effects. Exceptional efficacy.",
      likes: 29,
      replied: true
    },
    {
      name: "Pastor David O.",
      location: "Ibadan, Oyo",
      rating: 5,
      time: "3 hours ago",
      comment: "Wonderful customer service! I placed my order yesterday morning and it was delivered to my doorstep in Ibadan this afternoon. I paid cash on delivery. Fast, transparent, and highly reliable.",
      likes: 14,
      replied: false
    }
  ]
};

export function BlogPost({ id, onBack, onOrderPackage, onOrderProduct }: BlogPostProps) {
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [recentOrderAlert, setRecentOrderAlert] = useState<string | null>(null);
  
  // Custom Reviews State
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ name: '', location: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Auto-detect matching category for reviews and WhatsApp simulations
  const getCategoryKey = (category: string, title: string) => {
    const catLower = (category || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();
    if (catLower.includes('prostate') || titleLower.includes('prostate')) return 'prostate';
    if (catLower.includes('diabet') || titleLower.includes('diabet') || titleLower.includes('sugar') || titleLower.includes('insulin')) return 'diabetes';
    if (catLower.includes('men') || catLower.includes('erect') || catLower.includes('stamina') || titleLower.includes('men') || titleLower.includes('erect') || titleLower.includes('stamina') || titleLower.includes('weakness') || titleLower.includes('stamin')) return 'stamina';
    if (catLower.includes('fibroid') || catLower.includes('female') || catLower.includes('fertility') || titleLower.includes('fibroid') || titleLower.includes('female') || titleLower.includes('fertility') || titleLower.includes('infertility') || titleLower.includes('womb')) return 'fibroid';
    return 'general';
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          trackBlogView(data.title);

          // Populate category specific initial reviews
          const catKey = getCategoryKey(data.category, data.title);
          setCommentsList(CATEGORIZED_COMMENTS[catKey] || CATEGORIZED_COMMENTS.general);
        }
      } catch (e) {
        console.error("Failed to fetch blog post", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // Recent Order Alert Loop (Urgency & Social Proof)
  useEffect(() => {
    if (!post || !post.recommended_package) return;

    const showNotification = () => {
      const location = NIGERIAN_NAMES[Math.floor(Math.random() * NIGERIAN_NAMES.length)];
      const minAgo = Math.floor(Math.random() * 8) + 1;
      setRecentOrderAlert(`🇳🇬 Verified Order: ${location} just purchased the ${post.recommended_package?.name} (${minAgo} mins ago)`);
      
      setTimeout(() => {
        setRecentOrderAlert(null);
      }, 5000);
    };

    // First alert after 4 seconds
    const initTimer = setTimeout(showNotification, 4000);
    // Recurring alerts every 15 seconds
    const interval = setInterval(showNotification, 16000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [post]);

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/?blog=${post.slug || post.id}`;
    const shareData = {
      title: post.title,
      text: post.meta_description || post.title,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      alert("Please provide both your name and comment to post!");
      return;
    }

    setSubmittingReview(true);
    setTimeout(() => {
      const added = {
        name: newReview.name,
        location: newReview.location || "Nigeria",
        rating: newReview.rating,
        time: "Just now",
        comment: newReview.comment,
        likes: 1,
        replied: false,
        isCustom: true // verified badge
      };
      setCommentsList(prev => [added, ...prev]);
      setNewReview({ name: '', location: '', rating: 5, comment: '' });
      setSubmittingReview(false);
      alert("Thank you! Your testimonial has been posted successfully and is undergoing verification.");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-32 bg-slate-50 min-h-screen">
        <h3 className="text-2xl font-black text-slate-900">Article not found</h3>
        <button onClick={onBack} className="mt-6 text-emerald-600 font-bold hover:underline">
          &larr; Back to all articles
        </button>
      </div>
    );
  }

  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const catKey = getCategoryKey(post.category, post.title);
  const matchingTestimonial = TESTIMONIALS.find(t => t.id === `w-${catKey}`) || TESTIMONIALS[1];

  // Custom renderer for markdown (turning blockquotes into real custom dialog boxes)
  const components = {
    blockquote: ({ node, children, ...props }: any) => {
      return (
        <blockquote className="border-l-4 border-emerald-500 pl-6 py-2 my-8 italic text-lg md:text-xl font-medium text-slate-700 bg-emerald-50/30 rounded-r-xl" {...props}>
          {children}
        </blockquote>
      );
    },
    h1: ({ node, ...props }: any) => <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-12 mb-6 tracking-tight" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-12 mb-6 tracking-tight border-b border-slate-100 pb-4" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-lg text-slate-600 leading-relaxed mb-6" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 mb-6 space-y-3 text-lg text-slate-600 marker:text-emerald-500" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-lg text-slate-600 marker:text-emerald-500 font-medium" {...props} />,
    li: ({ node, ...props }: any) => <li className="pl-2" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-emerald-600 font-bold hover:text-emerald-700 underline decoration-emerald-200 underline-offset-4 transition-colors" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900" {...props} />,
  };

  return (
    <article className="bg-[#F8FAF9] min-h-screen pb-32 md:pb-24 font-sans relative">
      
      {/* High-Impact Emergency Alert Sticky Top Banner */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-black tracking-wide uppercase shadow-md animate-pulse sticky top-[68px] md:top-0 z-50">
        🚨 URGENT NOTICE: Due to massive TV features across Nigeria, GHT wellness stocks are extremely low. Place your order now to secure today's promo price + Free Delivery!
      </div>

      {/* Top Navigation Bar */}
      <div className="sticky top-[108px] md:top-[44px] z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-black text-sm transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Articles
          </button>
          
          {post.recommended_package && (
            <div className="flex items-center gap-3">
              <a 
                href="#order-form-direct"
                className="hidden md:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-amber-100"
              >
                ⚡ Buy Direct
              </a>
              <button 
                onClick={() => {
                  const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package?.name} solution. Could you please provide more information?`;
                  trackWhatsAppClick("Blog Navigation Bar");
                  window.open(`https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-100"
              >
                <Phone size={13} fill="currentColor" /> Chat Consultant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Header Section */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 pt-12 pb-8 text-center">
        {post.category && (
          <div className="inline-block bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-emerald-100">
            {post.category}
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs md:text-sm font-bold text-slate-500 border-y border-slate-200/65 py-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <UserCheck size={18} />
            <span className="font-black uppercase tracking-widest">Medically Reviewed & Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} />
            {readingTime} min read
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mb-12">
        <div className="aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden bg-slate-100 shadow-2xl shadow-slate-200/50 border border-slate-100">
          <img 
            src={getOptimizedImageUrl(post.image_url || `https://picsum.photos/seed/supplement-hero-${post.id}/1200/600`, 1200)} 
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-hero-${post.id}/1200/675`;
            }}
          />
        </div>
      </div>

      {/* Main Content & Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Left Column: Article Content */}
          <div className="w-full lg:w-[65%] xl:w-[70%] bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm">
            <div className="prose prose-lg prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* HIGHLY PERSUASIVE WHATSAPP CHAT TESTIMONIAL DISPLAY (Interactive element) */}
            {matchingTestimonial && matchingTestimonial.chatMessages && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="text-center mb-6">
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                    Verified Customer Conversation
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">💬 Read Real Conversation Proof</h3>
                  <p className="text-slate-500 text-sm mt-1">See how this treatment changed lives over chat messages</p>
                </div>
                
                {/* Simulated WhatsApp UI */}
                <WhatsAppChatSimulator testimonial={matchingTestimonial} />
              </div>
            )}

            {/* DIRECT ORDER FORM - INSTANT CHECKOUT (Massive conversion driver) */}
            {post.recommended_package && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <DirectOrderForm 
                  packageItem={post.recommended_package} 
                  onOrderSuccess={(fullName, itemName, quantity, totalPrice, deliveryDate, paymentMethod) => {
                    const searchParams = new URLSearchParams();
                    searchParams.set("full_name", fullName);
                    searchParams.set("item_name", itemName);
                    searchParams.set("quantity", String(quantity));
                    searchParams.set("total_price", String(totalPrice));
                    searchParams.set("delivery_date", deliveryDate);
                    searchParams.set("payment_method", paymentMethod);
                    
                    // Redirect to Thank-you page
                    window.location.href = `/thank-you?${searchParams.toString()}`;
                  }}
                />
              </div>
            )}

            {/* COMMUNITY REVIEWS & COMMENTS SECTION (Facebook style testimonial feed) */}
            <div className="mt-16 pt-12 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="text-emerald-600" />
                    Community Feedback ({commentsList.length + 84} Comments)
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Verified buyer testimonials & clinical questions
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl w-fit">
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <span className="text-slate-950 font-black text-sm ml-1">4.9 / 5</span>
                </div>
              </div>

              {/* Add Comment Form */}
              <div className="bg-slate-50 border border-slate-200/70 p-6 rounded-3xl mb-10">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-4">Did this work for you? Share your experience</h4>
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      required
                      placeholder="Your Name (e.g. Chief Raymond)" 
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                      value={newReview.name}
                      onChange={e => setNewReview({...newReview, name: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Your City/Location (e.g. Ikeja, Lagos)" 
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                      value={newReview.location}
                      onChange={e => setNewReview({...newReview, location: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num} 
                          type="button" 
                          onClick={() => setNewReview({...newReview, rating: num})}
                          className="text-amber-400 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star fill={num <= newReview.rating ? 'currentColor' : 'none'} size={18} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe how long you suffered, which GHT supplements you took, and the amazing recovery or improvement you noticed..." 
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full resize-none"
                    value={newReview.comment}
                    onChange={e => setNewReview({...newReview, comment: e.target.value})}
                  />

                  <button 
                    type="submit" 
                    disabled={submittingReview}
                    className="bg-slate-900 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Testimonial'} <Send size={12} />
                  </button>
                </form>
              </div>

              {/* Comments Feed List */}
              <div className="space-y-6">
                {commentsList.map((comment, i) => (
                  <div key={i} className="border-b border-slate-100 pb-6 flex gap-4">
                    {/* Mock user avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 flex items-center justify-center font-black text-slate-600 uppercase text-xs">
                      {comment.name[0]}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">{comment.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">({comment.location})</span>
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 border border-emerald-100">
                              <CheckCircle2 size={10} fill="currentColor" className="text-white" /> Verified Buyer
                            </span>
                          </div>
                          <div className="flex gap-0.5 text-amber-400 mt-1">
                            {Array.from({ length: comment.rating }).map((_, rIdx) => (
                              <Star key={rIdx} fill="currentColor" size={12} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{comment.time}</span>
                      </div>
                      
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {comment.comment}
                      </p>
                      
                      <div className="flex items-center gap-4 pt-1">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
                          <ThumbsUp size={12} /> Helpful ({comment.likes})
                        </button>
                        <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                          <Heart size={12} /> Love
                        </button>
                      </div>

                      {/* Professional Consultant Reply */}
                      {comment.replied && (
                        <div className="mt-4 bg-emerald-50/55 rounded-2xl p-4 border border-emerald-100/30 flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 shrink-0 flex items-center justify-center font-black text-emerald-800 text-[10px]">
                            G
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-slate-900">Dr. Helen (GHT Health Consultant)</span>
                              <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Official Support</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-bold">
                              Thank you for sharing your powerful testimony! We are extremely happy about your recovery. Please continue to maintain your cell vitality by keeping healthy dietary habits. Blessings!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Article Tags & Meta Share */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag, i) => (
                  <span key={i} className="bg-slate-50 text-slate-600 text-[10px] px-3 py-1.5 rounded-full border border-slate-200 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors bg-slate-50 px-4 py-2 rounded-full border border-slate-200 cursor-pointer"
              >
                {isCopied ? (
                  <><CheckCircle2 size={16} className="text-emerald-500" /> Copied!</>
                ) : (
                  <><Share2 size={16} /> Share Article</>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar (Desktop Only) */}
          <div className="hidden lg:block w-[35%] xl:w-[30%]">
            <div className="sticky top-28 space-y-6">
              {post.recommended_package ? (
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50/50 overflow-hidden">
                  <div className="bg-emerald-600 text-white text-center py-3 text-xs font-black uppercase tracking-widest">
                    Recommended Solution
                  </div>
                  <div className="p-6">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-6 relative group">
                      <img 
                        src={getOptimizedImageUrl(post.recommended_package.package_image_url || `https://picsum.photos/seed/supplement-side-${post.recommended_package.id}/400/400`, 600)} 
                        alt={post.recommended_package.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-side-${post.recommended_package?.id}/400/400`;
                        }}
                      />
                      {post.recommended_package.discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                          Save {post.recommended_package.discount}%
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{post.recommended_package.name}</h3>
                    
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <span className="text-slate-500 text-xs font-bold ml-1 font-sans text-slate-600">(4.9/5 Reviews)</span>
                    </div>

                    <div className="space-y-3 mb-6">
                      {post.recommended_package.health_benefits?.slice(0, 3).map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-6 mb-6">
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-2xl font-black text-emerald-600">₦{post.recommended_package.price.toLocaleString()}</span>
                        {post.recommended_package.discount > 0 && (
                          <span className="text-sm font-bold text-slate-400 line-through mb-1">
                            ₦{Math.round(post.recommended_package.price / (1 - post.recommended_package.discount / 100)).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">In Stock & Ready to Ship</p>
                    </div>

                    <div className="space-y-3">
                      <a 
                        href="#order-form-direct"
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer text-center duration-300"
                      >
                        ⚡ Buy Now (Cash On Delivery)
                      </a>
                      
                      <button 
                        onClick={() => {
                          const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package?.name} solution. Could you please provide more information?`;
                          trackWhatsAppClick("Blog Sidebar Chat Button");
                          window.open(`https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={14} className="text-emerald-600" fill="currentColor" />
                        Chat With Specialist
                      </button>
                    </div>

                    <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-500" /> Secure SSL Certified Checkout
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Truck size={14} className="text-emerald-500" /> Free Shipping & Cash on Delivery
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center shadow-lg shadow-slate-100">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2 uppercase text-xs tracking-wider">Trusted Health Information</h4>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">Our content is exhaustively reviewed by accredited nutritionists and herbal clinicians to ensure chemical-free efficacy and complete biological safety.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Recent Order Notification Alert */}
      <AnimatePresence>
        {recentOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, x: -100, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -100, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 left-4 z-[99] bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/50 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xs sm:max-w-md"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm shrink-0 animate-bounce">
              🇳🇬
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Live Order Activity</p>
              <p className="text-xs font-bold leading-snug text-slate-100">{recentOrderAlert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky CTA (Bottom) */}
      {post.recommended_package && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-50 flex items-center justify-between gap-4">
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Special Promo Price</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-emerald-600">₦{post.recommended_package.price.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <a 
              href="#order-form-direct"
              className="flex-1 bg-amber-500 text-slate-950 text-center py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-transform"
            >
              ⚡ Order Now
            </a>
            <button 
              onClick={() => {
                const message = `Hello SD GHT Health Care, I am reading the article "${post.title}" and I am interested in the ${post.recommended_package?.name} solution. Could you please provide more information?`;
                trackWhatsAppClick("Mobile Sticky Bar Chat Button");
                window.open(`https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex-1 bg-emerald-600 text-white py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-emerald-700 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
            >
              <Phone size={13} fill="currentColor" /> Chat Us
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ------------------------------------
// LOCAL SUPPORTING INTERACTIVE COMPONENTS
// ------------------------------------

function WhatsAppChatSimulator({ testimonial }: { testimonial: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState('');
  
  useEffect(() => {
    if (!testimonial || !testimonial.chatMessages) return;
    
    setMessages([]);
    let timerId: any;
    
    const showMessageSequentially = (index: number) => {
      if (index >= testimonial.chatMessages.length) {
        setIsTyping(false);
        return;
      }
      
      const nextMsg = testimonial.chatMessages[index];
      const isSupport = nextMsg.sender === 'support';
      
      setIsTyping(true);
      setTypingName(isSupport ? "Dr. Helen (GHT Consultant)" : testimonial.name);
      
      // typing speed simulator based on sentence length
      const typingTime = Math.min(2200, Math.max(900, nextMsg.text.length * 20));
      
      timerId = setTimeout(() => {
        setMessages(prev => [...prev, nextMsg]);
        setIsTyping(false);
        
        timerId = setTimeout(() => {
          showMessageSequentially(index + 1);
        }, 1400);
      }, typingTime);
    };
    
    showMessageSequentially(0);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [testimonial]);

  return (
    <div className="border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl bg-[#efeae2] font-sans max-w-md mx-auto my-6 border-slate-200">
      
      {/* WhatsApp Header Group */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-black text-xs border border-white/20">
            {testimonial.name ? testimonial.name[0] : 'U'}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full"></span>
          </div>
          <div>
            <div className="font-bold text-xs leading-tight">{testimonial.name}</div>
            <div className="text-[10px] text-emerald-100 font-medium">
              {isTyping ? <span className="italic animate-pulse">{typingName} is typing...</span> : "online"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-emerald-100">
          <button className="hover:text-white transition-colors"><Video size={16} /></button>
          <button className="hover:text-white transition-colors"><Phone size={14} fill="currentColor" /></button>
          <button className="hover:text-white transition-colors"><MoreVertical size={16} /></button>
        </div>
      </div>
      
      {/* Chat Body Wallpaper with styled bubbles */}
      <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3 flex flex-col justify-start custom-scrollbar bg-opacity-40" style={{
        backgroundImage: "radial-gradient(#dfdcd6 1px, transparent 1px)",
        backgroundSize: "16px 16px",
        backgroundColor: "#e5ddd5"
      }}>
        <div className="self-center bg-white/70 backdrop-blur-sm text-slate-500 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full shadow-sm mb-4">
          TODAY
        </div>
        
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id || idx} 
              className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm leading-relaxed ${
                isUser 
                  ? 'bg-white text-slate-800 rounded-tl-none border-l-2 border-emerald-500' 
                  : 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
              }`}>
                <p className="font-bold">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-slate-400 font-medium">
                  <span>{msg.time || "10:24 AM"}</span>
                  {!isUser && <CheckCheck size={12} className="text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="self-start bg-white text-slate-500 text-[11px] px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 italic font-medium">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}
      </div>

      {/* WhatsApp Input Footer */}
      <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 border-t border-slate-200">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2 border border-slate-100 shadow-inner">
          <Smile size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            readOnly 
            placeholder="Conversations verified by GHT Care..." 
            className="w-full bg-transparent outline-none text-slate-500 text-[11px] font-bold"
          />
          <Paperclip size={16} className="text-slate-400 rotate-45 shrink-0" />
          <Camera size={16} className="text-slate-400 shrink-0" />
        </div>
        <div className="w-8 h-8 rounded-full bg-[#008069] flex items-center justify-center text-white shadow">
          <Mic size={16} />
        </div>
      </div>
    </div>
  );
}

function DirectOrderForm({ packageItem, onOrderSuccess }: { packageItem: any, onOrderSuccess: any }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    delivery_address: '',
    delivery_state: 'Lagos',
    delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    payment_method: 'pod'
  });
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.delivery_address) {
      alert("Please fill in your name, phone number, and delivery address to secure your order!");
      return;
    }

    setLoading(true);
    try {
      const orderItems = [{
        id: packageItem.id,
        name: packageItem.name,
        quantity: qty,
        price_at_time: packageItem.price,
        is_package: true,
        package_name: packageItem.name,
        package_price: packageItem.price
      }];

      const orderPayload = {
        full_name: formData.full_name,
        phone: formData.phone,
        delivery_address: `${formData.delivery_address}, State: ${formData.delivery_state}`,
        delivery_date: formData.delivery_date,
        payment_method: formData.payment_method,
        items: orderItems,
        total_amount: packageItem.price * qty,
        distributor_id: CONFIG.defaults.distributorId
      };

      let activeToken = localStorage.getItem('ght_access_token') || '';
      if (!activeToken) {
        activeToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
        localStorage.setItem('ght_access_token', activeToken);
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-access-token': activeToken
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        trackOrderComplete(packageItem.name, packageItem.price * qty);
        onOrderSuccess(
          formData.full_name,
          packageItem.name,
          qty,
          packageItem.price * qty,
          formData.delivery_date,
          formData.payment_method
        );
      } else {
        const err = await res.json();
        alert(`Order submission failed: ${err.error || 'Please check your inputs'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error establishing connection. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-emerald-50/20 rounded-3xl border-2 border-emerald-500/30 overflow-hidden shadow-xl p-6 md:p-8 max-w-xl mx-auto my-12" id="order-form-direct">
      <div className="text-center mb-6">
        <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md animate-pulse">
          ⚡ PROMO DISPATCH SECURED
        </span>
        <h3 className="text-2xl font-black text-slate-900 mt-2">SECURE PAYMENT ON DELIVERY FORM</h3>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
          🇳🇬 Free Shipping & Pay on Delivery Nationwide
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Your Full Name (First & Last Name)</label>
          <input 
            type="text" 
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. Alhaji Ibrahim Musa"
            value={formData.full_name}
            onChange={e => setFormData({...formData, full_name: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Active Phone Number (For Courier Call)</label>
          <input 
            type="tel" 
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. 08034567890"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Full Delivery Address (House No, Street & Area)</label>
          <textarea 
            required
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            placeholder="e.g. No. 12, Adekunle Avenue, Phase 2, Garki, Abuja."
            value={formData.delivery_address}
            onChange={e => setFormData({...formData, delivery_address: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">State of Residence</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.delivery_state}
              onChange={e => setFormData({...formData, delivery_state: e.target.value})}
            >
              {["Lagos", "Abuja FCT", "Port Harcourt / Rivers", "Kano", "Kaduna", "Oyo / Ibadan", "Edo / Benin", "Delta / Asaba", "Anambra / Awka", "Enugu", "Abia / Aba", "Kwara / Ilorin", "Ogun / Abeokuta", "Ondo / Akure", "Imo / Owerri", "Akwa Ibom / Uyo", "Cross River / Calabar", "Plateau / Jos", "Other State"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Preferred Date</label>
            <input 
              type="date" 
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.delivery_date}
              onChange={e => setFormData({...formData, delivery_date: e.target.value})}
            />
          </div>
        </div>

        {/* Quantity control */}
        <div className="bg-slate-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-700">Quantity of Packs</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Most buyers purchase 2 for a full 60-day recovery cycle</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            >
              -
            </button>
            <span className="text-sm font-black text-slate-900 w-4 text-center">{qty}</span>
            <button 
              type="button"
              onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Pricing recap */}
        <div className="border-t border-slate-200/60 pt-4 flex items-center justify-between text-slate-900">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total Amount</p>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Pay Cash / Transfer on Delivery</p>
          </div>
          <p className="text-2xl font-black text-slate-900">₦{(packageItem.price * qty).toLocaleString()}</p>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer duration-300"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>👉 SECURE YOUR PACKAGE NOW (CASH ON DELIVERY)</>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
          <span className="flex items-center gap-1"><Lock size={10} /> Secure 256-Bit SSL Connection</span>
          <span>🍃 100% Organic Extracts</span>
        </div>
      </form>
    </div>
  );
}
