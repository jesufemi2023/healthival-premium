import React, { useEffect, useState } from 'react';
import { BlogPost } from '../../types';
import { Calendar, ChevronRight, Tag, Eye, Flame, UserCheck } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

interface BlogListProps {
  onSelectPost: (id: string) => void;
}

export function BlogList({ onSelectPost }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch blogs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-slate-700">No articles found</h3>
        <p className="text-slate-500 mt-2">Check back later for new health insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Health & Wellness Insights</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover expert advice, natural remedies, and the latest in holistic health to support your well-being.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 cursor-pointer group flex flex-col relative"
            onClick={() => onSelectPost(post.id)}
          >
            <div className="aspect-[16/9] overflow-hidden relative bg-slate-100">
              <img 
                src={getOptimizedImageUrl(post.image_url || `https://picsum.photos/seed/supplement-article-${post.id}/800/600`, 800)} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-article-${post.id}/800/600`;
                }}
              />
              {post.category && (
                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow">
                  {post.category}
                </div>
              )}
              <div className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow flex items-center gap-1 animate-pulse">
                <Flame size={10} fill="currentColor" /> High Demand
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-1 text-emerald-600">
                  <UserCheck size={12} />
                  <span>Approved Content</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Eye size={12} />
                  <span>{Math.floor(Math.random() * 8000) + 3400} views</span>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
                {post.title}
              </h3>
              
              <p className="text-xs text-slate-500 mb-6 line-clamp-3 flex-1 font-medium leading-relaxed">
                {post.meta_description || post.content.substring(0, 150).replace(/[#*`]/g, '') + '...'}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Tag size={13} className="text-slate-400 shrink-0" />
                  <div className="flex gap-1 overflow-hidden">
                    {post.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                        {tag}{i < Math.min(post.tags.length, 2) - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-emerald-600 font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                  Read Breakthrough <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
