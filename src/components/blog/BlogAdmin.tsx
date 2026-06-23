import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Plus, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface BlogAdminProps {
  onBlogGenerated: () => void;
  adminPassword: string;
}

export function BlogAdmin({ onBlogGenerated, adminPassword }: BlogAdminProps) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customCategory, setCustomCategory] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/recommended-packages');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPackages(data);
            if (data.length > 0) {
              setSelectedPackageId(data[0].id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch packages in BlogAdmin:", e);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const handleGenerate = async () => {
    if (!topic) {
      alert("Please enter a topic");
      return;
    }

    // Restore the original API Key Selection workflow
    const aistudio = (window as any).aistudio;
    let hasUserKey = false;
    if (aistudio) {
      try {
        hasUserKey = await aistudio.hasSelectedApiKey();
        if (!hasUserKey) {
          // We can still try with default key, but will prompt if it fails
        }
      } catch (e) {
        console.warn("API Key selection error:", e);
      }
    }

    setLoading(true);
    try {
      let apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : undefined) || process.env.GEMINI_API_KEY;
      if (apiKey === "MY_GEMINI_API_KEY") apiKey = undefined;
      
      const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

      // Dynamic Category and Intelligent Rule Detection
      let packageSearchTerm = '';
      let packageProducts: string[] = [];
      let packageBenefits: string[] = [];
      let packageSymptoms: string[] = [];
      let categoryName = 'Wellness';
      let targetPackageId: string | null = null;

      const selectedPkg = packages.find(p => p.id === selectedPackageId);
      
      if (selectedPkg && selectedPackageId !== 'custom') {
        targetPackageId = selectedPkg.id;
        packageSearchTerm = selectedPkg.name;
        categoryName = selectedPkg.name.replace(/Treatment|Package|Therapy|Solution|Kit|Combo|System|Set/gi, '').trim();
        
        // Extract product list for the package
        packageProducts = selectedPkg.package_products?.map((pp: any) => {
          if (pp.products && pp.products.name) return pp.products.name;
          if (pp.name) return pp.name;
          return null;
        }).filter(Boolean) || [];
        
        packageBenefits = selectedPkg.health_benefits || [];
        packageSymptoms = selectedPkg.symptoms || [];
      } else {
        categoryName = customCategory.trim() || 'Wellness';
      }

      let packageRecInstructions = '';
      if (selectedPkg && selectedPackageId !== 'custom') {
        packageRecInstructions = `
          The article MUST recommend the specific supplement package: "${selectedPkg.name}".
          This package contains the following specific products: ${packageProducts.length > 0 ? packageProducts.join(', ') : 'natural organic supplements'}.
          ${packageSymptoms.length > 0 ? `It is specially formulated to relieve symptoms like: ${packageSymptoms.join(', ')}.` : ''}
          ${packageBenefits.length > 0 ? `The key health benefits of this package include: ${packageBenefits.join(', ')}.` : ''}
          
          In the recommendation section of the article, you MUST recommend this package ("${selectedPkg.name}") explicitly as the ultimate therapeutic solution and explain how these components work synergistically to address the core medical conditions.
        `;
      } else {
        packageRecInstructions = `
          Recommend a general, natural organic supplement category or health solutions suited for the topic. Do not name specific proprietary brands.
        `;
      }

      // 2. Generate Content with AI
      const prompt = `
        You are a world-class health educator, elite direct-response health copywriter (like those at peak newsletter health publications), and cellular health researcher. Your copywriting has a 97% Conversion-Rate-Optimization (CRO) rating.
        Your goal is to write a highly compelling, robust, deeply educational, and scientifically authoritative health blog article for the topic: "${topic}" in the category: "${categoryName}".
        The reader must feel a profound sense of self-education, trust, and intense motivation to immediately take charge of their health by ordering the recommended wellness solution.

        Use the PAS (Problem-Agitation-Solution) direct copywriting framework:
        1. **The Core Hook & Problem**: Start with a high-impact, peer-reviewed medical insight or a striking biological fact that captures focus immediately. Explain the underlooked cellular/organic ROOT causes of the condition (e.g., declining Nitric Oxide levels, microCapillary congestion, arterial stiffness, chronic tissue inflammation, cellular toxicity, insulin/metabolic decline) rather than standard surface-level symptoms. 
        2. **Deep Agitation**: Paint an empathetic yet vivid, high-stakes picture of what happens when these biological bottlenecks are left unaddressed. Discuss the physical progression, decline in vitality, psychological toll, energy levels, marital harmony, and the burden of living with restricted health potential. 
        3. **The Illusions of Quick Fixes**: Briefly expose why conventional chemical or quick-fix synthetic drugs only mask structural issues or place massive stress on the liver and kidneys, leading to dependency or unwanted side effects.
        4. **The Science of Natural Synergy (The Solution)**: Reveal how an organic, scientifically targeted natural herbal protocol safely addresses the deep root cause at a cellular level, repairing tissues and restoring permanent organic balance.

        The article MUST include these literal markdown sections:

        ## 🔬 The Science Inside: Cellular Root Causes
        Deep dive into the cellular mechanisms. Use simple analogies but professional terminology.

        ## ⚠️ Why Waiting Compounds the Threat
        Highlight the silent progression of the biological bottleneck.

        ## 💬 A Private Consultation: Restoring Hope
        Explain that many readers feel overwhelmed or skeptical, and then write a "Real Customer Experience" using a WhatsApp-style testimonial conversation between a customer and a health consultant. 
        The dialogue must feel incredibly realistic, professional, deeply reassuring, and clear.
        
        CRITICAL FOR RENDERING - You MUST represent this conversation using exactly the blockquote syntax below, using the literal prefixes (**Customer:** and **Expert:**) on separate paragraph blocks:
        > **Customer:** "Insert realistic patient concern here, mentioning their skepticism after wasting money on cheap drugs, their specific embarrassing symptoms, and how long they suffered."
        > **Expert:** "Insert deeply empathetic and highly professional, informative expert response here, explaining how our synergistic wellness protocol addresses the root cause of their issue."
        > **Customer:** "Insert emotional breakthrough response, detailing how using the formula for just a few weeks completely resolved their issue, restored their energy, and brought joy back to their marriage/lifestyle."
        > **Expert:** "Insert follow-up encouragement here, thanking them and confirming that the organic ingredients are designed for long-term cell nourishment and zero side effects."

        ## 🌿 The Premium Natural Protocol: ${categoryName}
        ${packageRecInstructions}
        Detail the specific components, active biological compounds (e.g., zinc, active saponins, alkaloids, organic teas), and explain how they work together synergistically (1 + 1 = 10) to flood the body with reparative nutrients, restore vigor, and cleanse arterial/cellular pathways.

        ## ❓ Frequently Asked Questions
        Address the top 4 objections/prejudices intellectually:
        1. "Will this work for me if I've tried other natural therapies and failed?" (Address custom biological synergy and high concentration of our premium extracts)
        2. "How long does it take to see positive results?" (Set realistic physiological timelines while highlighting early signs of recovery)
        3. "Are there any side effects or interactions?" (Assure 100% organic, pure, additive-free safety certifications)
        4. "How do I securely order and receive my package?" (Highlight fast, highly confidential, discreet shipping with pristine brown paper packaging to protect privacy)

        ## 💡 Step-by-Step Vigor Action Plan
        Provide 3 simple, immediate daily health changes the reader can combine with the protocol for maximum speed of healing.

        Format the entire response as a JSON object with the following structure:
        {
          "title": "A highly compelling, curiosity-igniting, benefit-driven SEO title (not clickbafty, but irresistible to someone suffering from the issue)",
          "meta_description": "A high-CTR, compelling meta description summarizing the breakthrough information inside the article.",
          "content": "Entire Markdown formatted body using the sections above. Ensure headings use ##, subheadings use ###, bullet points are clear, and paragraphs are readable with beautiful typography spacing.",
          "tags": ["${categoryName}", "health", "wellness", "natural recovery", "healing"],
          "image_prompt": "A professional, medical-grade, realistic photo or 3D illustration representing ${topic}. Not cartoonish."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let blogData;
      try {
        blogData = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error("Failed to parse AI response as JSON.");
        throw new Error("The AI failed to format the article correctly. Please try again.");
      }

      // 3. Generate Image with AI
      let image_url = `https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop`; // High quality medical fallback
      try {
        // Use gemini-3.1-flash-image-preview if user has selected a key, otherwise fallback to 2.5
        const imageModel = hasUserKey ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

        const imageResponse = await ai.models.generateContent({
          model: imageModel,
          contents: blogData.image_prompt || `Professional medical photo about ${topic}`,
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });
        
        if (imageResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              image_url = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (e: any) {
        console.error("Failed to generate image, using high-quality fallback:", e);
        // Use a themed fallback based on categoryName
        const seeds: Record<string, string> = {
          'Diabetes': '1584036561566-baf8f5f1b144',
          'Prostate Health': '1576091160550-2173dba999ef',
          'Wellness': '1544367567-0f2fcb009e0b'
        };
        const photoId = seeds[categoryName] || '1576091160550-2173dba999ef';
        image_url = `https://images.unsplash.com/photo-${photoId}?q=80&w=800&auto=format&fit=crop`;
      }

      // 4. Send to backend to save
      const res = await fetch('/api/admin/save-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ 
          category: categoryName, 
          blogData, 
          image_url, 
          packageSearchTerm,
          recommendedPackageId: targetPackageId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate blog');
      }

      setTopic('');
      setCustomCategory('');
      onBlogGenerated();
      alert("Blog generated successfully!");
    } catch (e: any) {
      const errStr = String(e).toLowerCase();
      if (errStr.includes("requested entity was not found") || errStr.includes("api key not valid") || errStr.includes("api key not configured")) {
        alert("API Key issue. Please select your API key again.");
        if (aistudio) await aistudio.openSelectKey();
      } else {
        alert(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Blog Generator</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generate SEO-optimized health articles</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Health Package / Category</label>
          {loadingPackages ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Loader2 size={14} className="animate-spin" /> Loading categories...
            </div>
          ) : (
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
            >
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_combo ? '(Combo Kit)' : '(Wellness Solution)'}
                </option>
              ))}
              <option value="custom">✍️ Custom Category (Enter below)...</option>
            </select>
          )}
        </div>

        {selectedPackageId === 'custom' && (
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custom Category Name</label>
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Chronic Back Pain"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Article Topic / Keyword</label>
          <input 
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. Natural Ways to Improve Erectile Strength"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? 'Generating Article & Images...' : 'Generate Blog Post'}
        </button>
      </div>
    </div>
  );
}
